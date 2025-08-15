from django.contrib import admin
from .models import User, TrainerProfile, UserProfile, DietPlan, WorkoutRoutine, MemberAttendance, TrainerRating

# Register your models here.
admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(TrainerProfile)
admin.site.register(DietPlan)
admin.site.register(WorkoutRoutine)
admin.site.register(MemberAttendance)
admin.site.register(TrainerRating)

