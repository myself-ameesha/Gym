from django.contrib.auth import authenticate
from rest_framework import status 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .permissions import IsAdmin, IsTrainer
from .serializers import UserSerializer, TrainerProfileSerializer ,TrainerBasicSerializer, WorkoutRoutineSerializer, WeeklyWorkoutCycleSerializer, TrainerAttendanceSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from .models import TrainerProfile, UserProfile
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from .models import MembershipPlan, AssignedDiet, WeeklyWorkoutCycle
from .serializers import MembershipPlanSerializer
from datetime import datetime
from .utils import send_otp_email
from .models import User, OTP
from .serializers import UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import MemberAttendance
from .serializers import MemberAttendanceSerializer
from .serializers import DefaultDietPlanSerializer, DietPlanSerializer, AssignedDietSerializer
from django.utils import timezone
from .models import DietPlan, WorkoutRoutine
from .serializers import DietPlanSerializer, WorkoutRoutineSerializer, DefaultDietPlanSerializer, TrainerRatingSerializer

from .models import User, OTP, MembershipPlan, Payment, DefaultDietPlan, TrainerRating, TrainerAttendance
from .serializers import UserSerializer, UserProfileSerializer
from django.core.exceptions import ObjectDoesNotExist
from .utils import send_otp_email
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
import razorpay 
from django.conf import settings
from django.db import IntegrityError
import logging
from rest_framework.permissions import AllowAny
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
import hmac
import hashlib
from datetime import datetime
from django.db.models import Sum
from django.utils.dateparse import parse_date
from django.http import HttpResponse
from django.template.loader import get_template
from datetime import timedelta


import secrets
import string
import logging
import subprocess
import tempfile
import os



#USER VIEW

