from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework import status 
from rest_framework.response import Response 
from rest_framework.views import APIView 
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from api.serializers import UserSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from api.permissions import IsAdmin, IsTrainer
from api.serializers import UserSerializer, TrainerProfileSerializer ,TrainerBasicSerializer, WorkoutRoutineSerializer, WeeklyWorkoutCycleSerializer, TrainerAttendanceSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from api.models import TrainerProfile, UserProfile
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny
from api.models import MembershipPlan, AssignedDiet, WeeklyWorkoutCycle
from api.serializers import MembershipPlanSerializer
from datetime import datetime
from api.utils import send_otp_email
from api.models import User, OTP
from api.serializers import UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from api.models import MemberAttendance
from api.serializers import MemberAttendanceSerializer
from api.serializers import DefaultDietPlanSerializer, DietPlanSerializer, AssignedDietSerializer
from django.utils import timezone
from api.models import DietPlan, WorkoutRoutine
from api.serializers import DietPlanSerializer, WorkoutRoutineSerializer, DefaultDietPlanSerializer, TrainerRatingSerializer

from api.models import User, OTP, MembershipPlan, Payment, DefaultDietPlan, TrainerRating, TrainerAttendance
from api.serializers import UserSerializer, UserProfileSerializer
from django.core.exceptions import ObjectDoesNotExist

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


# Create your views here.


User = get_user_model()
logger = logging.getLogger(__name__)


