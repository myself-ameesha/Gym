
from django.urls import path
from .import views
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

urlpatterns = [
    
    path('api/token/',TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('api/calculate-bmi/', views.calculate_bmi, name='calculate_bmi'),

    path('auth/reset-password/', TrainerPasswordResetView.as_view(), name='reset-password'),
    path('auth/check-password-reset/', CheckPasswordResetRequiredView.as_view(), name='check-password-reset'),
    path('member/me/', get_current_member, name='get_current_member'),
    
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('members/<int:member_id>/trainer/', views.get_member_trainer, name='get_member_trainer'),
    
    path('forgot-password/request/', views.ForgotPasswordRequestView.as_view(), name='forgot_password_request'),
    path('forgot-password/verify-otp/', views.ForgotPasswordVerifyOTPView.as_view(), name='forgot_password_verify_otp'),
    path('forgot-password/reset/', views.ForgotPasswordResetView.as_view(), name='forgot_password_reset'),
    path('forgot-password/resend-otp/', ForgotPasswordResendOTPView.as_view(), name='resend-otp'),
    
    path('members/<int:member_id>/diet-plans/', views.DietPlanHistoryView.as_view(), name='diet-plan-history'),
    path('members/<int:member_id>/current-diet-plan/', views.CurrentDietPlanView.as_view(), name='current-diet-plan'),
    path('members/<int:member_id>/daily-workout/<str:date>/', views.MemberDailyWorkoutView.as_view(), name='member_daily_workout'),
    
    path('create-order/', views.CreateRazorpayOrderView.as_view(), name='create_order'),
    path('verify-payment/', views.VerifyRazorpayPaymentView.as_view(), name='verify_payment'),

    path('ratings/submit/', views.submit_trainer_rating, name='submit_trainer_rating'),
    path('members/ratings/', views.get_member_ratings, name='get_member_ratings'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/me/', UserDetailView.as_view(), {'pk': 'me'}, name='user-me'),

    path('members/membership-status/', views.get_member_membership_status, name='member_membership_status'),
    path('members/create-renewal-order/', views.CreateRenewalRazorpayOrderView.as_view(), name='create_renewal_order'),
    path('members/verify-renewal-payment/', views.VerifyRenewalRazorpayPaymentView.as_view(), name='verify_renewal_payment'),
  
    path('members/available-upgrades/', get_available_upgrades, name='available-upgrades'),
    path('members/calculate-upgrade/', views.calculate_upgrade_cost_api, name='calculate_upgrade_cost'),
    path('members/create-renewal-order/', EnhancedRenewMembershipView.as_view(), name='create-renewal-order'),
    path('members/verify-renewal-payment/', EnhancedVerifyRenewalPaymentView.as_view(), name='verify-renewal-payment'),




]
