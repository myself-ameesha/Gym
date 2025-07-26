from django.contrib.auth.models import AbstractUser, Group, Permission, BaseUserManager
from django.db import models
from django.conf import settings
import random
from datetime import timedelta
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """Custom user manager for email authentication instead of username."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)

         # Remove username from extra_fields if it exists
        if 'username' in extra_fields:
            del extra_fields['username']

        user = self.model(email=email, username=email, **extra_fields)  # Set username=email for compatibility
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)


class MembershipPlan(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.PositiveIntegerField(help_text="Duration of the plan in days")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class User(AbstractUser):

    # Use our custom manager
    objects = CustomUserManager()

    USER_TYPE_CHOICES = (
        ('member', 'Member'),
        ('trainer', 'Trainer'),
        ('admin', 'Admin'),
    )

    FITNESS_GOALS = (
        ('weight_loss', 'Weight Loss'),
        ('weight_gain', 'Weight Gain'),
        ('general_fitness', 'General Fitness'),
    )

    # Remove the unique constraint but keep the field for Django compatibility
    username = models.CharField(max_length=250, unique=False, blank=True)
    email = models.EmailField(max_length=250, unique=True)
    is_active = models.BooleanField(default=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='member')
    # New field for trainer assignment
    assigned_trainer = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={'user_type': 'trainer'},
        related_name='assigned_members'
    )
    # Fields applicable only to members
    membership_plan = models.ForeignKey(MembershipPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    membership_start_date = models.DateTimeField(null=True, blank=True)
    fitness_goal = models.CharField(max_length=15, choices=FITNESS_GOALS, null=True, blank=True)

    # Field applicable only to trainers
    specialization = models.CharField(max_length=255, null=True, blank=True)
    requires_password_reset = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    has_paid = models.BooleanField(default=False)
    is_subscribed = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    # Override `groups` and `user_permissions` to avoid conflicts
    groups = models.ManyToManyField(Group, related_name="api_users_groups", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="api_users_permissions", blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  

    def save(self, *args, **kwargs):
        # Auto-generate username from email if not set
        if not self.username:
            self.username = self.email
            
        # Ensure membership_type & fitness_goal are for members, specialization is for trainers
        if self.user_type != 'member':
            self.membership_type = None
            self.fitness_goal = None
        if self.user_type != 'trainer':
            self.specialization = None
        super().save(*args, **kwargs)

    def is_membership_expired(self):
        """Check if the user's membership plan has expired."""
        if not self.membership_plan or not self.membership_start_date:
            return True
        expiration_date = self.membership_start_date + timedelta(days=self.membership_plan.duration_days)
        return timezone.now() > expiration_date    

    def __str__(self):
        return self.email
     
    
class UserProfile(models.Model):
    FOOD_PREFERENCE_CHOICES = (
        ('veg', 'Vegetarian'),
        ('non_veg', 'Non-Vegetarian'),
        ('vegan', 'Vegan'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_profile')
    profile_img = models.ImageField(upload_to='profile', blank=True, null=True)
    address = models.TextField(blank=True)
    height = models.FloatField(null=True, blank=True) 
    weight = models.FloatField(null=True, blank=True) 
    date_of_join = models.DateField(null=True, blank=True)
    food_preference = models.CharField(max_length=10, choices=FOOD_PREFERENCE_CHOICES, null=True, blank=True)
    medical_issues = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - User Profile"

class TrainerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trainer_profile')
    profile_img = models.ImageField(upload_to='trainer_profiles/', null=True, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email} - Trainer Profile"


class OTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    @classmethod
    def generate_otp(cls, user):
        # Delete existing unused OTPs for this user
        cls.objects.filter(user=user, is_used=False).delete()
        
        # Generate a 6-digit OTP
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Set expiration time (10 minutes from now)
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Create and return the OTP
        otp = cls.objects.create(user=user, code=code, expires_at=expires_at)
        return otp
    
    def is_valid(self):
        # Check if OTP is not used and not expired
        return not self.is_used and self.expires_at > timezone.now()


class MemberAttendance(models.Model):
    ATTENDANCE_STATUS = (
        ('present', 'Present'),
        ('absent', 'Absent'),
    )
    
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        limit_choices_to={'user_type': 'member'}
    )
    trainer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_attendance',
        limit_choices_to={'user_type': 'trainer'}
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS, default='present')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('member', 'date')  # One record per member per date
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.member.email} - {self.date} - {self.status}"



