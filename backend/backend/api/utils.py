from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(user, otp_code):
    subject = 'Verify Your Fitness Account'
    message = f'''
    Hello {user.first_name},
    
    Thank you for registering with our Fitness App. Please use the following code to verify your account:
    
    {otp_code}
    
    This code will expire in 10 minutes.
    
    If you did not request this, please ignore this email.
    
    Best regards,
    The Fitness App Team
    '''
    
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)