#TRAINER VIEW

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_own_profile(request):
    try:
        print("Request data:", request.data)  # Debug logging
        if not hasattr(request.user, 'user_type') or request.user.user_type != 'trainer':
            return Response(
                {"error": "Only trainers can edit their own profiles"},
                status=403
            )

        # Update User model fields
        user_serializer = UserSerializer(request.user, data=request.data, partial=True)
        if not user_serializer.is_valid():
            print("User serializer errors:", user_serializer.errors)
            return Response(user_serializer.errors, status=400)

        # Update TrainerProfile if it exists
        trainer_profile_data = {
            'phone_number': request.data.get('phone_number'),
            'specialization': request.data.get('specialization')
        }
        try:
            trainer_profile = request.user.trainer_profile
            profile_serializer = TrainerProfileSerializer(trainer_profile, data=trainer_profile_data, partial=True)
            if not profile_serializer.is_valid():
                print("Profile serializer errors:", profile_serializer.errors)
                return Response(profile_serializer.errors, status=400)
            profile_serializer.save()
        except TrainerProfile.DoesNotExist:
            # Optionally create a new TrainerProfile if it doesn't exist
            if trainer_profile_data['phone_number'] or trainer_profile_data['specialization']:
                profile_serializer = TrainerProfileSerializer(data=trainer_profile_data)
                if profile_serializer.is_valid():
                    profile_serializer.save(user=request.user)
                else:
                    print("Profile serializer errors:", profile_serializer.errors)
                    return Response(profile_serializer.errors, status=400)

        user_serializer.save()
        return Response(user_serializer.data)

    except IntegrityError as e:
        return Response(
            {"error": "Email already exists. Please use a different email."},
            status=400
        )
    except AttributeError as e:
        return Response(
            {"error": f"Invalid user data: {str(e)}"},
            status=400
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to update profile: {str(e)}"},
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trainer_details(request):
    """
    Retrieve the details of the currently logged-in trainer.
    """
    try:
        user = request.user
        if user.user_type != 'trainer':
            return Response(
                {'error': 'Only trainers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )   

    

#original
# class VerifyOTPView(APIView):
#     permission_classes = [AllowAny]
    
#     def post(self, request):
#         email = request.data.get('email')
#         otp_code = request.data.get('otp_code')
        
#         if not email or not otp_code:
#             return Response(
#                 {'error': 'Email and OTP code are required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             # Find the user
#             user = User.objects.get(email=email)
            
#             # Find the latest OTP for this user
#             otp = OTP.objects.filter(
#                 user=user,
#                 code=otp_code,
#                 is_used=False
#             ).order_by('-created_at').first()
            
#             if not otp:
#                 return Response(
#                     {'error': 'Invalid OTP code'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
            
#             if not otp.is_valid():
#                 return Response(
#                     {'error': 'OTP has expired. Please request a new one.'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
            
#             # Mark OTP as used
#             otp.is_used = True
#             otp.save()
            
#             # Mark user as verified
#             user.is_verified = True
#             user.save()
            
#             # Generate tokens for auto-login
#             refresh = RefreshToken.for_user(user)
#             refresh['user_type'] = user.user_type
#             refresh['email'] = user.email
#             refresh['requires_password_reset'] = user.requires_password_reset
            
#             return Response({
#                 'message': 'Email verification successful',
#                 'email': user.email,
#                 'user_type': user.user_type,
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token),
#             }, status=status.HTTP_200_OK)
            
#         except User.DoesNotExist:
#             return Response(
#                 {'error': 'User not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             logger.error(f"OTP verification error: {str(e)}")
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
        
   

class MarkAttendanceView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]
    
    def post(self, request):
        data = request.data.copy()
        
        # Validate the data using the serializer
        serializer = MemberAttendanceSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            # Create the MemberAttendance instance manually
            member = serializer.validated_data['member']
            date = serializer.validated_data['date']
            status_val = serializer.validated_data['status']
            
            # Create the instance and set the trainer explicitly
            attendance = MemberAttendance(
                member=member,
                trainer=request.user,  # Set the trainer to the authenticated user
                date=date,
                status=status_val
            )
            attendance.save()
            
            # Serialize the saved instance to return in the response
            serializer = MemberAttendanceSerializer(attendance, context={'request': request})
            return Response({
                'message': 'Attendance marked successfully',
                'attendance': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MemberAttendanceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        try:
            member = User.objects.get(id=member_id, user_type='member')
            # Allow access if the requester is the member themselves or their assigned trainer
            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {'error': 'You can only view your own attendance or that of your assigned members'},
                    status=status.HTTP_403_FORBIDDEN
                )

            attendance_records = MemberAttendance.objects.filter(member=member)
            serializer = MemberAttendanceSerializer(attendance_records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
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
        data['is_default'] = True
        serializer = DefaultDietPlanSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Default diet plan created successfully',
                'diet_plan': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateDietPlanView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logger.info(f"Creating diet plan: {request.data}")
        data = request.data.copy()
        data['trainer'] = request.user.id
        serializer = DietPlanSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            diet_plan = serializer.save()
            # Automatically assign the diet plan to the member
            AssignedDiet.objects.create(member=diet_plan.member, diet_plan=diet_plan, is_active=True)
            return Response({
                'message': 'Diet plan created and assigned successfully',
                'diet_plan': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, diet_plan_id):
        logger.info(f"Updating diet plan {diet_plan_id}: {request.data}")
        try:
            diet_plan = DietPlan.objects.get(id=diet_plan_id, trainer=request.user)
            data = request.data.copy()
            data['trainer'] = request.user.id
            serializer = DietPlanSerializer(diet_plan, data=data, context={'request': request}, partial=True)
            if serializer.is_valid():
                diet_plan = serializer.save()
                return Response({
                    'message': 'Diet plan updated successfully',
                    'diet_plan': serializer.data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DietPlan.DoesNotExist:
            logger.error(f"Diet plan {diet_plan_id} not found or unauthorized for trainer {request.user.id}")
            return Response(
                {'error': 'Diet plan not found or you are not authorized to edit it'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, diet_plan_id):
        logger.info(f"DELETE request for diet plan {diet_plan_id} by trainer {request.user.id}")
        try:
            diet_plan = DietPlan.objects.get(id=diet_plan_id, trainer=request.user)
            logger.info(f"Found diet plan {diet_plan_id}: {diet_plan.title} for member {diet_plan.member.email}")
            diet_plan.delete()
            return Response({
                'message': 'Diet plan deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except DietPlan.DoesNotExist:
            logger.error(f"Diet plan {diet_plan_id} not found or unauthorized for trainer {request.user.id}. Available diet plans: {list(DietPlan.objects.filter(trainer=request.user).values('id', 'title'))}")
            return Response(
                {'error': 'Diet plan not found or you are not authorized to delete it'},
                status=status.HTTP_404_NOT_FOUND
            )


class AssignDietPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Assigning diet plan: {request.data}")
        serializer = AssignedDietSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Diet plan assigned successfully',
                'assignment': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateWorkoutRoutineView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]
    
    def post(self, request):
        data = request.data.copy()
        data['trainer'] = request.user.id
        serializer = WorkoutRoutineSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            workout_routine = serializer.save()
            # Check if a weekly workout cycle exists, create one if not
            cycle = WeeklyWorkoutCycle.objects.filter(member=workout_routine.member, is_active=True).first()
            if not cycle:
                WeeklyWorkoutCycle.objects.create(
                    member=workout_routine.member,
                    start_date=workout_routine.start_date,
                    is_active=True
                )
            return Response({
                'message': 'Workout routine created successfully',
                'workout_routine': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WorkoutRoutineHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, member_id):
        try:
            member = User.objects.get(id=member_id, user_type='member')
            if request.user.id != member_id and member.assigned_trainer != request.user:
                return Response(
                    {'error': 'You can only view your own workout routines or those of your assigned members'},
                    status=status.HTTP_403_FORBIDDEN
                )
            workout_routines = WorkoutRoutine.objects.filter(member=member).order_by('day_number')
            serializer = WorkoutRoutineSerializer(workout_routines, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class CreateWeeklyWorkoutCycleView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]
    
    def post(self, request):
        data = request.data.copy()
        serializer = WeeklyWorkoutCycleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Weekly workout cycle created successfully',
                'cycle': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trainer_ratings(request, trainer_id):
    try:
        # Check if trainer exists (filter by user_type='trainer')
        trainer = User.objects.get(id=trainer_id, user_type='trainer')
        
        # Get ratings for this trainer
        ratings = TrainerRating.objects.filter(trainer=trainer).select_related('member')
        
        serializer = TrainerRatingSerializer(ratings, many=True)
        return Response(serializer.data)
        
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error in get_trainer_ratings: {str(e)}")
        return Response({'error': f'Server error: {str(e)}'}, status=500)
    

class TrainerAssignedMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'trainer':
            return Response(
                {"error": "Only trainers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        members = User.objects.filter(
            user_type='member',
            assigned_trainer=request.user,
            is_active=True
        )
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


        
class TrainerAttendanceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trainer_id):
        try:
            # Convert trainer_id to integer for comparison
            trainer_id = int(trainer_id)
            trainer = User.objects.get(id=trainer_id, user_type='trainer')
            
            # Allow access if the requester is the trainer themselves or an admin
            if request.user.id != trainer_id and request.user.user_type != 'admin':
                return Response(
                    {'error': 'You can only view your own attendance or that of trainers if you are an admin'},
                    status=status.HTTP_403_FORBIDDEN
                )

            attendance_records = TrainerAttendance.objects.filter(trainer=trainer).order_by('-date')
            serializer = TrainerAttendanceSerializer(attendance_records, many=True)
            
            print(f"Attendance records for trainer {trainer_id}: {serializer.data}")  # Debug log
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid trainer ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in TrainerAttendanceHistoryView: {str(e)}")  # Debug log
            return Response(
                {'error': 'An error occurred while fetching attendance records'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