class DefaultDietPlan(models.Model):
    fitness_goal = models.CharField(
        max_length=15,
        choices=User.FITNESS_GOALS,
        unique=True
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    is_default = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Default {self.fitness_goal} Diet Plan"

class DietPlan(models.Model):
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='diet_plans',
        limit_choices_to={'user_type': 'member'}
    )
    trainer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_diet_plans',
        limit_choices_to={'user_type': 'trainer'}
    )
    default_diet_plan = models.ForeignKey(
        DefaultDietPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_diet_plans'
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate other diet plans for the same member
            DietPlan.objects.filter(
                member=self.member,
                is_active=True
            ).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} for {self.member.email} ({self.start_date})"

class AssignedDiet(models.Model):
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_diets', limit_choices_to={'user_type': 'member'})
    diet_plan = models.ForeignKey(DietPlan, on_delete=models.CASCADE, related_name='assignments')
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['member', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_diet_per_member'
            )
        ]

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate other active diet plans for this member
            AssignedDiet.objects.filter(member=self.member, is_active=True).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.diet_plan.title} assigned to {self.member.email}"
    
class WorkoutRoutine(models.Model):
    DAY_CHOICES = (
        (1, 'Day 1'),
        (2, 'Day 2'),
        (3, 'Day 3'),
        (4, 'Day 4'),
        (5, 'Day 5'),
        (6, 'Day 6'),
        (7, 'Recovery Day'),
    )
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workout_routines',
        limit_choices_to={'user_type': 'member'}
    )
    trainer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_workout_routines',
        limit_choices_to={'user_type': 'trainer'}
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    day_number = models.IntegerField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_number']
        constraints = [
            models.UniqueConstraint(
                fields=['member', 'day_number'],
                name='unique_workout_per_day_per_member'
            )
        ]

    def __str__(self):
        return f"{self.title} for {self.member.email} (Day {self.day_number})"

class WeeklyWorkoutCycle(models.Model):
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='weekly_workout_cycles',
        limit_choices_to={'user_type': 'member'}
    )
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['member', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_cycle_per_member'
            )
        ]

    def save(self, *args, **kwargs):
        if self.is_active:
            WeeklyWorkoutCycle.objects.filter(member=self.member, is_active=True).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Workout Cycle for {self.member.email} starting {self.start_date}"


class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    membership_plan = models.ForeignKey(MembershipPlan, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    razorpay_order_id = models.CharField(max_length=100)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.id} for {self.user.email}"
    

class TrainerRating(models.Model):
    member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trainer_ratings',
        limit_choices_to={'user_type': 'member'}
    )
    trainer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_ratings',
        limit_choices_to={'user_type': 'trainer'}
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],  # 1 to 5 stars
        help_text="Rating from 1 to 5"
    )
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('member', 'trainer')  # One rating per member-trainer pair
        ordering = ['-created_at']

    def __str__(self):
        return f"Rating {self.rating} by {self.member.email} for {self.trainer.email}"


class TrainerAttendance(models.Model):
    ATTENDANCE_STATUS = (
        ('present', 'Present'),
        ('absent', 'Absent'),
    )
    
    trainer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trainer_attendance_records',
        limit_choices_to={'user_type': 'trainer'}
    )
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_trainer_attendance',
        limit_choices_to={'user_type': 'admin'}
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS, default='present')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('trainer', 'date')  
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.trainer.email} - {self.date} - {self.status}"


class MembershipHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='membership_history')
    membership_plan = models.ForeignKey('MembershipPlan', on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.user.email} - {self.membership_plan.name} ({self.start_date})"


