from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

from .serializers import (
    UserSerializer,
    MembershipPlanSerializer,
    WorkoutRoutineSerializer,
    TrainerRatingSerializer,
    DietPlanSerializer,
    MembershipHistorySerializer,
)

from .models import TrainerProfile, UserProfile, MembershipHistory
from .models import MembershipPlan, AssignedDiet, WeeklyWorkoutCycle
from .models import DietPlan, WorkoutRoutine
from .models import User, OTP, Payment, TrainerRating

from django.utils.decorators import method_decorator
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .utils import send_otp_email

from datetime import datetime
from datetime import timedelta

import logging
import hmac
import hashlib
import razorpay


# USER VIEW

User = get_user_model()
logger = logging.getLogger(__name__)


# class RegisterView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         data = request.data
#         logger.info(f"Registration request received with data: {data}")

#         try:
#             serializer = UserSerializer(data=data)
#             if serializer.is_valid():
#                 user = serializer.save(is_verified=False)

#                 otp = OTP.generate_otp(user)
#                 send_otp_email(user, otp.code)

#                 logger.info(f"User saved with membership_plan: {user.membership_plan}")
#                 logger.info(f"OTP sent to: {user.email}")

#                 return Response(
#                     {
#                         "message": "User registered successfully. Check your email for verification code.",
#                         "user_id": user.id,
#                         "require_verification": True,
#                     },
#                     status=status.HTTP_201_CREATED,
#                 )
#             else:
#                 logger.error(f"Validation errors: {serializer.errors}")
#                 return Response(
#                     {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
#                 )
#         except Exception as e:
#             logger.error(f"Registration error: {str(e)}")
#             return Response(
#                 {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Registration request received with data: {data}")

        try:
            serializer = UserSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save(is_verified=False)

                # Generate OTP and send email
                otp = OTP.generate_otp(user)
                send_otp_email(user, otp.code)

                # Send real-time notification via Redis channel
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync

                channel_layer = get_channel_layer()
                if channel_layer:  # ensure channel layer exists
                    try:
                        async_to_sync(channel_layer.group_send)(
                            "notifications",
                            {
                                "type": "user.registered",
                                "message": f"New user registered: {user.email}"
                            }
                        )
                        logger.info("Redis notification sent successfully.")
                    except Exception as e:
                        logger.error(f"Failed to send Redis notification: {str(e)}")

                logger.info(f"User saved with membership_plan: {user.membership_plan}")
                logger.info(f"OTP sent to: {user.email}")

                return Response(
                    {
                        "message": "User registered successfully. Check your email for verification code.",
                        "user_id": user.id,
                        "require_verification": True,
                    },
                    status=status.HTTP_201_CREATED,
                )
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(
                    {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
def calculate_bmi(request):
    try:
        height = float(request.data.get("height", 0))
        weight = float(request.data.get("weight", 0))

        height_m = height / 100
        bmi = weight / (height_m * height_m)
        bmi = round(bmi, 1)

        if bmi < 18.5:
            status = "Underweight"
        elif 18.5 <= bmi < 25:
            status = "Healthy"
        elif 25 <= bmi < 30:
            status = "Overweight"
        else:
            status = "Obese"

        return Response({"bmi": bmi, "status": status})
    except Exception as e:
        return Response({"error": str(e)}, status=400)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Login attempt with: {data.get('email')}")

        email = data.get("email", "").lower().strip()
        password = data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            user = User.objects.get(email=email)
            logger.info(f"User found: {user.email}")

            if not user.check_password(password):
                logger.warning(f"Password check failed for user: {email}")
                return Response(
                    {"error": "Incorrect email or password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if not user.is_active:
                logger.warning(f"Inactive user attempted login: {email}")
                return Response(
                    {"error": "This account is inactive"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            try:

                user_role = user.user_type
            except AttributeError:

                try:
                    user_profile = UserProfile.objects.get(user=user)

                    user_role = getattr(user_profile, "user_type", "member")
                except (UserProfile.DoesNotExist, AttributeError):

                    user_role = "member"

            try:
                trainer_profile = TrainerProfile.objects.get(user=user)
                if trainer_profile:
                    user_role = "trainer"
            except TrainerProfile.DoesNotExist:
                pass

            if user.is_superuser:
                user_role = "admin"

            logger.info(f"User role determined as: {user_role}")

            refresh = RefreshToken.for_user(user)
            refresh["user_type"] = user_role
            refresh["email"] = user.email

            try:
                requires_password_reset = user.requires_password_reset
            except AttributeError:
                try:
                    user_profile = UserProfile.objects.get(user=user)
                    requires_password_reset = getattr(
                        user_profile, "requires_password_reset", False
                    )
                except (UserProfile.DoesNotExist, AttributeError):
                    requires_password_reset = False

            refresh["requires_password_reset"] = requires_password_reset

            logger.info(f"Login successful for: {email}")
            return Response(
                {
                    "email": user.email,
                    "username": getattr(user, "username", user.email),
                    "first_name": getattr(user, "first_name", ""),
                    "last_name": getattr(user, "last_name", ""),
                    "user_type": user_role,
                    "requires_password_reset": requires_password_reset,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            logger.warning(f"User not found: {email}")
            return Response(
                {"error": "Incorrect email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CreateRazorpayOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get("email", "").lower().strip()
            membership_plan_id = request.data.get("membership_plan_id")

            if not email or not membership_plan_id:
                return Response(
                    {"error": "Email and membership plan ID are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.get(email=email, user_type="member", is_verified=True)
            if user.has_paid:
                return Response(
                    {"error": "Payment already completed for this user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            membership_plan = MembershipPlan.objects.get(
                id=membership_plan_id, is_active=True
            )

            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            order_data = {
                "amount": int(membership_plan.price * 100),
                "currency": "INR",
                "payment_capture": 1,
            }
            order = client.order.create(data=order_data)

            # Create Payment record in database
            payment = Payment.objects.create(
                user=user,
                membership_plan=membership_plan,
                amount=membership_plan.price,
                razorpay_order_id=order["id"],
                status='pending'
            )

            return Response(
                {
                    "order_id": order["id"],
                    "amount": order["amount"],
                    "currency": order["currency"],
                    "key": settings.RAZORPAY_KEY_ID,
                    "user": {
                        "email": user.email,
                        "name": f"{user.first_name} {user.last_name}".strip(),
                        "contact": user.phone_number or "",
                    },
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found or not verified"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except MembershipPlan.DoesNotExist:
            return Response(
                {"error": "Invalid membership plan"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Razorpay order creation error: {str(e)}")
            return Response(
                {"error": "Failed to create payment order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class VerifyRazorpayPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            razorpay_order_id = request.data.get("razorpay_order_id")
            razorpay_payment_id = request.data.get("razorpay_payment_id")
            razorpay_signature = request.data.get("razorpay_signature")

            if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
                logger.warning("Missing payment details in verification request")
                return Response(
                    {"error": "Missing payment details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            logger.info(
                f"Attempting to verify payment for order_id: {razorpay_order_id}"
            )
            payment = Payment.objects.filter(razorpay_order_id=razorpay_order_id).order_by('-id').first()
            if not payment or payment.status != 'pending':
                return Response({'error': 'Payment order not found or already processed'}, status=status.HTTP_404_NOT_FOUND)

            generated_signature = hmac.new(
                key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
                digestmod=hashlib.sha256,
            ).hexdigest()

            if generated_signature != razorpay_signature:
                payment.status = "failed"
                payment.save()
                logger.warning(
                    f"Invalid payment signature for order_id: {razorpay_order_id}"
                )
                return Response(
                    {"error": "Invalid payment signature"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update payment and user
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = "completed"
            payment.save()

            user = payment.user
            user.has_paid = True
            user.is_active = True
            user.is_subscribed = True
            user.membership_start_date = timezone.now()
            user.save()

            logger.info(
                f"Payment verified successfully for user: {user.email}, order_id: {razorpay_order_id}"
            )
            return Response(
                {"message": "Payment verified successfully", "payment_id": payment.id},
                status=status.HTTP_200_OK,
            )

        except Payment.DoesNotExist:
            logger.error(f"Payment order not found for order_id: {razorpay_order_id}")
            return Response(
                {"error": "Payment order not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return Response(
                {"error": "Failed to verify payment"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainerPasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.user_type != "trainer" or not user.requires_password_reset:
            return Response(
                {"error": "Password reset not required or not authorized"},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_password = request.data.get("new_password")
        if not new_password:
            return Response(
                {"error": "New password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.requires_password_reset = False
        user.save()
        return Response(
            {"message": "Password reset successful"}, status=status.HTTP_200_OK
        )


class CheckPasswordResetRequiredView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"requires_password_reset": request.user.requires_password_reset},
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_member(request):
    """
    Retrieve the details of the currently logged-in member.
    """
    try:
        user = request.user
        if user.user_type != "member":
            return Response(
                {"error": "Only members can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_member_trainer(request, member_id):

    try:
        try:
            member = User.objects.get(id=member_id, user_type="member")
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not request.user.user_type == "admin" and request.user.id != member_id:
            return Response(
                {"error": "You do not have permission to view this information"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if member.assigned_trainer:
            trainer_data = {
                "id": member.assigned_trainer.id,
                "name": f"{member.assigned_trainer.first_name} {member.assigned_trainer.last_name}",
                "email": member.assigned_trainer.email,
                "specialization": member.assigned_trainer.specialization,
            }
        else:
            trainer_data = None

        return Response(
            {
                "member_id": member.id,
                "member_name": f"{member.first_name} {member.last_name}",
                "assigned_trainer": trainer_data,
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            if user.is_verified:
                return Response(
                    {"message": "User is already verified"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            otp = OTP.generate_otp(user)
            send_otp_email(user, otp.code)

            return Response(
                {"message": "Verification code sent to your email"},
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")

        if not email or not otp_code:
            return Response(
                {"error": "Email and OTP code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
            otp = (
                OTP.objects.filter(user=user, code=otp_code, is_used=False)
                .order_by("-created_at")
                .first()
            )

            if not otp:
                return Response(
                    {"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST
                )

            if not otp.is_valid():
                return Response(
                    {"error": "OTP has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            otp.is_used = True
            otp.save()

            user.is_verified = True
            user.save()

            return Response(
                {
                    "message": "Email verification successful",
                    "email": user.email,
                    "requires_payment": user.user_type == "member"
                    and not user.has_paid,
                    "membership_plan_id": (
                        user.membership_plan.id if user.membership_plan else None
                    ),
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        user_type = request.data.get("user_type", "").strip()

        if not email or not user_type:
            return Response(
                {"error": "Email and user type are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_type not in ["member", "trainer"]:
            return Response(
                {"error": 'Invalid user type. Must be "member" or "trainer"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email, user_type=user_type)

            if not user.is_active:
                return Response(
                    {"error": "This account is inactive"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Generate OTP
            otp = OTP.generate_otp(user)
            send_otp_email(user, otp.code)

            return Response(
                {
                    "message": "OTP sent to your email",
                    "email": email,
                    "user_type": user_type,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": f"No {user_type} found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Forgot password request error: {str(e)}")
            return Response(
                {"error": "An error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ForgotPasswordVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        otp_code = request.data.get("otp_code")
        user_type = request.data.get("user_type", "").strip()

        if not email or not otp_code or not user_type:
            return Response(
                {"error": "Email, OTP code, and user type are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_type not in ["member", "trainer"]:
            return Response(
                {"error": 'Invalid user type. Must be "member" or "trainer"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email, user_type=user_type)
            otp = (
                OTP.objects.filter(user=user, code=otp_code, is_used=False)
                .order_by("-created_at")
                .first()
            )

            if not otp:
                return Response(
                    {"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST
                )

            if not otp.is_valid():
                return Response(
                    {"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST
                )

            otp.is_used = True
            otp.save()

            return Response(
                {
                    "message": "OTP verified successfully",
                    "email": email,
                    "user_type": user_type,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": f"No {user_type} found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return Response(
                {"error": "An error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")
        user_type = request.data.get("user_type", "").strip()

        if not all([email, new_password, confirm_password, user_type]):
            return Response(
                {
                    "error": "Email, new password, confirm password, and user type are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_type not in ["member", "trainer"]:
            return Response(
                {"error": 'Invalid user type. Must be "member" or "trainer"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email, user_type=user_type)

            try:
                validate_password(new_password, user=user)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.requires_password_reset = False
            user.save()

            return Response(
                {"message": "Password reset successfully"}, status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response(
                {"error": f"No {user_type} found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return Response(
                {"error": "An error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ForgotPasswordResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        user_type = request.data.get("user_type", "").strip()

        if not email or not user_type:
            return Response(
                {"error": "Email and user type are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_type not in ["member", "trainer"]:
            return Response(
                {"error": 'Invalid user type. Must be "member" or "trainer"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email, user_type=user_type)

            if not user.is_active:
                return Response(
                    {"error": "This account is inactive"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                recent_otp = OTP.objects.filter(
                    user=user, created_at__gte=timezone.now() - timedelta(minutes=1)
                ).exists()

                if recent_otp:
                    return Response(
                        {"error": "Please wait before requesting another OTP"},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
            except Exception as rate_limit_error:
                logger.warning(f"Rate limit check failed: {str(rate_limit_error)}")

            try:
                OTP.objects.filter(user=user, is_used=False).update(is_used=True)
            except Exception as update_error:
                logger.warning(f"Failed to update old OTPs: {str(update_error)}")

            otp = OTP.generate_otp(user)

            try:
                send_otp_email(user, otp.code)
            except Exception as email_error:
                logger.error(f"Failed to send OTP email: {str(email_error)}")
                return Response(
                    {"error": "Failed to send OTP email"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": "New OTP sent to your email",
                    "email": email,
                    "user_type": user_type,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            return Response(
                {"error": f"No {user_type} found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}")
            return Response(
                {"error": "An error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_trainer_rating(request):

    try:
        if request.user.user_type != "member":
            return Response(
                {"error": "Only members can submit ratings"},
                status=status.HTTP_403_FORBIDDEN,
            )

        trainer_id = request.data.get("trainer_id")
        rating = request.data.get("rating")
        feedback = request.data.get("feedback", "")

        if not trainer_id:
            return Response(
                {"error": "Trainer ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not rating:
            return Response(
                {"error": "Rating is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            trainer = User.objects.get(
                id=trainer_id, user_type="trainer", is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid trainer ID or trainer not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            not hasattr(request.user, "assigned_trainer")
            or request.user.assigned_trainer != trainer
        ):
            return Response(
                {"error": "You can only rate your assigned trainer"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            rating_value = int(rating)
            if rating_value < 1 or rating_value > 5:
                return Response(
                    {"error": "Rating must be between 1 and 5"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Rating must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating_obj, created = TrainerRating.objects.update_or_create(
            member=request.user,
            trainer=trainer,
            defaults={"rating": rating_value, "feedback": feedback},
        )

        serializer = TrainerRatingSerializer(rating_obj)
        return Response(
            {
                "rating": serializer.data,
                "message": (
                    "Rating submitted successfully"
                    if created
                    else "Rating updated successfully"
                ),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    except Exception as e:
        print(f"Rating submission error: {str(e)}")
        return Response(
            {"error": "An error occurred while processing your request"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user != request.user and request.user.user_type != "admin":
                return Response(
                    {"detail": "Not authorized to view this user"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user != request.user and request.user.user_type != "admin":
                return Response(
                    {"detail": "Not authorized to update this user"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class MemberDailyWorkoutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id, date):
        try:
            member = User.objects.get(id=member_id, user_type="member")
            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {
                        "error": "You can only view your own workouts or those of your assigned members"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            try:
                selected_date = datetime.strptime(date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cycle = WeeklyWorkoutCycle.objects.filter(
                member=member, is_active=True
            ).first()
            if not cycle:
                return Response(
                    {"message": "No active workout cycle found"},
                    status=status.HTTP_200_OK,
                )

            days_since_start = (selected_date - cycle.start_date).days % 7 + 1
            if days_since_start == 7:
                return Response(
                    {"message": "Recovery Day", "day_number": 7, "workout": None},
                    status=status.HTTP_200_OK,
                )

            workout = WorkoutRoutine.objects.filter(
                member=member, day_number=days_since_start
            ).first()
            if not workout:
                return Response(
                    {
                        "message": f"No workout assigned for Day {days_since_start}",
                        "day_number": days_since_start,
                        "workout": None,
                    },
                    status=status.HTTP_200_OK,
                )
            serializer = WorkoutRoutineSerializer(workout)
            return Response(
                {"day_number": days_since_start, "workout": serializer.data},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )


class DietPlanHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        logger.info(f"Fetching diet plan history for member {member_id}")
        try:
            member = User.objects.get(id=member_id, user_type="member")
            if (
                request.user.user_type != "admin"
                and request.user.id != member_id
                and member.assigned_trainer != request.user
            ):
                return Response(
                    {
                        "error": "You can only view your own diet plans or those of your assigned members"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            diet_plans = DietPlan.objects.filter(member=member)
            serializer = DietPlanSerializer(diet_plans, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CurrentDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        logger.info(f"Fetching current diet plan for member {member_id}")
        try:
            member = User.objects.get(id=member_id, user_type="member")
            if (
                request.user.user_type != "admin"
                and request.user.id != member_id
                and member.assigned_trainer != request.user
            ):
                return Response(
                    {
                        "error": "You can only view your own diet plan or those of your assigned members"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            assigned_diet = AssignedDiet.objects.filter(
                member=member, is_active=True
            ).first()
            if not assigned_diet:
                return Response(
                    {"message": "No active diet plan found"}, status=status.HTTP_200_OK
                )
            serializer = DietPlanSerializer(assigned_diet.diet_plan)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_member_ratings(request):

    try:
        if request.user.user_type != "member":
            return Response(
                {"error": "Only members can view their own ratings"},
                status=status.HTTP_403_FORBIDDEN,
            )

        ratings = TrainerRating.objects.filter(member=request.user).order_by(
            "-created_at"
        )
        serializer = TrainerRatingSerializer(ratings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Get member ratings error: {str(e)}")
        return Response(
            {"error": "An error occurred while fetching your ratings"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_member_membership_status(request):
    """
    Get detailed membership status for the current member
    """
    try:
        if request.user.user_type != 'member':
            return Response(
                {"error": "Only members can check membership status"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        member = request.user
        status_info = member.membership_status
        
        response_data = {
            "membership_status": status_info,
            "membership_plan": {
                "id": member.membership_plan.id,
                "name": member.membership_plan.name,
                "price": str(member.membership_plan.price),
                "duration_days": member.membership_plan.duration_days
            } if member.membership_plan else None,
            "membership_start_date": member.membership_start_date.isoformat() if member.membership_start_date else None,
            "membership_expiration_date": member.membership_expiration_date.isoformat() if member.membership_expiration_date else None,
            "days_until_expiration": member.days_until_expiration
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error getting membership status: {str(e)}")
        return Response(
            {"error": "Failed to get membership status"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class CreateRenewalRazorpayOrderView(APIView):
    """
    Create Razorpay order for membership renewal/upgrade
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            membership_plan_id = request.data.get("membership_plan_id")
            is_upgrade = request.data.get("is_upgrade", False)
            upgrade_amount = request.data.get("upgrade_amount")
            
            if not membership_plan_id:
                return Response(
                    {"error": "Membership plan ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = request.user
            
            # Verify user is a member
            if user.user_type != 'member':
                return Response(
                    {"error": "Only members can renew membership"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the membership plan
            try:
                membership_plan = MembershipPlan.objects.get(
                    id=membership_plan_id, is_active=True
                )
            except MembershipPlan.DoesNotExist:
                return Response(
                    {"error": "Invalid membership plan"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if there's already a pending payment for this user
            existing_pending = Payment.objects.filter(
                user=user, 
                status='pending'
            ).first()
            
            if existing_pending:
                # Cancel the existing pending payment
                existing_pending.status = 'cancelled'
                existing_pending.save()

            # Create Razorpay order
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            
            # FIXED: Use correct amount for upgrades
            if is_upgrade and upgrade_amount is not None:
                order_amount = int(float(upgrade_amount) * 100)
                actual_amount = float(upgrade_amount)
                receipt_prefix = "upgrade"
            else:
                order_amount = int(membership_plan.price * 100)
                actual_amount = float(membership_plan.price)
                receipt_prefix = "renewal"
            
            # Clean plan name to remove special characters
            clean_plan_name = ''.join(c for c in membership_plan.name if c.isalnum() or c in (' ', '-', '_')).strip()
            
            order_data = {
                "amount": order_amount,  # Now uses correct amount
                "currency": "INR",
                "receipt": f"{receipt_prefix}_{user.id}_{membership_plan.id}_{int(timezone.now().timestamp())}",
                "notes": {
                    "plan_name": clean_plan_name,
                    "plan_duration": str(membership_plan.duration_days),
                    "member_id": str(user.id),
                    "type": "upgrade" if is_upgrade else "renewal",
                    "upgrade_amount": str(upgrade_amount) if upgrade_amount else None
                }
            }
            order = client.order.create(data=order_data)

            # Create Payment record in database with correct amount
            payment = Payment.objects.create(
                user=user,
                membership_plan=membership_plan,
                amount=actual_amount,  # Store the actual amount being paid
                razorpay_order_id=order["id"],
                status='pending'
            )

            action_type = "upgrade" if is_upgrade else "renewal"
            logger.info(f"{action_type.title()} order created for user {user.email}, plan {membership_plan.name}, amount: ₹{actual_amount}")

            return Response(
                {
                    "order_id": order["id"],
                    "amount": order["amount"],  # Correct amount for Razorpay
                    "currency": order["currency"],
                    "key": settings.RAZORPAY_KEY_ID,
                    "user": {
                        "email": user.email,
                        "name": f"{user.first_name} {user.last_name}".strip(),
                        "contact": user.phone_number or "",
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Payment order creation error: {str(e)}")
            return Response(
                {"error": "Failed to create payment order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyRenewalRazorpayPaymentView(APIView):
    """
    Enhanced payment verification view that supports both renewal and upgrades
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            razorpay_order_id = request.data.get("razorpay_order_id")
            razorpay_payment_id = request.data.get("razorpay_payment_id")
            razorpay_signature = request.data.get("razorpay_signature")
            membership_plan_id = request.data.get("membership_plan_id")
            is_upgrade = request.data.get("is_upgrade", False)

            if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
                return Response(
                    {"error": "Missing payment details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the payment record
            try:
                payment = Payment.objects.get(
                    razorpay_order_id=razorpay_order_id,
                    user=request.user,
                    status='pending'
                )
            except Payment.DoesNotExist:
                return Response(
                    {'error': 'Payment order not found or already processed'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Verify signature
            generated_signature = hmac.new(
                key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
                digestmod=hashlib.sha256,
            ).hexdigest()

            if generated_signature != razorpay_signature:
                payment.status = "failed"
                payment.save()
                logger.warning(
                    f"Invalid payment signature for order_id: {razorpay_order_id}"
                )
                return Response(
                    {"error": "Invalid payment signature"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update payment record
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = "completed"
            payment.save()

            # Update user membership
            user = payment.user
            new_plan = payment.membership_plan

            if is_upgrade:
                # FIXED: For upgrades, activate the new plan immediately
                user.membership_plan = new_plan
                user.membership_start_date = timezone.now()  # Start immediately
                user.has_upgraded = True
                
                logger.info(
                    f"Membership upgraded immediately for user: {user.email}, "
                    f"from plan: {user.membership_plan.name if user.membership_plan else 'None'} "
                    f"to plan: {new_plan.name}, "
                    f"start_date: {user.membership_start_date}"
                )
            else:
                # For renewals, handle based on current membership status
                if user.membership_expiration_date and user.membership_expiration_date > timezone.now():
                    # If current membership is still active, extend from expiration date
                    user.membership_plan = new_plan
                    user.membership_start_date = user.membership_expiration_date
                else:
                    # If expired or no membership, start from now
                    user.membership_plan = new_plan
                    user.membership_start_date = timezone.now()
                
                logger.info(
                    f"Membership renewed for user: {user.email}, "
                    f"plan: {new_plan.name}, "
                    f"start_date: {user.membership_start_date}"
                )

            user.has_paid = True
            user.is_active = True
            user.is_subscribed = True
            user.save()

            # Create membership history record
            try:
                from .models import MembershipHistory  # Adjust import as needed
                MembershipHistory.objects.create(
                    user=user,
                    plan=new_plan,
                    start_date=user.membership_start_date,
                    end_date=user.membership_expiration_date,
                    amount_paid=payment.amount,
                    payment_id=razorpay_payment_id,
                    is_upgrade=is_upgrade
                )
            except:
                # Don't fail the whole process if history creation fails
                logger.warning(f"Failed to create membership history for user {user.email}")

            # Return updated user data
            from .serializers import UserSerializer
            user_serializer = UserSerializer(user)
            
            action_type = "upgraded" if is_upgrade else "renewed"
            return Response(
                {
                    "message": f"Membership {action_type} successfully", 
                    "payment_id": payment.id,
                    "user": user_serializer.data,
                    "membership_start_date": user.membership_start_date.isoformat(),
                    "membership_end_date": user.membership_expiration_date.isoformat() if user.membership_expiration_date else None,
                    "is_upgrade": is_upgrade
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return Response(
                {"error": "Failed to verify payment"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# class VerifyRenewalRazorpayPaymentView(APIView):
#     """
#     Verify Razorpay payment for membership renewal
#     """
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             razorpay_order_id = request.data.get("razorpay_order_id")
#             razorpay_payment_id = request.data.get("razorpay_payment_id")
#             razorpay_signature = request.data.get("razorpay_signature")

#             if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
#                 return Response(
#                     {"error": "Missing payment details"},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             # Get the payment record
#             try:
#                 payment = Payment.objects.get(
#                     razorpay_order_id=razorpay_order_id,
#                     user=request.user,
#                     status='pending'
#                 )
#             except Payment.DoesNotExist:
#                 return Response(
#                     {'error': 'Payment order not found or already processed'}, 
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             # Verify signature
#             generated_signature = hmac.new(
#                 key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
#                 msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
#                 digestmod=hashlib.sha256,
#             ).hexdigest()

#             if generated_signature != razorpay_signature:
#                 payment.status = "failed"
#                 payment.save()
#                 logger.warning(
#                     f"Invalid payment signature for renewal order_id: {razorpay_order_id}"
#                 )
#                 return Response(
#                     {"error": "Invalid payment signature"},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             # Update payment record
#             payment.razorpay_payment_id = razorpay_payment_id
#             payment.razorpay_signature = razorpay_signature
#             payment.status = "completed"
#             payment.save()

#             # Update user membership
#             user = payment.user
#             user.membership_plan = payment.membership_plan
            
#             # Set new membership start date
#             # If current membership is still active, extend from expiration date
#             # If expired or no membership, start from now
#             if user.membership_expiration_date and user.membership_expiration_date > timezone.now():
#                 # Extend from current expiration date
#                 user.membership_start_date = user.membership_expiration_date
#             else:
#                 # Start from now
#                 user.membership_start_date = timezone.now()
            
#             user.has_paid = True
#             user.is_active = True
#             user.is_subscribed = True
#             user.save()

#             logger.info(
#                 f"Membership renewed successfully for user: {user.email}, "
#                 f"plan: {payment.membership_plan.name}, "
#                 f"start_date: {user.membership_start_date}"
#             )

#             # Return updated user data
#             from .serializers import UserSerializer
#             user_serializer = UserSerializer(user)
            
#             return Response(
#                 {
#                     "message": "Membership renewed successfully", 
#                     "payment_id": payment.id,
#                     "user": user_serializer.data
#                 },
#                 status=status.HTTP_200_OK,
#             )

#         except Exception as e:
#             logger.error(f"Renewal payment verification error: {str(e)}")
#             return Response(
#                 {"error": "Failed to verify payment"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )




# Fix the naming conflict and API endpoint issues

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_upgrade_cost_api(request):  # Renamed to avoid conflict
    """Calculate the upgrade cost for a specific plan"""
    try:
        user = request.user
        new_plan_id = request.data.get("new_plan_id")

        if user.user_type != "member":
            return Response(
                {"error": "Only members can calculate upgrade costs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not new_plan_id:
            return Response(
                {"error": "New plan ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.membership_plan:
            return Response(
                {"error": "No current membership plan found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_plan = MembershipPlan.objects.get(id=new_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {"error": "Invalid plan selected"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if it's actually an upgrade (higher price)
        if new_plan.price <= user.membership_plan.price:
            return Response(
                {"error": "Selected plan is not an upgrade option"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upgrade_amount = calculate_upgrade_cost_helper(user, new_plan)
        
        return Response({
            'upgrade_amount': upgrade_amount,
            'new_plan_price': float(new_plan.price),
            'savings': float(new_plan.price) - upgrade_amount
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error calculating upgrade cost for user {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to calculate upgrade cost"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

# def calculate_upgrade_cost_helper(user, new_plan):  # Renamed helper function
#     """Helper function to calculate upgrade cost"""
#     if not user.membership_plan or not user.membership_start_date:
#         return float(new_plan.price)

#     current_plan = user.membership_plan
#     current_price = float(current_plan.price)
#     new_price = float(new_plan.price)
    
#     # Calculate days remaining in current plan
#     days_remaining = user.days_until_expiration or 0
#     if days_remaining <= 0:
#         return new_price

#     # Calculate unused amount from current plan
#     current_plan_days = current_plan.duration_days
#     daily_rate_current = current_price / current_plan_days
#     unused_amount = daily_rate_current * days_remaining

#     # Calculate upgrade amount (new plan price - unused amount)
#     upgrade_amount = max(0, new_price - unused_amount)
    
#     return round(upgrade_amount, 2)

def calculate_upgrade_cost_helper(user, new_plan):
    """
    Helper function to calculate upgrade cost
    For immediate upgrade activation, user pays difference based on remaining days
    """
    if not user.membership_plan or not user.membership_start_date:
        return float(new_plan.price)

    current_plan = user.membership_plan
    current_price = float(current_plan.price)
    new_price = float(new_plan.price)
    
    # Calculate days remaining in current plan
    days_remaining = user.days_until_expiration or 0
    if days_remaining <= 0:
        # If current plan expired, pay full new plan price
        return new_price

    # Calculate unused value from current plan
    current_plan_days = current_plan.duration_days
    daily_rate_current = current_price / current_plan_days
    unused_amount = daily_rate_current * days_remaining

    # For immediate upgrade: New plan full price - unused amount from current plan
    upgrade_amount = max(0, new_price - unused_amount)
    
    logger.info(
        f"Upgrade calculation for user {user.email}: "
        f"Current plan: {current_plan.name} (₹{current_price}), "
        f"New plan: {new_plan.name} (₹{new_price}), "
        f"Days remaining: {days_remaining}, "
        f"Unused amount: ₹{unused_amount:.2f}, "
        f"Upgrade cost: ₹{upgrade_amount:.2f}"
    )
    
    return round(upgrade_amount, 2)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_upgrade_cost_api(request):
    """Calculate the upgrade cost for a specific plan - with immediate activation"""
    try:
        user = request.user
        new_plan_id = request.data.get("new_plan_id")

        if user.user_type != "member":
            return Response(
                {"error": "Only members can calculate upgrade costs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not new_plan_id:
            return Response(
                {"error": "New plan ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.membership_plan:
            return Response(
                {"error": "No current membership plan found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            new_plan = MembershipPlan.objects.get(id=new_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {"error": "Invalid plan selected"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if it's actually an upgrade (higher price)
        if new_plan.price <= user.membership_plan.price:
            return Response(
                {"error": "Selected plan is not an upgrade option"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upgrade_amount = calculate_upgrade_cost_helper(user, new_plan)
        savings = float(new_plan.price) - upgrade_amount
        
        return Response({
            'upgrade_amount': upgrade_amount,
            'new_plan_price': float(new_plan.price),
            'savings': savings,
            'current_plan_unused_value': savings,
            'activation': 'immediate',  # Indicate immediate activation
            'message': f'Your new {new_plan.name} plan will activate immediately upon payment'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error calculating upgrade cost for user {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to calculate upgrade cost"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

# Also update the get_available_upgrades function to use the helper
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_available_upgrades(request):
    """Get available upgrade plans for current user"""
    try:
        user = request.user
        if user.user_type != "member":
            return Response(
                {"error": "Only members can view upgrade options"},
                status=status.HTTP_403_FORBIDDEN,
            )

        current_plan = user.membership_plan
        if not current_plan:
            return Response(
                {"error": "No current membership plan found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if membership is active
        if user.is_membership_expired():
            return Response(
                {"error": "Cannot upgrade expired membership. Please renew first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all active plans with higher price than current plan
        upgrade_plans = MembershipPlan.objects.filter(
            is_active=True,
            price__gt=current_plan.price
        ).exclude(id=current_plan.id).order_by('price')

        # Calculate upgrade amounts for each plan
        upgrade_options = []
        for plan in upgrade_plans:
            upgrade_amount = calculate_upgrade_cost_helper(user, plan)  # Use helper
            upgrade_options.append({
                'plan': MembershipPlanSerializer(plan).data,
                'upgrade_amount': upgrade_amount,
                'savings': float(plan.price) - upgrade_amount
            })

        return Response({
            'current_plan': MembershipPlanSerializer(current_plan).data,
            'upgrade_options': upgrade_options,
            'days_remaining': user.days_until_expiration or 0
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching upgrade options for {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to fetch upgrade options"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@method_decorator(csrf_exempt, name="dispatch")
class EnhancedRenewMembershipView(APIView):
    """
    Enhanced membership renewal view that supports both renewal and upgrades
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            membership_plan_id = request.data.get("membership_plan_id")
            is_upgrade = request.data.get("is_upgrade", False)
            upgrade_amount = request.data.get("upgrade_amount")

            if not membership_plan_id:
                return Response(
                    {"error": "Membership plan ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                membership_plan = MembershipPlan.objects.get(
                    id=membership_plan_id, is_active=True
                )
            except MembershipPlan.DoesNotExist:
                return Response(
                    {"error": "Invalid membership plan selected"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Create Razorpay order
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            # FIX: Use the correct amount based on upgrade or renewal
            if is_upgrade and upgrade_amount is not None:
                # FIXED: Use the upgrade amount instead of full plan price
                amount = int(float(upgrade_amount) * 100)  # Convert to paisa
                receipt_prefix = "upgrade"
            else:
                # Use full plan price for renewal
                amount = int(membership_plan.price * 100)
                receipt_prefix = "renewal"

            # Clean plan name to remove special characters that might cause issues
            clean_plan_name = ''.join(c for c in membership_plan.name if c.isalnum() or c in (' ', '-', '_')).strip()
            
            order_data = {
                "amount": amount,  # This now correctly uses upgrade_amount for upgrades
                "currency": "INR",
                "receipt": f"{receipt_prefix}_{user.id}_{membership_plan.id}_{int(timezone.now().timestamp())}",
                "notes": {
                    "plan_name": clean_plan_name,
                    "plan_duration": str(membership_plan.duration_days),
                    "member_id": str(user.id),
                    "is_upgrade": str(is_upgrade),
                    "upgrade_amount": str(upgrade_amount) if upgrade_amount else None
                }
            }

            order = client.order.create(data=order_data)

            # Store the pending transaction
            transaction_data = {
                'order_id': order['id'],
                'membership_plan_id': membership_plan_id,
                'is_upgrade': is_upgrade,
                'upgrade_amount': upgrade_amount if is_upgrade else None,
                'timestamp': timezone.now().isoformat()
            }
            
            if is_upgrade:
                request.session['pending_upgrade'] = transaction_data
            else:
                request.session['pending_renewal'] = transaction_data
            
            request.session.modified = True

            action_type = "upgrade" if is_upgrade else "renewal"
            logger.info(
                f"Membership {action_type} order created for user {user.email}, plan {membership_plan.name}, amount: {amount/100}"
            )

            return Response(
                {
                    "key": settings.RAZORPAY_KEY_ID,
                    "amount": order["amount"],  # This will now be the correct upgrade amount
                    "currency": order["currency"],
                    "order_id": order["id"],
                    "user": {
                        "name": f"{user.first_name} {user.last_name}".strip(),
                        "email": user.email,
                        "contact": user.phone_number or "",
                    },
                    "membership_plan": {
                        "id": membership_plan.id,
                        "name": membership_plan.name,
                        "price": str(membership_plan.price),
                        "duration_days": membership_plan.duration_days,
                    },
                    "is_upgrade": is_upgrade,
                    "upgrade_amount": upgrade_amount
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error creating membership order: {str(e)}")
            return Response(
                {"error": f"Failed to create {'upgrade' if is_upgrade else 'renewal'} order", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# @method_decorator(csrf_exempt, name="dispatch")
# class EnhancedVerifyRenewalPaymentView(APIView):
#     """
#     Enhanced payment verification view that supports both renewal and upgrades
#     """
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             user = request.user
#             razorpay_order_id = request.data.get("razorpay_order_id")
#             razorpay_payment_id = request.data.get("razorpay_payment_id")
#             razorpay_signature = request.data.get("razorpay_signature")
#             membership_plan_id = request.data.get("membership_plan_id")
#             is_upgrade = request.data.get("is_upgrade", False)

#             if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, membership_plan_id]):
#                 return Response(
#                     {"error": "All payment details are required"},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             try:
#                 membership_plan = MembershipPlan.objects.get(
#                     id=membership_plan_id, is_active=True
#                 )
#             except MembershipPlan.DoesNotExist:
#                 return Response(
#                     {"error": "Invalid membership plan"},
#                     status=status.HTTP_404_NOT_FOUND,
#                 )

#             # Verify payment signature
#             client = razorpay.Client(
#                 auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
#             )

#             try:
#                 client.utility.verify_payment_signature({
#                     "razorpay_order_id": razorpay_order_id,
#                     "razorpay_payment_id": razorpay_payment_id,
#                     "razorpay_signature": razorpay_signature,
#                 })
#             except razorpay.errors.SignatureVerificationError:
#                 return Response(
#                     {"error": "Payment verification failed"},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             # Handle upgrade vs renewal logic
#             if is_upgrade:
#                 # For upgrades, extend from current expiration date if membership is active
#                 if user.membership_plan and user.membership_start_date and not user.is_membership_expired():
#                     # Keep the remaining days and extend with new plan
#                     current_end_date = user.membership_start_date + timedelta(days=user.membership_plan.duration_days)
#                     new_start_date = timezone.now()
                    
#                     # Calculate how many days to add based on remaining time credit
#                     days_remaining = user.days_until_expiration or 0
                    
#                     user.membership_plan = membership_plan
#                     user.membership_start_date = new_start_date
#                     user.has_upgraded = True
#                 else:
#                     # No active membership, treat as new subscription
#                     user.membership_plan = membership_plan
#                     user.membership_start_date = timezone.now()
#                     user.has_upgraded = True
#             else:
#                 # For renewals, always start fresh
#                 user.membership_plan = membership_plan
#                 user.membership_start_date = timezone.now()

#             user.has_paid = True
#             user.is_subscribed = True
#             user.save()

#             # Get payment details from Razorpay
#             try:
#                 payment_details = client.payment.fetch(razorpay_payment_id)
#                 amount_paid = payment_details.get('amount', 0) / 100  # Convert from paisa to rupees
#             except:
#                 amount_paid = membership_plan.price

#             # Create membership history record
#             MembershipHistory.objects.create(
#                 user=user,
#                 plan=membership_plan,
#                 start_date=user.membership_start_date,
#                 end_date=user.membership_expiration_date,
#                 amount_paid=amount_paid,
#                 payment_id=razorpay_payment_id,
#                 is_upgrade=is_upgrade
#             )

#             action_type = "upgraded" if is_upgrade else "renewed"
#             logger.info(
#                 f"Membership {action_type} for user {user.email}, plan {membership_plan.name}"
#             )

#             return Response(
#                 {
#                     "message": f"Membership {action_type} successfully",
#                     "membership_plan": {
#                         "id": membership_plan.id,
#                         "name": membership_plan.name,
#                         "duration_days": membership_plan.duration_days,
#                     },
#                     "membership_start_date": user.membership_start_date.isoformat(),
#                     "membership_end_date": user.membership_expiration_date.isoformat() if user.membership_expiration_date else None,
#                     "payment_id": razorpay_payment_id,
#                     "is_upgrade": is_upgrade,
#                 },
#                 status=status.HTTP_200_OK,
#             )

#         except Exception as e:
#             logger.error(f"Error verifying payment: {str(e)}")
#             return Response(
#                 {"error": "Failed to verify payment", "details": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             )



@method_decorator(csrf_exempt, name="dispatch")
class EnhancedVerifyRenewalPaymentView(APIView):
    """
    Enhanced payment verification view with immediate upgrade activation
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            razorpay_order_id = request.data.get("razorpay_order_id")
            razorpay_payment_id = request.data.get("razorpay_payment_id")
            razorpay_signature = request.data.get("razorpay_signature")
            membership_plan_id = request.data.get("membership_plan_id")
            is_upgrade = request.data.get("is_upgrade", False)

            if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, membership_plan_id]):
                return Response(
                    {"error": "All payment details are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                membership_plan = MembershipPlan.objects.get(
                    id=membership_plan_id, is_active=True
                )
            except MembershipPlan.DoesNotExist:
                return Response(
                    {"error": "Invalid membership plan"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Verify payment signature
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            try:
                client.utility.verify_payment_signature({
                    "razorpay_order_id": razorpay_order_id,
                    "razorpay_payment_id": razorpay_payment_id,
                    "razorpay_signature": razorpay_signature,
                })
            except razorpay.errors.SignatureVerificationError:
                return Response(
                    {"error": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get payment amount from Razorpay
            try:
                payment_details = client.payment.fetch(razorpay_payment_id)
                amount_paid = payment_details.get('amount', 0) / 100  # Convert from paisa to rupees
            except:
                # Fallback to plan price if payment fetch fails
                if is_upgrade:
                    # For upgrades, try to get the actual upgrade amount from session or calculate
                    amount_paid = float(membership_plan.price)  # This should ideally be the upgrade amount
                else:
                    amount_paid = float(membership_plan.price)

            # Store previous plan info for logging
            previous_plan = user.membership_plan.name if user.membership_plan else 'None'
            previous_expiry = user.membership_expiration_date

            # CRITICAL FIX: Handle upgrade vs renewal logic properly
            if is_upgrade:
                # FOR UPGRADES: Activate new plan IMMEDIATELY
                user.membership_plan = membership_plan
                user.membership_start_date = timezone.now()  # Start immediately!
                user.has_upgraded = True
                
                logger.info(
                    f"UPGRADE COMPLETED - User: {user.email}, "
                    f"Previous Plan: {previous_plan}, "
                    f"New Plan: {membership_plan.name}, "
                    f"Previous Expiry: {previous_expiry}, "
                    f"New Start Date: {user.membership_start_date} (IMMEDIATE), "
                    f"New Expiry: {user.membership_expiration_date}, "
                    f"Amount Paid: ₹{amount_paid}"
                )
            else:
                # FOR RENEWALS: Handle based on current membership status
                if user.membership_expiration_date and user.membership_expiration_date > timezone.now():
                    # If current membership is still active, extend from expiration date
                    user.membership_plan = membership_plan
                    user.membership_start_date = user.membership_expiration_date
                else:
                    # If expired or no membership, start from now
                    user.membership_plan = membership_plan
                    user.membership_start_date = timezone.now()
                
                logger.info(
                    f"RENEWAL COMPLETED - User: {user.email}, "
                    f"Previous Plan: {previous_plan}, "
                    f"New Plan: {membership_plan.name}, "
                    f"New Start Date: {user.membership_start_date}, "
                    f"New Expiry: {user.membership_expiration_date}, "
                    f"Amount Paid: ₹{amount_paid}"
                )

            # Update user status
            user.has_paid = True
            user.is_subscribed = True
            user.is_active = True
            user.save()

            # Create membership history record
            try:
                MembershipHistory.objects.create(
                    user=user,
                    plan=membership_plan,
                    start_date=user.membership_start_date,
                    end_date=user.membership_expiration_date,
                    amount_paid=amount_paid,
                    payment_id=razorpay_payment_id,
                    is_upgrade=is_upgrade,
                    previous_plan=previous_plan if is_upgrade else None
                )
            except Exception as e:
                logger.warning(f"Failed to create membership history for user {user.email}: {str(e)}")

            action_type = "upgraded" if is_upgrade else "renewed"
            activation_message = "immediately" if is_upgrade else "as scheduled"
            
            return Response(
                {
                    "message": f"Membership {action_type} successfully",
                    "activation": f"Plan activated {activation_message}",
                    "membership_plan": {
                        "id": membership_plan.id,
                        "name": membership_plan.name,
                        "duration_days": membership_plan.duration_days,
                    },
                    "membership_start_date": user.membership_start_date.isoformat(),
                    "membership_end_date": user.membership_expiration_date.isoformat() if user.membership_expiration_date else None,
                    "payment_id": razorpay_payment_id,
                    "amount_paid": amount_paid,
                    "is_upgrade": is_upgrade,
                    "previous_plan": previous_plan if is_upgrade else None,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error verifying payment for user {user.email}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to verify payment", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


