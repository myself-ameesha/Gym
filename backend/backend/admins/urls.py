
from django.urls import path
from .import views
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView




urlpatterns = [


    
    path('create_trainer/', CreateTrainerView.as_view(), name='create_trainer'),
    path('trainer-list/', list_trainers, name='trainer-list'),
    path('trainer-edit/<int:pk>/', edit_trainer, name='trainer-edit'),
    path('trainer-delete/<int:pk>/', delete_trainer, name='trainer-delete'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('users_list/', views.users_list, name='users_list'),

    path('list_membership_plans/', views.list_membership_plans, name='list_membership_plans'),
    path('edit_membership_plan/<int:pk>/', views.edit_membership_plan, name='edit_membership_plan'),
    path('delete_membership_plan/<int:pk>/', views.delete_membership_plan, name='delete_membership_plan'),
    path('create_membership_plan/', views.CreateMembershipPlanView.as_view(), name='create_membership_plan'),
    path('public_membership_plans/', views.public_membership_plans, name='public_membership_plans'),
    path('paid-members/', PaidMembersListView.as_view(), name='paid-members-list'),

    path('members/<int:member_id>/assign-trainer/', views.assign_trainer, name='assign_trainer'),
    path('trainers/<int:trainer_id>/members/', views.get_trainer_members, name='get_trainer_members'),

    path('revenue/', RevenueView.as_view(), name='revenue'),
    path('sales-report/', views.SalesReportView.as_view(), name='sales-report'),
    path('sales-report-pdf/', views.SalesReportPDFView.as_view(), name='sales-report-pdf'),
    path('mark-attendance/', MarkTrainerAttendanceView.as_view(), name='mark-trainer-attendance'),
    path('trainer-list/', TrainerListView.as_view(), name='trainer-list'),




]