User = get_user_model()
logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Registration request received with data: {data}")

        try:
            serializer = UserSerializer(data=data)
            if serializer.is_valid():
                # Save user with email_verified=False
                user = serializer.save(is_verified=False)
                
                # Generate OTP and send verification email
                otp = OTP.generate_otp(user)
                send_otp_email(user, otp.code)
                
                logger.info(f"User saved with membership_plan: {user.membership_plan}")
                logger.info(f"OTP sent to: {user.email}")
                
                return Response(
                    {
                        'message': 'User registered successfully. Check your email for verification code.',
                        'user_id': user.id,
                        'require_verification': True
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
  

@api_view(['POST'])
def calculate_bmi(request):
    try:
        height = float(request.data.get('height', 0))  # height in cm
        weight = float(request.data.get('weight', 0))  # weight in kg
        
        # Calculate BMI
        height_m = height / 100  # convert cm to meters
        bmi = weight / (height_m * height_m)
        bmi = round(bmi, 1)
        
        # Determine weight status
        if bmi < 18.5:
            status = "Underweight"
        elif 18.5 <= bmi < 25:
            status = "Healthy"
        elif 25 <= bmi < 30:
            status = "Overweight"
        else:
            status = "Obese"
            
        return Response({
            'bmi': bmi,
            'status': status
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


User = get_user_model()
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        logger.info(f"Login attempt with: {data.get('email')}")
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the user by email
            user = User.objects.get(email=email)
            logger.info(f"User found: {user.email}")
            
            # Check password
            if not user.check_password(password):
                logger.warning(f"Password check failed for user: {email}")
                return Response({'error': 'Incorrect email or password'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user is active
            if not user.is_active:
                logger.warning(f"Inactive user attempted login: {email}")
                return Response({'error': 'This account is inactive'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get user_type - try from both possible locations
            try:
                # First try to get user_type from User model
                user_role = user.user_type
            except AttributeError:
                # If that fails, try to get it from UserProfile
                try:
                    user_profile = UserProfile.objects.get(user=user)
                    # Check if UserProfile has user_type
                    user_role = getattr(user_profile, 'user_type', 'member')
                except (UserProfile.DoesNotExist, AttributeError):
                    # Default to member if no profile or no user_type
                    user_role = 'member'
            
            # However, if we have a trainer profile, override to trainer
            try:
                trainer_profile = TrainerProfile.objects.get(user=user)
                if trainer_profile:
                    user_role = 'trainer'
            except TrainerProfile.DoesNotExist:
                pass
                
            # Override with admin if superuser
            if user.is_superuser:
                user_role = 'admin'
                
            logger.info(f"User role determined as: {user_role}")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            refresh['user_type'] = user_role
            refresh['email'] = user.email
            
            # Get requires_password_reset - try both locations
            try:
                requires_password_reset = user.requires_password_reset
            except AttributeError:
                try:
                    user_profile = UserProfile.objects.get(user=user)
                    requires_password_reset = getattr(user_profile, 'requires_password_reset', False)
                except (UserProfile.DoesNotExist, AttributeError):
                    requires_password_reset = False
                    
            refresh['requires_password_reset'] = requires_password_reset
            
            logger.info(f"Login successful for: {email}")
            return Response({
                'email': user.email,
                'username': getattr(user, 'username', user.email),
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
                'user_type': user_role,
                'requires_password_reset': requires_password_reset,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.warning(f"User not found: {email}")
            return Response({'error': 'Incorrect email or password'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'error': 'An unexpected error occurred', 
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


class CreateRazorpayOrderView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email', '').lower().strip()
            membership_plan_id = request.data.get('membership_plan_id')
            
            if not email or not membership_plan_id:
                return Response(
                    {'error': 'Email and membership plan ID are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.get(email=email, user_type='member', is_verified=True)
            if user.has_paid:
                return Response(
                    {'error': 'Payment already completed for this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
            
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order_data = {
                'amount': int(membership_plan.price * 100),  # Amount in paise
                'currency': 'INR',
                'payment_capture': 1
            }
            order = client.order.create(data=order_data)
            
            payment = Payment.objects.create(
                user=user,
                membership_plan=membership_plan,
                amount=membership_plan.price,
                razorpay_order_id=order['id'],
                status='pending'
            )
            
            return Response({
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'key': settings.RAZORPAY_KEY_ID,
                'user': {
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip(),
                    'contact': user.phone_number or ''
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found or not verified'},
                status=status.HTTP_404_NOT_FOUND
            )
        except MembershipPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid membership plan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Razorpay order creation error: {str(e)}")
            return Response(
                {'error': 'Failed to create payment order'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyRazorpayPaymentView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            razorpay_order_id = request.data.get('razorpay_order_id')
            razorpay_payment_id = request.data.get('razorpay_payment_id')
            razorpay_signature = request.data.get('razorpay_signature')
            
            if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
                logger.warning("Missing payment details in verification request")
                return Response(
                    {'error': 'Missing payment details'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Attempting to verify payment for order_id: {razorpay_order_id}")
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id, status='pending')
            
            # Verify signature
            generated_signature = hmac.new(
                key=settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            if generated_signature != razorpay_signature:
                payment.status = 'failed'
                payment.save()
                logger.warning(f"Invalid payment signature for order_id: {razorpay_order_id}")
                return Response(
                    {'error': 'Invalid payment signature'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update payment and user
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'completed'
            payment.save()
            
            user = payment.user
            user.has_paid = True
            user.is_active = True
            user.save()
            
            logger.info(f"Payment verified successfully for user: {user.email}, order_id: {razorpay_order_id}")
            return Response({
                'message': 'Payment verified successfully',
                'payment_id': payment.id
            }, status=status.HTTP_200_OK)
            
        except Payment.DoesNotExist:
            logger.error(f"Payment order not found for order_id: {razorpay_order_id}")
            return Response(
                {'error': 'Payment order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return Response(
                {'error': 'Failed to verify payment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response(
                {'error': 'Email and OTP code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            otp = OTP.objects.filter(
                user=user,
                code=otp_code,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp:
                return Response(
                    {'error': 'Invalid OTP code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not otp.is_valid():
                return Response(
                    {'error': 'OTP has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            otp.is_used = True
            otp.save()
            
            user.is_verified = True
            user.save()
            
            return Response({
                'message': 'Email verification successful',
                'email': user.email,
                'requires_payment': user.user_type == 'member' and not user.has_paid,
                'membership_plan_id': user.membership_plan.id if user.membership_plan else None
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class TrainerPasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.user_type != 'trainer' or not user.requires_password_reset:
            return Response({'error': 'Password reset not required or not authorized'}, status=status.HTTP_403_FORBIDDEN)

        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.requires_password_reset = False
        user.save()
        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)


class CheckPasswordResetRequiredView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'requires_password_reset': request.user.requires_password_reset
        }, status=status.HTTP_200_OK)
    



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_member(request):
    """
    Retrieve the details of the currently logged-in member.
    """
    try:
        user = request.user
        if user.user_type != 'member':
            return Response(
                {'error': 'Only members can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

       
class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Check if user is already verified
            if user.is_verified:
                return Response(
                    {'message': 'User is already verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate new OTP and send email
            otp = OTP.generate_otp(user)
            send_otp_email(user, otp.code)
            
            return Response(
                {'message': 'Verification code sent to your email'},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_member_trainer(request, member_id):
    """
    Get the trainer assigned to a specific member.
    This endpoint can be accessed by admins or the member themselves.
    """
    try:
        # Get the member
        try:
            member = User.objects.get(id=member_id, user_type='member')
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission - only admin or the member themselves can access this
        if not request.user.user_type == 'admin' and request.user.id != member_id:
            return Response(
                {'error': 'You do not have permission to view this information'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get trainer information if assigned
        if member.assigned_trainer:
            trainer_data = {
                'id': member.assigned_trainer.id,
                'name': f"{member.assigned_trainer.first_name} {member.assigned_trainer.last_name}",
                'email': member.assigned_trainer.email,
                'specialization': member.assigned_trainer.specialization
            }
        else:
            trainer_data = None
        
        return Response({
            'member_id': member.id,
            'member_name': f"{member.first_name} {member.last_name}",
            'assigned_trainer': trainer_data
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

  


class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, user_type='member')
            
            if not user.is_active:
                return Response(
                    {'error': 'This account is inactive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Generate OTP
            otp = OTP.generate_otp(user)
            send_otp_email(user, otp.code)
            
            return Response(
                {
                    'message': 'OTP sent to your email',
                    'email': email
                },
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'No member found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Forgot password request error: {str(e)}")
            return Response(
                {'error': 'An error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForgotPasswordVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response(
                {'error': 'Email and OTP code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, user_type='member')
            otp = OTP.objects.filter(
                user=user,
                code=otp_code,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp:
                return Response(
                    {'error': 'Invalid OTP code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not otp.is_valid():
                return Response(
                    {'error': 'OTP has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
            return Response(
                {
                    'message': 'OTP verified successfully',
                    'email': email
                },
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'No member found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return Response(
                {'error': 'An error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([email, new_password, confirm_password]):
            return Response(
                {'error': 'Email, new password, and confirm password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(email=email, user_type='member')
            
            # Validate password
            try:
                validate_password(new_password, user=user)
            except ValidationError as e:
                return Response(
                    {'error': list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update password
            user.set_password(new_password)
            user.requires_password_reset = False
            user.save()
            
            return Response(
                {'message': 'Password reset successfully'},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'No member found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return Response(
                {'error': 'An error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ForgotPasswordResendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, user_type='member')
            
            if not user.is_active:
                return Response(
                    {'error': 'This account is inactive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there's a recent OTP request (rate limiting)
            try:
                recent_otp = OTP.objects.filter(
                    user=user,
                    created_at__gte=timezone.now() - timedelta(minutes=1)
                ).exists()
                
                if recent_otp:
                    return Response(
                        {'error': 'Please wait before requesting another OTP'},
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )
            except Exception as rate_limit_error:
                logger.warning(f"Rate limit check failed: {str(rate_limit_error)}")
                # Continue without rate limiting if there's an issue
            
            # Mark all previous OTPs as used
            try:
                OTP.objects.filter(user=user, is_used=False).update(is_used=True)
            except Exception as update_error:
                logger.warning(f"Failed to update old OTPs: {str(update_error)}")
            
            # Generate new OTP
            otp = OTP.generate_otp(user)
            
            # Send email
            try:
                send_otp_email(user, otp.code)
            except Exception as email_error:
                logger.error(f"Failed to send OTP email: {str(email_error)}")
                return Response(
                    {'error': 'Failed to send OTP email'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                {
                    'message': 'New OTP sent to your email',
                    'email': email
                },
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'No member found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}")
            return Response(
                {'error': 'An error occurred while processing your request'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_trainer_rating(request):
    """
    Submit or update a rating for a trainer by a member.
    """
    try:
        if request.user.user_type != 'member':
            return Response(
                {'error': 'Only members can submit ratings'},
                status=status.HTTP_403_FORBIDDEN
            )

        trainer_id = request.data.get('trainer_id')
        rating = request.data.get('rating')
        feedback = request.data.get('feedback', '')

        if not trainer_id:
            return Response(
                {'error': 'Trainer ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not rating:
            return Response(
                {'error': 'Rating is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            trainer = User.objects.get(id=trainer_id, user_type='trainer', is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid trainer ID or trainer not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the trainer is assigned to this member
        if not hasattr(request.user, 'assigned_trainer') or request.user.assigned_trainer != trainer:
            return Response(
                {'error': 'You can only rate your assigned trainer'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            rating_value = int(rating)
            if rating_value < 1 or rating_value > 5:
                return Response(
                    {'error': 'Rating must be between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Rating must be a valid number'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or update the rating
        rating_obj, created = TrainerRating.objects.update_or_create(
            member=request.user,
            trainer=trainer,
            defaults={'rating': rating_value, 'feedback': feedback}
        )

        serializer = TrainerRatingSerializer(rating_obj)
        return Response(
            {
                'rating': serializer.data,
                'message': 'Rating submitted successfully' if created else 'Rating updated successfully'
            }, 
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    except Exception as e:
        print(f"Rating submission error: {str(e)}")  # For debugging
        return Response(
            {'error': 'An error occurred while processing your request'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


          
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user != request.user and request.user.user_type != 'admin':
                return Response({'detail': 'Not authorized to view this user'}, status=status.HTTP_403_FORBIDDEN)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user != request.user and request.user.user_type != 'admin':
                return Response({'detail': 'Not authorized to update this user'}, status=status.HTTP_403_FORBIDDEN)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        



class ChangeMembershipPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            membership_plan_id = request.data.get('membership_plan_id')
            if not membership_plan_id:
                logger.warning("Missing membership plan ID in change subscription request")
                return Response(
                    {'error': 'Membership plan ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = request.user
            if user.user_type != 'member':
                logger.warning(f"Non-member user {user.email} attempted to change subscription")
                return Response(
                    {'error': 'Only members can change subscriptions'},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
            except MembershipPlan.DoesNotExist:
                logger.warning(f"Invalid membership plan ID: {membership_plan_id}")
                return Response(
                    {'error': 'Invalid membership plan'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order_data = {
                'amount': int(membership_plan.price * 100),  # Amount in paise
                'currency': 'INR',
                'payment_capture': 1
            }
            order = client.order.create(data=order_data)

            payment = Payment.objects.create(
                user=user,
                membership_plan=membership_plan,
                amount=membership_plan.price,
                razorpay_order_id=order['id'],
                status='pending'
            )

            logger.info(f"Created Razorpay order {order['id']} for user {user.email}")
            return Response({
                'order_id': order['id'],
                'amount': order['amount'],
                'currency': order['currency'],
                'key': settings.RAZORPAY_KEY_ID,
                'user': {
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip(),
                    'contact': user.phone_number or ''
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error creating change subscription order: {str(e)}")
            return Response(
                {'error': 'Failed to create payment order'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyChangeMembershipPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            razorpay_order_id = request.data.get('razorpay_order_id')
            razorpay_payment_id = request.data.get('razorpay_payment_id')
            razorpay_signature = request.data.get('razorpay_signature')

            if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
                logger.warning("Missing payment details in change subscription verification request")
                return Response(
                    {'error': 'Missing payment details'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id, status='pending', user=request.user)

            generated_signature = hmac.new(
                key=settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()

            if generated_signature != razorpay_signature:
                payment.status = 'failed'
                payment.save()
                logger.warning(f"Invalid payment signature for order_id: {razorpay_order_id}")
                return Response(
                    {'error': 'Invalid payment signature'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'completed'
            payment.save()

            user = request.user
            user.membership_plan = payment.membership_plan
            user.has_paid = True
            user.is_active = True
            user.save()

            logger.info(f"Subscription changed successfully for user: {user.email}, new plan: {payment.membership_plan.name}")
            return Response({
                'message': 'Subscription changed successfully',
                'payment_id': payment.id,
                'new_plan': {
                    'id': payment.membership_plan.id,
                    'name': payment.membership_plan.name,
                    'price': str(payment.membership_plan.price),
                    'duration_days': payment.membership_plan.duration_days
                }
            }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            logger.error(f"Payment order not found for order_id: {razorpay_order_id}")
            return Response(
                {'error': 'Payment order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Change subscription verification error: {str(e)}")
            return Response(
                {'error': 'Failed to verify payment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MemberDailyWorkoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, member_id, date):
        try:
            member = User.objects.get(id=member_id, user_type='member')
            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {'error': 'You can only view your own workouts or those of your assigned members'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Parse the requested date
            try:
                selected_date = datetime.strptime(date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Get the active weekly workout cycle
            cycle = WeeklyWorkoutCycle.objects.filter(member=member, is_active=True).first()
            if not cycle:
                return Response(
                    {'message': 'No active workout cycle found'},
                    status=status.HTTP_200_OK
                )
            # Calculate the day number (1-7) based on the date
            days_since_start = (selected_date - cycle.start_date).days % 7 + 1
            if days_since_start == 7:
                return Response({
                    'message': 'Recovery Day',
                    'day_number': 7,
                    'workout': None
                }, status=status.HTTP_200_OK)
            # Fetch the workout for the calculated day
            workout = WorkoutRoutine.objects.filter(member=member, day_number=days_since_start).first()
            if not workout:
                return Response({
                    'message': f'No workout assigned for Day {days_since_start}',
                    'day_number': days_since_start,
                    'workout': None
                }, status=status.HTTP_200_OK)
            serializer = WorkoutRoutineSerializer(workout)
            return Response({
                'day_number': days_since_start,
                'workout': serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class DietPlanHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        logger.info(f"Fetching diet plan history for member {member_id}")
        try:
            member = User.objects.get(id=member_id, user_type='member')
            if request.user.user_type != 'admin' and request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {'error': 'You can only view your own diet plans or those of your assigned members'},
                    status=status.HTTP_403_FORBIDDEN
                )
            diet_plans = DietPlan.objects.filter(member=member)
            serializer = DietPlanSerializer(diet_plans, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class CurrentDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        logger.info(f"Fetching current diet plan for member {member_id}")
        try:
            member = User.objects.get(id=member_id, user_type='member')
            if request.user.user_type != 'admin' and request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {'error': 'You can only view your own diet plan or those of your assigned members'},
                    status=status.HTTP_403_FORBIDDEN
                )
            assigned_diet = AssignedDiet.objects.filter(member=member, is_active=True).first()
            if not assigned_diet:
                return Response(
                    {'message': 'No active diet plan found'},
                    status=status.HTTP_200_OK
                )
            serializer = DietPlanSerializer(assigned_diet.diet_plan)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_member_ratings(request):
    """
    Get all ratings submitted by the authenticated member.
    """
    try:
        if request.user.user_type != 'member':
            return Response(
                {'error': 'Only members can view their own ratings'},
                status=status.HTTP_403_FORBIDDEN
            )

        ratings = TrainerRating.objects.filter(member=request.user).order_by('-created_at')
        serializer = TrainerRatingSerializer(ratings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Get member ratings error: {str(e)}")  # For debugging
        return Response(
            {'error': 'An error occurred while fetching your ratings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



