from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum
from django.http import HttpResponse
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_exempt

from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from api.models import User, MembershipPlan, Payment, TrainerAttendance, TrainerProfile
from api.permissions import IsAdmin
from api.serializers import UserSerializer, TrainerBasicSerializer, TrainerAttendanceSerializer, MembershipPlanSerializer, TrainerProfileSerializer

from datetime import datetime
import secrets
import string
import logging
import subprocess
import tempfile
import os


#ADMIN VIEW

User = get_user_model()
logger = logging.getLogger(__name__)

class PaidMembersListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            # Filter for members who have paid
            paid_members = User.objects.filter(user_type='member', has_paid=True, is_active=True)
            logger.info(f"Fetching paid members for admin: {request.user.email}, found {paid_members.count()} members")
            
            serializer = UserSerializer(paid_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching paid members: {str(e)}")
            return Response({
                'error': 'An unexpected error occurred',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def users_list(request):
    """
    List all trainers in the system.
    """
    members = User.objects.filter(user_type='member').select_related('membership_plan').order_by('username')
    serializer = UserSerializer(members, many=True)
    return Response({"users": serializer.data})



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_trainers(request):
    """
    List all trainers in the system.
    """
    trainers = User.objects.filter(user_type='trainer')
    serializer = UserSerializer(trainers, many=True)
    return Response(serializer.data)


# @api_view(['PUT'])
# @permission_classes([IsAuthenticated, IsAdmin])
# def edit_trainer(request, pk):
#     """
#     Edit a specific trainer by ID.
#     """
#     try:
#         trainer = User.objects.get(id=pk, user_type='trainer')
#         serializer = UserSerializer(trainer, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#     except User.DoesNotExist:
#         return Response({"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND)
    



@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def edit_trainer(request, pk):
    """
    Edit a specific trainer by ID, including profile image.
    """
    try:
        trainer = User.objects.get(id=pk, user_type='trainer')
        # Handle user data
        user_data = {k: v for k, v in request.data.items() if k in ['first_name', 'last_name', 'email', 'specialization']}
        user_serializer = UserSerializer(trainer, data=user_data, partial=True)
        
        if not user_serializer.is_valid():
            logger.warning("Invalid user data for trainer %s: %s", pk, user_serializer.errors)
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_serializer.save()
        
        # Handle trainer profile data
        try:
            trainer_profile = TrainerProfile.objects.get(user=trainer)
            profile_data = {}
            if 'profile_img' in request.FILES:
                profile_data['profile_img'] = request.FILES['profile_img']
            elif request.data.get('profile_img') == '':
                profile_data['profile_img'] = None
            
            if profile_data:
                profile_serializer = TrainerProfileSerializer(trainer_profile, data=profile_data, partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()
                else:
                    logger.warning("Invalid profile data for trainer %s: %s", pk, profile_serializer.errors)
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TrainerProfile.DoesNotExist:
            if 'profile_img' in request.FILES:
                profile_serializer = TrainerProfileSerializer(data={'profile_img': request.FILES['profile_img'], 'user': trainer})
                if profile_serializer.is_valid():
                    profile_serializer.save(user=trainer)
                else:
                    logger.warning("Invalid profile creation for trainer %s: %s", pk, profile_serializer.errors)
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare response with updated user and profile data
        response_data = {
            **user_serializer.data,
            'trainer_profile': TrainerProfileSerializer(TrainerProfile.objects.get(user=trainer)).data
        }
        logger.info("Trainer %s successfully updated", pk)
        return Response(response_data, status=status.HTTP_200_OK)
    
    except User.DoesNotExist:
        logger.error("Trainer %s not found", pk)
        return Response({'error': 'Trainer not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error updating trainer %s: %s", pk, str(e), exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_trainer(request, pk):
    """
    Delete a specific trainer by ID.
    """
    try:
        trainer = User.objects.get(id=pk, user_type='trainer')
        trainer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND)

class ResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            new_password = request.data.get('new_password')
            
            if not new_password:
                return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set the new password
            user.set_password(new_password)
            
            # Mark that password has been reset (no longer requires reset)
            user.requires_password_reset = False
            user.save()
            
            # Generate new tokens (since password changed)
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            user_role = getattr(user, 'user_type', 'member')
            if user.is_superuser:
                user_role = 'admin'
                
            refresh['user_type'] = user_role
            refresh['email'] = user.email
            refresh['requires_password_reset'] = False
            
            return Response({
                'message': 'Password updated successfully',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to update password',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# @method_decorator(csrf_exempt, name='dispatch')
# class CreateTrainerView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsAdmin]
    
#     def post(self, request):
#         print("Request reached CreateTrainerView")
#         print(type(request.user))
#         print(f"Authenticated user: {request.user}, user_type: {request.user.user_type}")
#         try:
#             logger.info(f"Trainer creation attempt by {request.user.email} at {datetime.now()}")
#             email = request.data.get('email', '').lower().strip()
#             first_name = request.data.get('first_name', '').strip()
#             last_name = request.data.get('last_name', '').strip()
#             specialization = request.data.get('specialization', '').strip()

#             if not all([email, first_name, last_name]):
#                 logger.warning("Missing required fields in trainer creation")
#                 return Response(
#                     {'error': 'Email, first name, and last name are required'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             if '@' not in email or '.' not in email.split('@')[-1]:
#                 return Response(
#                     {'error': 'Invalid email format'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             if User.objects.filter(email=email).exists():
#                 logger.warning(f"Attempt to create duplicate trainer with email: {email}")
#                 return Response(
#                     {'error': 'A user with this email already exists'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
#             temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

#             trainer = User.objects.create_user(
#                 email=email,
#                 password=temp_password,
#                 first_name=first_name,
#                 last_name=last_name,
#                 user_type='trainer',
#                 specialization=specialization,
#                 requires_password_reset=True,
#                 is_active=True
#             )

#             # Create trainer profile without the problematic fields
#             TrainerProfile.objects.create(
#                 user=trainer
#                 # No specialization or created_by here
#             )

#             # Send email to the trainer
#             subject = 'Your Trainer Account Details'
#             message = (
#                 f"Dear {first_name} {last_name},\n\n"
#                 f"Your trainer account has been successfully created.\n\n"
#                 f"Email: {email}\n"
#                 f"Temporary Password: {temp_password}\n\n"
#                 f"Please log in using these credentials and change your password upon first login.\n\n"
#                 f"Best regards,\n"
#                 f"Your Gym Management Team"
#             )
#             from_email = settings.DEFAULT_FROM_EMAIL
#             recipient_list = [email]

#             try:
#                 send_mail(
#                     subject,
#                     message,
#                     from_email,
#                     recipient_list,
#                     fail_silently=False,
#                 )
#                 logger.info(f"Email sent successfully to {email}")
#             except Exception as e:
#                 logger.error(f"Failed to send email to {email}: {str(e)}")
#                 # Optionally, you can decide whether to fail the request or continue
#                 # Here, we'll continue but log the error
#                 # return Response(
#                 #     {'error': 'Trainer created but failed to send email', 'details': str(e)},
#                 #     status=status.HTTP_201_CREATED
#                 # )

#             response_data = {
#                 'message': 'Trainer created successfully',
#                 'trainer': {
#                     'id': trainer.id,
#                     'email': trainer.email,
#                     'first_name': trainer.first_name,
#                     'last_name': trainer.last_name,
#                     'user_type': trainer.user_type,
#                     'specialization': trainer.specialization,
#                     'is_active': trainer.is_active
#                 },
#                 'temp_password': temp_password,
#                 'requires_password_reset': True,
#                 'created_at': datetime.now().isoformat(),
#                 'created_by': request.user.email
#             }

#             logger.info(f"Trainer {email} created successfully by {request.user.email}")
#             return Response(response_data, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             logger.error(f"Error creating trainer: {str(e)}\nRequest data: {request.data}")
#             return Response(
#                 {'error': 'Failed to create trainer', 'details': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


@method_decorator(csrf_exempt, name='dispatch')
class CreateTrainerView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        logger.info(f"Trainer creation attempt by {request.user.email} at {datetime.now()}")
        logger.info(f"Request data: {dict(request.data)}")
        logger.info(f"Request files: {dict(request.FILES)}")
        try:
            email = request.data.get('email', '').lower().strip()
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            specialization = request.data.get('specialization', '').strip()
            profile_img = request.FILES.get('profile_img')

            if not all([email, first_name, last_name]):
                logger.warning("Missing required fields in trainer creation")
                return Response(
                    {'error': 'Email, first name, and last name are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if '@' not in email or '.' not in email.split('@')[-1]:
                return Response(
                    {'error': 'Invalid email format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                logger.warning(f"Attempt to create duplicate trainer with email: {email}")
                return Response(
                    {'error': 'A user with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

            trainer = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=first_name,
                last_name=last_name,
                user_type='trainer',
                specialization=specialization,
                requires_password_reset=True,
                is_active=True
            )

            # Create trainer profile with profile_img if provided
            trainer_profile_data = {'user': trainer}
            if profile_img:
                trainer_profile_data['profile_img'] = profile_img
                logger.info(f"Profile image provided: {profile_img.name}")
            else:
                logger.info("No profile image provided")
            trainer_profile = TrainerProfile.objects.create(**trainer_profile_data)

            # Verify image saved
            if trainer_profile.profile_img:
                logger.info(f"Profile image saved at: {trainer_profile.profile_img.path}")
                logger.info(f"Profile image URL: {trainer_profile.profile_img.url}")
            else:
                logger.info("No profile image saved")

            # Serialize the trainer profile
            profile_serializer = TrainerProfileSerializer(trainer_profile)
            user_serializer = UserSerializer(trainer)

            # Send email to the trainer
            subject = 'Your Trainer Account Details'
            message = (
                f"Dear {first_name} {last_name},\n\n"
                f"Your trainer account has been successfully created.\n\n"
                f"Email: {email}\n"
                f"Temporary Password: {temp_password}\n\n"
                f"Please log in using these credentials and change your password upon first login.\n\n"
                f"Best regards,\n"
                f"Your Gym Management Team"
            )
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [email]

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                logger.info(f"Email sent successfully to {email}")
            except Exception as e:
                logger.error(f"Failed to send email to {email}: {str(e)}")

            response_data = {
                'message': 'Trainer created successfully',
                'trainer': user_serializer.data,
                'trainer_profile': profile_serializer.data,
                'temp_password': temp_password,
                'requires_password_reset': True,
                'created_at': datetime.now().isoformat(),
                'created_by': request.user.email
            }

            logger.info(f"Trainer {email} created successfully by {request.user.email}")
            logger.info(f"Response data: {response_data}")
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating trainer: {str(e)}\nRequest data: {dict(request.data)}\nRequest files: {dict(request.FILES)}")
            return Response(
                {'error': 'Failed to create trainer', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




@method_decorator(csrf_exempt, name='dispatch')
class CreateMembershipPlanView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        try:
            logger.info(f"Membership plan creation attempt by {request.user.email} at {datetime.now()}")
            name = request.data.get('name', '').strip()
            description = request.data.get('description', '').strip()
            price = request.data.get('price')
            duration_days = request.data.get('duration_days')

            if not all([name, price, duration_days]):
                logger.warning("Missing required fields in membership plan creation")
                return Response(
                    {'error': 'Name, price, and duration are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                price = float(price)
                duration_days
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid price or duration format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if MembershipPlan.objects.filter(name=name).exists():
                logger.warning(f"Attempt to create duplicate membership plan with name: {name}")
                return Response(
                    {'error': 'A membership plan with this name already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            plan = MembershipPlan.objects.create(
                name=name,
                description=description,
                price=price,
                duration_days=duration_days,
                is_active=True
            )

            response_data = {
                'message': 'Membership plan created successfully',
                'plan': {
                    'id': plan.id,
                    'name': plan.name,
                    'description': plan.description,
                    'price': str(plan.price),
                    'duration_days': plan.duration_days,
                    'is_active': plan.is_active,
                    'created_at': plan.created_at.isoformat(),
                    'created_by': request.user.email
                }
            }

            logger.info(f"Membership plan {name} created successfully by {request.user.email}")
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating membership plan: {str(e)}\nRequest data: {request.data}")
            return Response(
                {'error': 'Failed to create membership plan', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_membership_plan(request):
    try:
        user = request.user
        membership_plan_id = request.data.get('membership_plan_id')
        
        if not membership_plan_id:
            return Response(
                {'error': 'Membership plan ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid membership plan selected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize payment (assuming Razorpay integration)
        try:
            # This is a placeholder for Razorpay order creation
            order_data = {
                'key': 'razorpay_key',  # Replace with actual Razorpay key
                'amount': int(membership_plan.price * 100),  # Amount in paise
                'currency': 'INR',
                'order_id': f'order_{user.id}_{int(timezone.now().timestamp())}',
                'user': {
                    'email': user.email,
                    'name': f'{user.first_name} {user.last_name}',
                    'contact': user.phone_number or '',
                }
            }
            return Response(order_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error initiating payment for user {user.email}: {str(e)}")
            return Response(
                {'error': 'Failed to initiate payment', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        logger.error(f"Error changing membership plan: {str(e)}\nRequest data: {request.data}")
        return Response(
            {'error': 'Failed to change membership plan', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_change_membership_payment(request):
    try:
        user = request.user
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        membership_plan_id = request.data.get('membership_plan_id')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, membership_plan_id]):
            return Response(
                {'error': 'Missing required payment verification fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid membership plan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify Razorpay payment (placeholder logic)
        # In a real implementation, verify the signature using Razorpay's utility
        try:
            # Update user's membership plan
            user.membership_plan = membership_plan
            user.membership_start_date = timezone.now()
            user.is_subscribed = True
            user.has_paid = True
            user.save()

            return Response(
                {
                    'message': 'Membership plan updated successfully',
                    'plan': MembershipPlanSerializer(membership_plan).data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error verifying payment for user {user.email}: {str(e)}")
            return Response(
                {'error': 'Payment verification failed', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Error verifying membership payment: {str(e)}\nRequest data: {request.data}")
        return Response(
            {'error': 'Failed to verify membership payment', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_membership_plans(request):
    """
    List all membership plans in the system.
    """
    plans = MembershipPlan.objects.all()
    serializer = MembershipPlanSerializer(plans, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def edit_membership_plan(request, pk):
    """
    Edit a specific membership plan by ID.
    """
    try:
        plan = MembershipPlan.objects.get(id=pk)
        serializer = MembershipPlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except MembershipPlan.DoesNotExist:
        return Response({"error": "Membership plan not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_membership_plan(request, pk):
    """
    Delete a specific membership plan by ID.
    """
    try:
        plan = MembershipPlan.objects.get(id=pk)
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except MembershipPlan.DoesNotExist:
        return Response({"error": "Membership plan not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_membership_plans(request):
    plans = MembershipPlan.objects.filter(is_active=True)
    serializer = MembershipPlanSerializer(plans, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_trainer(request, member_id):
    """
    Assign a trainer to a member.
    """
    try:
        trainer_id = request.data.get('trainer_id')
        
        # Handle removing trainer assignment
        if trainer_id == 0 or trainer_id is None:
            trainer = None
        else:
            try:
                trainer = User.objects.get(id=trainer_id, user_type='trainer', is_active=True)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Invalid trainer ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            member = User.objects.get(id=member_id, user_type='member')
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update the member's assigned trainer
        member.assigned_trainer = trainer
        member.save()
        
        serializer = UserSerializer(member)
        return Response({
            'message': 'Trainer assignment updated successfully',
            'member': serializer.data
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_trainer_members(request, trainer_id):
    """
    Get all members assigned to a specific trainer.
    """
    try:
        # Verify trainer exists
        try:
            trainer = User.objects.get(id=trainer_id, user_type='trainer')
        except User.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all members assigned to this trainer
        members = User.objects.filter(
            user_type='member',
            assigned_trainer=trainer
        ).select_related('membership_plan', 'assigned_trainer')
        
        serializer = UserSerializer(members, many=True)
        return Response({
            'trainer': {
                'id': trainer.id,
                'name': f"{trainer.first_name} {trainer.last_name}",
                'email': trainer.email,
                'specialization': trainer.specialization
            },
            'assigned_members': serializer.data,
            'total_members': len(serializer.data)
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class RevenueView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            # Get query parameters for date range filtering
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            logger.info(f"Revenue request from {request.user.email} with dates: start={start_date}, end={end_date}")

            # Initialize the queryset for completed payments
            try:
                payments = Payment.objects.filter(status='completed')
                logger.info(f"Initial payment count: {payments.count()}")
            except Exception as e:
                logger.error(f"Error filtering payments by status: {str(e)}")
                return Response(
                    {'error': 'Database error while filtering payments', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Apply date range filter if provided
            if start_date:
                try:
                    start_date_parsed = parse_date(start_date)
                    if start_date_parsed:
                        payments = payments.filter(created_at__date__gte=start_date_parsed)
                        logger.info(f"After start date filter: {payments.count()}")
                    else:
                        return Response(
                            {'error': 'Invalid start date format. Use YYYY-MM-DD'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    logger.error(f"Error applying start date filter: {str(e)}")
                    return Response(
                        {'error': 'Error processing start date', 'details': str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            if end_date:
                try:
                    end_date_parsed = parse_date(end_date)
                    if end_date_parsed:
                        payments = payments.filter(created_at__date__lte=end_date_parsed)
                        logger.info(f"After end date filter: {payments.count()}")
                    else:
                        return Response(
                            {'error': 'Invalid end date format. Use YYYY-MM-DD'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    logger.error(f"Error applying end date filter: {str(e)}")
                    return Response(
                        {'error': 'Error processing end date', 'details': str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # Calculate total revenue
            try:
                total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0.0
                logger.info(f"Total revenue calculated: {total_revenue}")
            except Exception as e:
                logger.error(f"Error calculating total revenue: {str(e)}")
                return Response(
                    {'error': 'Error calculating total revenue', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Prepare payment details with better error handling
            try:
                payment_details = []
                for payment in payments.select_related('user', 'membership_plan'):
                    try:
                        # Handle potential None values safely
                        user_name = ""
                        if payment.user:
                            first_name = getattr(payment.user, 'first_name', '') or ''
                            last_name = getattr(payment.user, 'last_name', '') or ''
                            user_name = f"{first_name} {last_name}".strip()
                        
                        membership_plan_name = 'N/A'
                        if payment.membership_plan:
                            membership_plan_name = getattr(payment.membership_plan, 'name', 'N/A')
                        
                        payment_detail = {
                            'id': payment.id,
                            'user_email': getattr(payment.user, 'email', 'N/A') if payment.user else 'N/A',
                            'user_name': user_name or 'N/A',
                            'membership_plan': membership_plan_name,
                            'amount': float(payment.amount) if payment.amount is not None else 0.0,
                            'created_at': payment.created_at.isoformat() if payment.created_at else None,
                            'razorpay_payment_id': payment.razorpay_payment_id or 'N/A'
                        }
                        payment_details.append(payment_detail)
                        
                    except Exception as e:
                        logger.error(f"Error processing payment {payment.id}: {str(e)}")
                        # Continue processing other payments instead of failing completely
                        continue
                        
                logger.info(f"Successfully processed {len(payment_details)} payment details")
                
            except Exception as e:
                logger.error(f"Error preparing payment details: {str(e)}")
                return Response(
                    {'error': 'Error processing payment details', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Prepare response data
            try:
                response_data = {
                    'total_revenue': float(total_revenue),
                    'payment_count': len(payment_details),  # Use processed count
                    'payments': payment_details
                }
                
                logger.info(f"Revenue data fetched successfully by {request.user.email}: Total={total_revenue}, Count={len(payment_details)}")
                return Response(response_data, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Error preparing response data: {str(e)}")
                return Response(
                    {'error': 'Error preparing response', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Unexpected error in RevenueView: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An unexpected error occurred', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

        
class SalesReportView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            logger.info(f"Sales report request from {request.user.email} with dates: start={start_date}, end={end_date}")

            payments = Payment.objects.filter(status='completed')

            if start_date:
                start_date_parsed = parse_date(start_date)
                if not start_date_parsed:
                    return Response(
                        {'error': 'Invalid start date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                payments = payments.filter(created_at__date__gte=start_date_parsed)

            if end_date:
                end_date_parsed = parse_date(end_date)
                if not end_date_parsed:
                    return Response(
                        {'error': 'Invalid end date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                payments = payments.filter(created_at__date__lte=end_date_parsed)

            total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0.0

            payment_details = [
                {
                    'id': payment.id,
                    'user_email': getattr(payment.user, 'email', 'N/A') if payment.user else 'N/A',
                    'user_name': f"{getattr(payment.user, 'first_name', '')} {getattr(payment.user, 'last_name', '')}".strip() or 'N/A',
                    'membership_plan': getattr(payment.membership_plan, 'name', 'N/A') if payment.membership_plan else 'N/A',
                    'amount': float(payment.amount) if payment.amount is not None else 0.0,
                    'created_at': payment.created_at.strftime('%Y-%m-%d %H:%M:%S') if payment.created_at else 'N/A',
                    'razorpay_payment_id': payment.razorpay_payment_id or 'N/A'
                }
                for payment in payments.select_related('user', 'membership_plan')
            ]

            response_data = {
                'total_revenue': float(total_revenue),
                'payment_count': len(payment_details),
                'payments': payment_details
            }

            logger.info(f"Sales data fetched: Total={total_revenue}, Count={len(payment_details)}")
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in SalesReportView: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An unexpected error occurred', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
class SalesReportPDFView(APIView):
      permission_classes = [IsAuthenticated, IsAdmin]

      def get(self, request):
          try:
              start_date = request.query_params.get('start_date')
              end_date = request.query_params.get('end_date')
              logger.info(f"PDF request: start_date={start_date}, end_date={end_date}")

              payments = Payment.objects.filter(status='completed')
              logger.info(f"Payments filtered: {payments.count()}")

              if start_date:
                  start_date_parsed = parse_date(start_date)
                  if start_date_parsed:
                      payments = payments.filter(created_at__date__gte=start_date_parsed)
                      logger.info(f"After start date filter: {payments.count()}")
                  else:
                      return Response(
                          {'error': 'Invalid start date format. Use YYYY-MM-DD'},
                          status=status.HTTP_400_BAD_REQUEST
                      )
              
              if end_date:
                  end_date_parsed = parse_date(end_date)
                  if end_date_parsed:
                      payments = payments.filter(created_at__date__lte=end_date_parsed)
                      logger.info(f"After end date filter: {payments.count()}")
                  else:
                      return Response(
                          {'error': 'Invalid end date format. Use YYYY-MM-DD'},
                          status=status.HTTP_400_BAD_REQUEST
                      )

              total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0.0
              logger.info(f"Total revenue: {total_revenue}")

              payment_details = []
              for payment in payments.select_related('user', 'membership_plan'):
                  user_name = ""
                  if payment.user:
                      first_name = getattr(payment.user, 'first_name', '') or ''
                      last_name = getattr(payment.user, 'last_name', '') or ''
                      user_name = f"{first_name} {last_name}".strip()
                  
                  membership_plan_name = 'N/A'
                  if payment.membership_plan:
                      membership_plan_name = getattr(payment.membership_plan, 'name', 'N/A')
                  
                  payment_details.append({
                      'id': payment.id,
                      'user_email': getattr(payment.user, 'email', 'N/A') if payment.user else 'N/A',
                      'user_name': user_name or 'N/A',
                      'membership_plan': membership_plan_name,
                      'amount': float(payment.amount) if payment.amount is not None else 0.0,
                      'created_at': payment.created_at.strftime('%Y-%m-%d %H:%M:%S') if payment.created_at else 'N/A',
                      'razorpay_payment_id': payment.razorpay_payment_id or 'N/A'
                  })
              logger.info(f"Payment details prepared: {len(payment_details)}")

              latex_content = get_template('sales_report.tex').render({
                  'payments': payment_details,
                  'total_revenue': total_revenue,
                  'start_date': start_date or 'All',
                  'end_date': end_date or 'All',
                  'report_date': datetime.datetime.now().strftime('%Y-%m-%d')
              })
              logger.info("Template rendered successfully")

              with tempfile.TemporaryDirectory() as temp_dir:
                  tex_file_path = os.path.join(temp_dir, 'sales_report.tex')
                  pdf_file_path = os.path.join(temp_dir, 'sales_report.pdf')
                  logger.info(f"Temp files: {tex_file_path}, {pdf_file_path}")

                  with open(tex_file_path, 'w', encoding='utf-8') as tex_file:
                      tex_file.write(latex_content)
                  logger.info("LaTeX file written")

                  try:
                      result = subprocess.run(
                          ['latexmk', '-pdf', '-interaction=nonstopmode', tex_file_path],
                          cwd=temp_dir,
                          check=True,
                          capture_output=True
                      )
                      logger.info(f"latexmk output: {result.stdout.decode()}")
                  except subprocess.CalledProcessError as e:
                      logger.error(f"latexmk error: {e.stderr.decode()}")
                      return Response(
                          {'error': 'Failed to generate PDF', 'details': e.stderr.decode()},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR
                      )
                  except FileNotFoundError as e:
                      logger.error(f"latexmk not found: {str(e)}")
                      return Response(
                          {'error': 'LaTeX not installed', 'details': 'Please install texlive-full'},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR
                      )

                  if os.path.exists(pdf_file_path):
                      with open(pdf_file_path, 'rb') as pdf_file:
                          pdf_content = pdf_file.read()
                      logger.info("PDF file read successfully")

                      response = HttpResponse(content_type='application/pdf')
                      response['Content-Disposition'] = f'attachment; filename="sales_report_{start_date or "all"}_{end_date or "all"}.pdf"'
                      response.write(pdf_content)
                      return response
                  else:
                      logger.error("PDF file not generated")
                      return Response(
                          {'error': 'PDF generation failed', 'details': 'No PDF file was created'},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR
                      )

          except Exception as e:
              logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
              return Response(
                  {'error': 'An unexpected error occurred while generating PDF', 'details': str(e)},
                  status=status.HTTP_500_INTERNAL_SERVER_ERROR
              )
          


class MarkTrainerAttendanceView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        try:
            data = request.data.copy()
            serializer = TrainerAttendanceSerializer(data=data, context={'request': request})
            
            if serializer.is_valid():
                trainer = serializer.validated_data['trainer']
                date = serializer.validated_data['date']
                status_val = serializer.validated_data['status']

                # Check if attendance already exists for this trainer and date
                existing_attendance = TrainerAttendance.objects.filter(
                    trainer=trainer,
                    date=date
                ).first()

                if existing_attendance:
                    return Response(
                        {'error': f'Attendance for {trainer.first_name} {trainer.last_name} on {date} already exists'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                attendance = TrainerAttendance(
                    trainer=trainer,
                    admin=request.user,
                    date=date,
                    status=status_val
                )
                attendance.save()

                serializer = TrainerAttendanceSerializer(attendance, context={'request': request})
                return Response({
                    'message': 'Trainer attendance marked successfully',
                    'attendance': serializer.data
                }, status=status.HTTP_201_CREATED)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error in MarkTrainerAttendanceView: {str(e)}")  # Debug log
            return Response(
                {'error': 'An error occurred while marking attendance'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
# class TrainerListView(APIView):
#     permission_classes = [IsAuthenticated, IsAdmin]

#     def get(self, request):
#         try:
#             trainers = User.objects.filter(user_type='trainer')
#             serializer = TrainerBasicSerializer(trainers, many=True)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class TrainerListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        List all trainers in the system with their profile data.
        """
        try:
            trainers = User.objects.filter(user_type='trainer')
            response_data = []
            for trainer in trainers:
                user_serializer = UserSerializer(trainer)
                try:
                    trainer_profile = TrainerProfile.objects.get(user=trainer)
                    profile_serializer = TrainerProfileSerializer(trainer_profile)
                    trainer_data = {
                        **user_serializer.data,
                        'trainer_profile': profile_serializer.data
                    }
                except TrainerProfile.DoesNotExist:
                    trainer_data = {
                        **user_serializer.data,
                        'trainer_profile': None
                    }
                response_data.append(trainer_data)
            logger.info("Fetched %d trainers for admin", len(response_data))
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error fetching trainers: %s", str(e), exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)