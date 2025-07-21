
from django.urls import path
from .import views
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView




urlpatterns = [


    path('me/', trainer_details, name='trainer_details'),
    path('assigned-members/', TrainerAssignedMembersView.as_view(), name='trainer-assigned-members'),
    path('mark-attendance/', MarkAttendanceView.as_view(), name='mark_attendance'),
    path('members/<int:member_id>/attendance/', MemberAttendanceHistoryView.as_view(), name='member_attendance_history'),
    path('assigned-members/', TrainerAssignedMembersView.as_view(), name='trainer-assigned-members'),


    path('workout-routine/', CreateWorkoutRoutineView.as_view(), name='create_workout_routine'),
    path('members/<int:member_id>/workout-routines/', WorkoutRoutineHistoryView.as_view(), name='workout_routine_history'),
    path('edit-profile/', edit_own_profile, name='edit-own-profile'),

    path('default-diet-plans/', views.DefaultDietPlanView.as_view(), name='default-diet-plans'),
    path('diet-plan/', views.CreateDietPlanView.as_view(), name='create-diet-plan'),
    path('diet-plan/<int:diet_plan_id>/', views.CreateDietPlanView.as_view(), name='update-delete-diet-plan'),

    path('assign-diet-plan/', views.AssignDietPlanView.as_view(), name='assign-diet-plan'),

    path('workout-routine/', views.CreateWorkoutRoutineView.as_view(), name='create_workout_routine'),
    path('members/<int:member_id>/workout-routines/', views.WorkoutRoutineHistoryView.as_view(), name='workout_routine_history'),
    path('create-weekly-cycle/', views.CreateWeeklyWorkoutCycleView.as_view(), name='create_weekly_cycle'),

    path('<int:trainer_id>/ratings/', views.get_trainer_ratings, name='get_trainer_ratings'),

    path('attendance/<int:trainer_id>/', TrainerAttendanceHistoryView.as_view(), name='trainer-attendance-history'),





]