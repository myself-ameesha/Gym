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


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Registration request received with data: {data}")

        try:
            serializer = UserSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save(is_verified=False)

                otp = OTP.generate_otp(user)
                send_otp_email(user, otp.code)

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
            payment = Payment.objects.get(
                razorpay_order_id=razorpay_order_id, status="pending"
            )

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_membership_history(request):
    try:
        user = request.user
        print(f"Fetching membership history for user: {user.email}")
        print(f"User ID: {user.id}")

        if not user:
            return Response(
                {"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
            )

        membership_history = MembershipHistory.objects.filter(user=user).order_by(
            "-start_date"
        )
        print(f"Query executed, found {membership_history.count()} membership records")

        for record in membership_history:
            print(
                f"Record ID: {record.id}, Plan: {record.membership_plan}, Start: {record.start_date}"
            )

        serializer = MembershipHistorySerializer(membership_history, many=True)
        serialized_data = serializer.data

        print(f"Serialized data: {serialized_data}")
        print(f"Serialized data type: {type(serialized_data)}")
        print(f"Serialized data length: {len(serialized_data)}")

        if not isinstance(serialized_data, list):
            serialized_data = list(serialized_data)

        return Response(serialized_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(
            f"Error fetching membership history for user {user.email}: {str(e)}"
        )
        print(f"Exception in get_membership_history: {str(e)}")
        print(f"Exception type: {type(e)}")
        import traceback

        print(f"Traceback: {traceback.format_exc()}")

        return Response(
            {"error": "Failed to fetch membership history", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_available_upgrades(request):
    """Get available upgrade plans for the current user"""
    try:
        user = request.user
        logger.info(f"Fetching available upgrades for user {user.email}")

        if user.user_type != "member":
            logger.warning(f"Non-member {user.email} tried to fetch upgrades")
            return Response([], status=status.HTTP_200_OK)

        if user.has_upgraded:
            logger.info(f"User {user.email} has already upgraded")
            return Response([], status=status.HTTP_200_OK)

        if not user.membership_plan:
            logger.info(f"User {user.email} has no membership plan")
            return Response([], status=status.HTTP_200_OK)

        if user.is_membership_expired():
            logger.info(f"User {user.email} has expired membership")
            return Response([], status=status.HTTP_200_OK)

        current_price = user.membership_plan.price
        logger.info(f"Current plan price for {user.email}: {current_price}")

        plans = MembershipPlan.objects.filter(
            is_active=True, price__gt=current_price
        ).order_by("price")

        logger.info(f"Found {plans.count()} upgrade plans for {user.email}")

        serializer = MembershipPlanSerializer(plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching available upgrades for {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to fetch available upgrades", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_upgrade_payment(request):

    try:
        user = request.user
        logger.info(f"Creating upgrade payment for user {user.email}")

        if user.user_type != "member":
            return Response(
                {"error": "Only members can upgrade their membership plan"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.has_upgraded:
            return Response(
                {"error": "You have already upgraded your membership plan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.membership_plan or user.is_membership_expired():
            return Response(
                {"error": "You must have an active membership plan to upgrade"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership_plan_id = request.data.get("membership_plan_id")
        if not membership_plan_id:
            return Response(
                {"error": "Membership plan ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {"error": "Invalid membership plan selected"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_plan.price <= user.membership_plan.price:
            return Response(
                {"error": "You can only upgrade to a more expensive plan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        amount_in_paise = int(new_plan.price * 100)

        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"upgrade_{user.id}_{membership_plan_id}_{timezone.now().timestamp()}",
            "notes": {
                "user_id": str(user.id),
                "membership_plan_id": str(membership_plan_id),
                "upgrade": "true",
                "current_plan_id": str(user.membership_plan.id),
            },
        }

        razorpay_order = client.order.create(order_data)

        response_data = {
            "key": settings.RAZORPAY_KEY_ID,
            "amount": amount_in_paise,
            "currency": "INR",
            "order_id": razorpay_order["id"],
            "name": "Gym Membership Upgrade",
            "description": f"Upgrade to {new_plan.name}",
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": getattr(user, "phone_number", ""),
            },
            "plan": {
                "id": new_plan.id,
                "name": new_plan.name,
                "price": str(new_plan.price),
            },
        }

        logger.info(
            f"Upgrade payment order created for {user.email}: {razorpay_order['id']}"
        )
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error creating upgrade payment for {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to create upgrade payment order", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_upgrade_payment(request):
    """Verify upgrade payment and update membership"""
    try:
        user = request.user
        logger.info(f"Verifying upgrade payment for user {user.email}")

        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        membership_plan_id = request.data.get("membership_plan_id")

        if not all(
            [
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                membership_plan_id,
            ]
        ):
            return Response(
                {"error": "Missing payment verification data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": razorpay_order_id,
                    "razorpay_payment_id": razorpay_payment_id,
                    "razorpay_signature": razorpay_signature,
                }
            )
        except razorpay.errors.SignatureVerificationError:
            logger.error(f"Payment signature verification failed for {user.email}")
            return Response(
                {"error": "Payment verification failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return Response(
                {"error": "Invalid membership plan"}, status=status.HTTP_400_BAD_REQUEST
            )

        old_plan = user.membership_plan
        user.membership_plan = new_plan
        user.membership_start_date = timezone.now()
        user.has_upgraded = True
        user.save()

        response_data = {
            "message": "Membership upgraded successfully",
            "old_plan": (
                {"id": old_plan.id, "name": old_plan.name, "price": str(old_plan.price)}
                if old_plan
                else None
            ),
            "new_plan": {
                "id": new_plan.id,
                "name": new_plan.name,
                "price": str(new_plan.price),
                "duration_days": new_plan.duration_days,
            },
            "user": UserSerializer(user).data,
            "upgrade_date": user.membership_start_date.isoformat(),
        }

        logger.info(
            f"Membership successfully upgraded for {user.email} to {new_plan.name}"
        )
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error verifying upgrade payment for {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to verify upgrade payment", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_membership_details(request):
    """Get current user's membership plan details"""
    try:
        user = request.user
        if user.user_type != "member":
            return Response(
                {"error": "Only members have membership plans"},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership_data = {
            "current_plan": None,
            "membership_start_date": None,
            "membership_expired": True,
            "has_upgraded": user.has_upgraded,
            "days_remaining": 0,
        }

        if user.membership_plan:
            membership_data.update(
                {
                    "current_plan": MembershipPlanSerializer(user.membership_plan).data,
                    "membership_start_date": (
                        user.membership_start_date.isoformat()
                        if user.membership_start_date
                        else None
                    ),
                    "membership_expired": user.is_membership_expired(),
                }
            )

            if user.membership_start_date and not user.is_membership_expired():
                end_date = user.membership_start_date + timezone.timedelta(
                    days=user.membership_plan.duration_days
                )
                remaining = (end_date - timezone.now()).days
                membership_data["days_remaining"] = max(0, remaining)

        return Response(membership_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching membership details for {user.email}: {str(e)}")
        return Response(
            {"error": "Failed to fetch membership details"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@method_decorator(csrf_exempt, name="dispatch")
class CreateMembershipPaymentView(APIView):
    """
    Create payment order for membership renewal or new membership
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            membership_plan_id = request.data.get("membership_plan_id")

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

            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            order_data = {
                "amount": int(membership_plan.price * 100),
                "currency": "INR",
                "receipt": f"membership_{user.id}_{membership_plan.id}_{int(timezone.now().timestamp())}",
            }

            order = client.order.create(data=order_data)

            logger.info(
                f"Membership payment order created for user {user.email}, plan {membership_plan.name}"
            )

            return Response(
                {
                    "key": settings.RAZORPAY_KEY_ID,
                    "amount": order["amount"],
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
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error creating membership payment order: {str(e)}")
            return Response(
                {"error": "Failed to create payment order", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class VerifyMembershipPaymentView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            razorpay_order_id = request.data.get("razorpay_order_id")
            razorpay_payment_id = request.data.get("razorpay_payment_id")
            razorpay_signature = request.data.get("razorpay_signature")
            membership_plan_id = request.data.get("membership_plan_id")

            if not all(
                [
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    membership_plan_id,
                ]
            ):
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

            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            try:
                client.utility.verify_payment_signature(
                    {
                        "razorpay_order_id": razorpay_order_id,
                        "razorpay_payment_id": razorpay_payment_id,
                        "razorpay_signature": razorpay_signature,
                    }
                )
            except razorpay.errors.SignatureVerificationError:
                return Response(
                    {"error": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.membership_plan = membership_plan
            user.membership_start_date = timezone.now()
            user.has_paid = True
            user.is_subscribed = True
            user.has_upgraded = False
            user.save()

            logger.info(
                f"Membership payment verified and assigned for user {user.email}, plan {membership_plan.name}"
            )

            return Response(
                {
                    "message": "Membership activated successfully",
                    "membership_plan": {
                        "id": membership_plan.id,
                        "name": membership_plan.name,
                        "duration_days": membership_plan.duration_days,
                    },
                    "membership_start_date": user.membership_start_date.isoformat(),
                    "payment_id": razorpay_payment_id,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error verifying membership payment: {str(e)}")
            return Response(
                {"error": "Failed to verify payment", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class VerifyChangeMembershipPaymentView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            razorpay_order_id = request.data.get("razorpay_order_id")
            razorpay_payment_id = request.data.get("razorpay_payment_id")
            razorpay_signature = request.data.get("razorpay_signature")
            membership_plan_id = request.data.get("membership_plan_id")

            if not all(
                [
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    membership_plan_id,
                ]
            ):
                return Response(
                    {"error": "All payment details are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not user.membership_plan or user.is_membership_expired():
                return Response(
                    {"error": "You need an active membership to upgrade"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                new_membership_plan = MembershipPlan.objects.get(
                    id=membership_plan_id, is_active=True
                )
            except MembershipPlan.DoesNotExist:
                return Response(
                    {"error": "Invalid membership plan"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if new_membership_plan.price <= user.membership_plan.price:
                return Response(
                    {"error": "Selected plan is not an upgrade"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

            try:
                client.utility.verify_payment_signature(
                    {
                        "razorpay_order_id": razorpay_order_id,
                        "razorpay_payment_id": razorpay_payment_id,
                        "razorpay_signature": razorpay_signature,
                    }
                )
            except razorpay.errors.SignatureVerificationError:
                return Response(
                    {"error": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.membership_plan = new_membership_plan
            user.membership_start_date = timezone.now()
            user.has_upgraded = True
            user.save()

            logger.info(
                f"Membership upgrade completed for user {user.email}, new plan {new_membership_plan.name}"
            )

            return Response(
                {
                    "message": "Membership upgraded successfully",
                    "membership_plan": {
                        "id": new_membership_plan.id,
                        "name": new_membership_plan.name,
                        "duration_days": new_membership_plan.duration_days,
                    },
                    "membership_start_date": user.membership_start_date.isoformat(),
                    "payment_id": razorpay_payment_id,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error verifying upgrade payment: {str(e)}")
            return Response(
                {"error": "Failed to verify upgrade payment", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def available_upgrades(request):

    try:
        user = request.user

        if not user.membership_plan or user.is_membership_expired():
            return Response(
                {"error": "You need an active membership to view upgrades"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.has_upgraded:
            return Response(
                {"message": "You have already upgraded your membership"},
                status=status.HTTP_200_OK,
            )

        available_plans = MembershipPlan.objects.filter(
            is_active=True, price__gt=user.membership_plan.price
        ).order_by("price")

        serializer = MembershipPlanSerializer(available_plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching available upgrades: {str(e)}")
        return Response(
            {"error": "Failed to fetch available upgrades"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def membership_status(request):

    try:
        user = request.user

        response_data = {
            "has_membership": bool(user.membership_plan),
            "membership_expired": (
                user.is_membership_expired() if user.membership_plan else True
            ),
            "membership_plan": (
                {
                    "id": user.membership_plan.id,
                    "name": user.membership_plan.name,
                    "price": str(user.membership_plan.price),
                    "duration_days": user.membership_plan.duration_days,
                }
                if user.membership_plan
                else None
            ),
            "membership_start_date": (
                user.membership_start_date.isoformat()
                if user.membership_start_date
                else None
            ),
            "has_upgraded": user.has_upgraded,
            "is_subscribed": user.is_subscribed,
        }

        if user.membership_plan and user.membership_start_date:
            expiration_date = user.membership_start_date + timedelta(
                days=user.membership_plan.duration_days
            )
            response_data["membership_expiration_date"] = expiration_date.isoformat()
            response_data["days_remaining"] = max(
                0, (expiration_date - timezone.now()).days
            )

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching membership status: {str(e)}")
        return Response(
            {"error": "Failed to fetch membership status"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
