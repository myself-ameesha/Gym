from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile, TrainerProfile

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:  # Ensure this runs only when a user is first created
        if instance.user_type.lower() == 'member':  
            UserProfile.objects.create(user=instance)  # Creates member profile
        elif instance.user_type.lower() == 'trainer':  
            TrainerProfile.objects.create(user=instance)  # Creates trainer profile
