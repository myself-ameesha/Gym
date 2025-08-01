from rest_framework import status, pagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from api.serializers import UserSerializer
from api.permissions import IsTrainer
from api.serializers import (
    TrainerProfileSerializer,
    WorkoutRoutineSerializer,
    WeeklyWorkoutCycleSerializer,
    TrainerAttendanceSerializer,
)
from api.serializers import MemberAttendanceSerializer
from api.serializers import (
    DefaultDietPlanSerializer,
    DietPlanSerializer,
    AssignedDietSerializer,
    TrainerRatingSerializer,
)

from api.models import TrainerProfile
from api.models import AssignedDiet, WeeklyWorkoutCycle
from api.models import MemberAttendance
from api.models import DietPlan, WorkoutRoutine
from api.models import User, DefaultDietPlan, TrainerRating, TrainerAttendance

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from datetime import datetime
import logging


User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_own_profile(request):
    try:
        logger.info(f"Profile edit attempt by {request.user.email} at {datetime.now()}")
        logger.info(f"Request data: {dict(request.data)}")
        logger.info(f"Request files: {dict(request.FILES)}")

        if (
            not hasattr(request.user, "user_type")
            or request.user.user_type != "trainer"
        ):
            logger.warning("Unauthorized attempt by user %s", request.user)
            return Response(
                {"error": "Only trainers can edit their own profiles"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_data = {
            "first_name": request.data.get("first_name", request.user.first_name),
            "last_name": request.data.get("last_name", request.user.last_name),
            "email": request.data.get("email", request.user.email),
            "phone_number": request.data.get(
                "phone_number", request.user.phone_number or ""
            ),
            "specialization": request.data.get(
                "specialization", request.user.specialization or ""
            ),
        }
        user_serializer = UserSerializer(request.user, data=user_data, partial=True)
        if not user_serializer.is_valid():
            logger.error("User serializer errors: %s", user_serializer.errors)
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        trainer_profile_data = {}
        if "profile_img" in request.FILES:
            trainer_profile_data["profile_img"] = request.FILES["profile_img"]
            logger.info(f"Profile image provided: {request.FILES['profile_img'].name}")
        elif request.data.get("profile_img") == "":
            trainer_profile_data["profile_img"] = None
            logger.info("Profile image set to None")

        try:
            trainer_profile = request.user.trainer_profile
            profile_serializer = TrainerProfileSerializer(
                trainer_profile, data=trainer_profile_data, partial=True
            )
            if not profile_serializer.is_valid():
                logger.error("Profile serializer errors: %s", profile_serializer.errors)
                return Response(
                    profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )
            profile_serializer.save()
            if trainer_profile.profile_img:
                logger.info(
                    f"Profile image saved at: {trainer_profile.profile_img.path}"
                )
                logger.info(f"Profile image URL: {trainer_profile.profile_img.url}")
            else:
                logger.info("No profile image saved")
        except TrainerProfile.DoesNotExist:
            if trainer_profile_data:
                trainer_profile_data["user"] = request.user
                profile_serializer = TrainerProfileSerializer(data=trainer_profile_data)
                if not profile_serializer.is_valid():
                    logger.error(
                        "Profile serializer errors: %s", profile_serializer.errors
                    )
                    return Response(
                        profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )
                profile_serializer.save()
                logger.info(
                    f"New TrainerProfile created with image: {trainer_profile_data.get('profile_img')}"
                )
                if profile_serializer.instance.profile_img:
                    logger.info(
                        f"Profile image saved at: {profile_serializer.instance.profile_img.path}"
                    )
                    logger.info(
                        f"Profile image URL: {profile_serializer.instance.profile_img.url}"
                    )

        user_serializer.save()

        response_data = user_serializer.data
        response_data["trainer_profile"] = profile_serializer.data
        logger.info(f"Profile updated successfully for user {request.user.email}")
        logger.info(f"Response data: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)

    except IntegrityError as e:
        logger.error("IntegrityError: %s", str(e))
        return Response(
            {"error": "Email or phone number already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except AttributeError as e:
        logger.error("AttributeError: %s", str(e))
        return Response(
            {"error": f"Invalid user data: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        logger.error("Unexpected error: %s", str(e), exc_info=True)
        return Response(
            {"error": f"Failed to update profile: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trainer_details(request):
    """
    Retrieve the details of the currently logged-in trainer, including their profile.
    """
    try:
        user = request.user
        if user.user_type != "trainer":
            logger.warning("Unauthorized attempt by user %s", user)
            return Response(
                {"error": "Only trainers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_serializer = UserSerializer(user)

        try:
            trainer_profile = TrainerProfile.objects.get(user=user)
            profile_serializer = TrainerProfileSerializer(trainer_profile)
            response_data = {
                **user_serializer.data,
                "trainer_profile": profile_serializer.data,
            }
        except TrainerProfile.DoesNotExist:
            response_data = {**user_serializer.data, "trainer_profile": None}

        logger.info("Trainer details fetched for user %s", user)
        return Response(response_data)
    except Exception as e:
        logger.error("Error fetching trainer details: %s", str(e), exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkAttendanceView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def post(self, request):
        data = request.data.copy()

        serializer = MemberAttendanceSerializer(data=data, context={"request": request})
        if serializer.is_valid():

            member = serializer.validated_data["member"]
            date = serializer.validated_data["date"]
            status_val = serializer.validated_data["status"]

            attendance = MemberAttendance(
                member=member, trainer=request.user, date=date, status=status_val
            )
            attendance.save()

            serializer = MemberAttendanceSerializer(
                attendance, context={"request": request}
            )
            return Response(
                {
                    "message": "Attendance marked successfully",
                    "attendance": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MemberAttendanceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        try:
            member = User.objects.get(id=member_id, user_type="member")

            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {
                        "error": "You can only view your own attendance or that of your assigned members"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            attendance_records = MemberAttendance.objects.filter(member=member)
            serializer = MemberAttendanceSerializer(attendance_records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )


class DefaultDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info("Fetching default diet plans")
        plans = DefaultDietPlan.objects.filter(is_default=True)
        serializer = DefaultDietPlanSerializer(plans, many=True)
        return Response(serializer.data)

    def post(self, request):
        logger.info(f"Creating default diet plan: {request.data}")
        data = request.data.copy()
        data["is_default"] = True
        serializer = DefaultDietPlanSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Default diet plan created successfully",
                    "diet_plan": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Creating diet plan: {request.data}")
        data = request.data.copy()
        data["trainer"] = request.user.id
        serializer = DietPlanSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            diet_plan = serializer.save()

            AssignedDiet.objects.create(
                member=diet_plan.member, diet_plan=diet_plan, is_active=True
            )
            return Response(
                {
                    "message": "Diet plan created and assigned successfully",
                    "diet_plan": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, diet_plan_id):
        logger.info(f"Updating diet plan {diet_plan_id}: {request.data}")
        try:
            diet_plan = DietPlan.objects.get(id=diet_plan_id, trainer=request.user)
            data = request.data.copy()
            data["trainer"] = request.user.id
            serializer = DietPlanSerializer(
                diet_plan, data=data, context={"request": request}, partial=True
            )
            if serializer.is_valid():
                diet_plan = serializer.save()
                return Response(
                    {
                        "message": "Diet plan updated successfully",
                        "diet_plan": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DietPlan.DoesNotExist:
            logger.error(
                f"Diet plan {diet_plan_id} not found or unauthorized for trainer {request.user.id}"
            )
            return Response(
                {"error": "Diet plan not found or you are not authorized to edit it"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def delete(self, request, diet_plan_id):
        logger.info(
            f"DELETE request for diet plan {diet_plan_id} by trainer {request.user.id}"
        )
        try:
            diet_plan = DietPlan.objects.get(id=diet_plan_id, trainer=request.user)
            logger.info(
                f"Found diet plan {diet_plan_id}: {diet_plan.title} for member {diet_plan.member.email}"
            )
            diet_plan.delete()
            return Response(
                {"message": "Diet plan deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except DietPlan.DoesNotExist:
            logger.error(
                f"Diet plan {diet_plan_id} not found or unauthorized for trainer {request.user.id}. Available diet plans: {list(DietPlan.objects.filter(trainer=request.user).values('id', 'title'))}"
            )
            return Response(
                {"error": "Diet plan not found or you are not authorized to delete it"},
                status=status.HTTP_404_NOT_FOUND,
            )


class AssignDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Assigning diet plan: {request.data}")
        serializer = AssignedDietSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Diet plan assigned successfully",
                    "assignment": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateWorkoutRoutineView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def post(self, request):
        data = request.data.copy()
        data["trainer"] = request.user.id
        serializer = WorkoutRoutineSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            workout_routine = serializer.save()

            cycle = WeeklyWorkoutCycle.objects.filter(
                member=workout_routine.member, is_active=True
            ).first()
            if not cycle:
                WeeklyWorkoutCycle.objects.create(
                    member=workout_routine.member,
                    start_date=workout_routine.start_date,
                    is_active=True,
                )
            return Response(
                {
                    "message": "Workout routine created successfully",
                    "workout_routine": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkoutRoutineHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        try:
            member = User.objects.get(id=member_id, user_type="member")
            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {
                        "error": "You can only view your own workout routines or those of your assigned members"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            workout_routines = WorkoutRoutine.objects.filter(member=member).order_by(
                "day_number"
            )
            serializer = WorkoutRoutineSerializer(workout_routines, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CreateWeeklyWorkoutCycleView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def post(self, request):
        data = request.data.copy()
        serializer = WeeklyWorkoutCycleSerializer(
            data=data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Weekly workout cycle created successfully",
                    "cycle": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_trainer_ratings(request, trainer_id):
    try:

        trainer = User.objects.get(id=trainer_id, user_type="trainer")

        ratings = TrainerRating.objects.filter(trainer=trainer).select_related("member")

        serializer = TrainerRatingSerializer(ratings, many=True)
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response({"error": "Trainer not found"}, status=404)
    except Exception as e:

        print(f"Error in get_trainer_ratings: {str(e)}")
        return Response({"error": f"Server error: {str(e)}"}, status=500)


class TrainerAssignedMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "trainer":
            return Response(
                {"error": "Only trainers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN,
            )

        members = User.objects.filter(
            user_type="member", assigned_trainer=request.user, is_active=True
        )
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TrainerAttendanceHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = pagination.PageNumberPagination
    pagination_class.page_size = 4

    def get(self, request, trainer_id):

        try:

            trainer_id = int(trainer_id)
            trainer = User.objects.get(id=trainer_id, user_type="trainer")

            if request.user.id != trainer_id and request.user.user_type != "admin":
                logger.warning(
                    "Unauthorized attempt by user %s to access trainer %s attendance",
                    request.user.id,
                    trainer_id,
                )
                return Response(
                    {
                        "error": "You can only view your own attendance or that of trainers if you are an admin"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            attendance_records = TrainerAttendance.objects.filter(
                trainer=trainer
            ).order_by("-date")

            paginator = self.pagination_class()
            paginated_records = paginator.paginate_queryset(attendance_records, request)
            serializer = TrainerAttendanceSerializer(paginated_records, many=True)

            logger.debug(
                "Attendance records for trainer %s: %s", trainer_id, serializer.data
            )

            return paginator.get_paginated_response(serializer.data)

        except ValueError:
            logger.error("Invalid trainer ID format: %s", trainer_id)
            return Response(
                {"error": "Invalid trainer ID format"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except User.DoesNotExist:
            logger.error("Trainer not found: %s", trainer_id)
            return Response(
                {"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(
                "Error fetching attendance for trainer %s: %s",
                trainer_id,
                str(e),
                exc_info=True,
            )
            return Response(
                {"error": "An error occurred while fetching attendance records"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
