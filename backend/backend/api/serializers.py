from rest_framework import serializers
from .models import User, UserProfile, TrainerProfile, MembershipPlan, MemberAttendance, DietPlan, WorkoutRoutine, DefaultDietPlan, AssignedDiet, WeeklyWorkoutCycle, TrainerRating, TrainerAttendance

class TrainerBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'specialization']

class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = ['id', 'name', 'description', 'price', 'duration_days', 'is_active', 'created_at', 'updated_at']

class DefaultDietPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DefaultDietPlan
        fields = ['id', 'fitness_goal', 'title', 'description', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class TrainerRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerRating
        fields = ['id', 'member', 'trainer', 'rating', 'feedback', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    membership_plan = MembershipPlanSerializer(read_only=True)
    membership_plan_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
    )
    assigned_trainer = TrainerBasicSerializer(read_only=True)
    assigned_trainer_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
    )
    membership_expired = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'date_of_birth', 'phone_number', 'fitness_goal',
                  'is_active', 'is_subscribed', 'is_verified', 'has_paid', 'last_name', 'membership_plan',
                  'requires_password_reset', 'specialization', 'user_type', 'membership_plan_id', 'password',
                  'date_joined', 'assigned_trainer','membership_expired', 'assigned_trainer_id']
        
        extra_kwargs = {
            'password': {'write_only': True},
            'membership_plan': {'read_only': True},
            'assigned_trainer': {'read_only': True},
            'membership_expired': {'read_only': True},
        }
    def get_membership_expired(self, obj):
        return obj.is_membership_expired()
        
    def validate_email(self, value):
        """
        Validate that the email is unique
        """
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        # Check if this is an update operation
        if self.instance:
            # For update, check if email already exists for other users
            if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        else:
            # For create, check if email already exists
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        
        return value

    def validate_phone_number(self, value):
        """
        Validate that the phone number is unique (if provided)
        """
        if value:  # Only validate if phone number is provided
            # Check if this is an update operation
            if self.instance:
                # For update, check if phone number already exists for other users
                if User.objects.filter(phone_number=value).exclude(id=self.instance.id).exists():
                    raise serializers.ValidationError("A user with this phone number already exists.")
            else:
                # For create, check if phone number already exists
                if User.objects.filter(phone_number=value).exists():
                    raise serializers.ValidationError("A user with this phone number already exists.")
        
        return value

    def validate_first_name(self, value):
        """
        Validate first name
        """
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        
        return value.strip()

    def validate_last_name(self, value):
        """
        Validate last name
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Last name is required.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        
        return value.strip()

    def validate_date_of_birth(self, value):
        """
        Validate date of birth
        """
        if value:
            from datetime import date
            if value > date.today():
                raise serializers.ValidationError("Date of birth cannot be in the future.")
            
            # Check if person is at least 13 years old
            age = date.today().year - value.year
            if age < 13:
                raise serializers.ValidationError("You must be at least 13 years old to register.")
        
        return value

    def validate_fitness_goal(self, value):
        """
        Validate fitness goal
        """
        if value:
            valid_goals = ['weight_loss', 'weight_gain', 'general_fitness']
            if value not in valid_goals:
                raise serializers.ValidationError(f"Invalid fitness goal. Choose from: {', '.join(valid_goals)}")
        
        return value
    

    def create(self, validated_data):
        membership_plan_id = validated_data.pop('membership_plan_id', None)
        assigned_trainer_id = validated_data.pop('assigned_trainer_id', None)
        
        try:
            user = User.objects.create_user(
                email=validated_data['email'],
                username=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
            user.user_type = 'member'

            for field in ['date_of_birth', 'phone_number', 'fitness_goal']:
                if field in validated_data:
                    setattr(user, field, validated_data[field])

            if membership_plan_id is not None:
                try:
                    membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
                    user.membership_plan = membership_plan
                except MembershipPlan.DoesNotExist:
                    raise serializers.ValidationError({'membership_plan_id': 'Invalid membership plan selected'})
            
            if assigned_trainer_id is not None:
                try:
                    trainer = User.objects.get(id=assigned_trainer_id, user_type='trainer', is_active=True)
                    user.assigned_trainer = trainer
                except User.DoesNotExist:
                    raise serializers.ValidationError({'assigned_trainer_id': 'Invalid trainer selected'})

            user.save()
            return user
        
        except Exception as e:
            # Handle any database integrity errors
            if 'email' in str(e).lower():
                raise serializers.ValidationError({'email': 'A user with this email already exists.'})
            elif 'phone' in str(e).lower():
                raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})
            else:
                raise serializers.ValidationError('An error occurred while creating the user.')

    def update(self, instance, validated_data):
        membership_plan_id = validated_data.pop('membership_plan_id', None)
        assigned_trainer_id = validated_data.pop('assigned_trainer_id', None)

        try:
            instance.email = validated_data.get('email', instance.email)
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)
            instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
            instance.phone_number = validated_data.get('phone_number', instance.phone_number)
            instance.fitness_goal = validated_data.get('fitness_goal', instance.fitness_goal)
            instance.specialization = validated_data.get('specialization', instance.specialization)
            
            if membership_plan_id is not None:
                try:
                    membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
                    instance.membership_plan = membership_plan
                except MembershipPlan.DoesNotExist:
                    raise serializers.ValidationError({'membership_plan_id': 'Invalid membership plan selected'})
            
            # Only update assigned_trainer_id for members, not trainers
            if instance.user_type == 'member' and assigned_trainer_id is not None:
                if assigned_trainer_id == 0:
                    instance.assigned_trainer = None
                else:
                    try:
                        trainer = User.objects.get(id=assigned_trainer_id, user_type='trainer', is_active=True)
                        instance.assigned_trainer = trainer
                    except User.DoesNotExist:
                        raise serializers.ValidationError({'assigned_trainer_id': 'Invalid trainer selected'})

            instance.save()
            return instance
        
        except Exception as e:
            # Handle any database integrity errors
            if 'email' in str(e).lower():
                raise serializers.ValidationError({'email': 'A user with this email already exists.'})
            elif 'phone' in str(e).lower():
                raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})
            else:
                raise serializers.ValidationError('An error occurred while updating the user.')
    
    
    #original
    # def create(self, validated_data):
    #     membership_plan_id = validated_data.pop('membership_plan_id', None)
    #     assigned_trainer_id = validated_data.pop('assigned_trainer_id', None)
    #     user = User.objects.create_user(
    #         email=validated_data['email'],
    #         username=validated_data['email'],
    #         password=validated_data['password'],
    #         first_name=validated_data.get('first_name', ''),
    #         last_name=validated_data.get('last_name', '')
    #     )
    #     user.user_type = 'member'

    #     for field in ['date_of_birth', 'phone_number', 'fitness_goal']:
    #         if field in validated_data:
    #             setattr(user, field, validated_data[field])

    #     if membership_plan_id is not None:
    #         try:
    #             membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
    #             user.membership_plan = membership_plan
    #         except MembershipPlan.DoesNotExist:
    #             raise serializers.ValidationError({'membership_plan_id': 'Invalid membership plan selected'})
        
    #     if assigned_trainer_id is not None:
    #         try:
    #             trainer = User.objects.get(id=assigned_trainer_id, user_type='trainer', is_active=True)
    #             user.assigned_trainer = trainer
    #         except User.DoesNotExist:
    #             raise serializers.ValidationError({'assigned_trainer_id': 'Invalid trainer selected'})

    #     user.save()
    #     return user

    # def update(self, instance, validated_data):
    #     membership_plan_id = validated_data.pop('membership_plan_id', None)
    #     assigned_trainer_id = validated_data.pop('assigned_trainer_id', None)  # Extract assigned_trainer_id

    #     instance.email = validated_data.get('email', instance.email)
    #     instance.first_name = validated_data.get('first_name', instance.first_name)
    #     instance.last_name = validated_data.get('last_name', instance.last_name)
    #     instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
    #     instance.phone_number = validated_data.get('phone_number', instance.phone_number)
    #     instance.fitness_goal = validated_data.get('fitness_goal', instance.fitness_goal)
    #     instance.specialization = validated_data.get('specialization', instance.specialization)
        
    #     if membership_plan_id is not None:
    #         try:
    #             membership_plan = MembershipPlan.objects.get(id=membership_plan_id, is_active=True)
    #             instance.membership_plan = membership_plan
    #         except MembershipPlan.DoesNotExist:
    #             raise serializers.ValidationError({'membership_plan_id': 'Invalid membership plan selected'})
        
    #     # Only update assigned_trainer_id for members, not trainers
    #     if instance.user_type == 'member' and assigned_trainer_id is not None:
    #         if assigned_trainer_id == 0:
    #             instance.assigned_trainer = None
    #         else:
    #             try:
    #                 trainer = User.objects.get(id=assigned_trainer_id, user_type='trainer', is_active=True)
    #                 instance.assigned_trainer = trainer
    #             except User.DoesNotExist:
    #                 raise serializers.ValidationError({'assigned_trainer_id': 'Invalid trainer selected'})

    #     instance.save()
    #     return instance

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = '__all__'

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if user_data:
            if 'membership_plan_id' in user_data:
                user_data['membership_plan'] = user_data.pop('membership_plan_id')
            user_serializer = UserSerializer(instance=instance.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
        return instance

class TrainerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = TrainerProfile
        fields = '__all__'

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if user_data:
            if 'membership_plan_id' in user_data:
                user_data['membership_plan'] = user_data.pop('membership_plan_id')
            user_serializer = UserSerializer(instance=instance.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
        return instance

class MemberAttendanceSerializer(serializers.ModelSerializer):
    member_email = serializers.EmailField(source='member.email', read_only=True)
    trainer_email = serializers.EmailField(source='trainer.email', read_only=True)
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = MemberAttendance
        fields = ['id', 'member', 'member_email', 'trainer', 'trainer_email', 'trainer_name', 'date', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']  # Removed 'trainer' from read_only_fields

    def get_trainer_name(self, obj):
        if obj.trainer:
            name = f"{obj.trainer.first_name} {obj.trainer.last_name}".strip()
            print(f"Trainer ID: {obj.trainer.id}, Name: {name}, Email: {obj.trainer.email}")  # Debug log
            return name or obj.trainer.email
        return "Not available"

    def validate(self, data):
        request = self.context.get('request')
        trainer = request.user
        member = data['member']
        if member.assigned_trainer != trainer:
            raise serializers.ValidationError("You can only mark attendance for your assigned members.")
        if member.user_type != 'member':
            raise serializers.ValidationError("Invalid member selected.")
        return data
    

class DietPlanSerializer(serializers.ModelSerializer):
    member_email = serializers.EmailField(source='member.email', read_only=True)
    trainer_email = serializers.EmailField(source='trainer.email', read_only=True)
    default_diet_plan = DefaultDietPlanSerializer(read_only=True)
    default_diet_plan_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = DietPlan
        fields = ['id', 'member', 'member_email', 'trainer', 'trainer_email', 'default_diet_plan', 'default_diet_plan_id',
                  'title', 'description', 'start_date', 'end_date', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['trainer', 'created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        trainer = request.user
        member = data.get('member')
        
        if member.user_type != 'member':
            raise serializers.ValidationError("Invalid member selected.")
        if member.assigned_trainer != trainer and trainer.user_type != 'admin':
            raise serializers.ValidationError("You can only create diet plans for your assigned members.")
        
        default_diet_plan_id = data.get('default_diet_plan_id')
        if default_diet_plan_id:
            try:
                default_plan = DefaultDietPlan.objects.get(id=default_diet_plan_id)
                data['title'] = default_plan.title
                data['description'] = default_plan.description
            except DefaultDietPlan.DoesNotExist:
                raise serializers.ValidationError("Invalid default diet plan selected.")
        
        return data

class AssignedDietSerializer(serializers.ModelSerializer):
    diet_plan = DietPlanSerializer(read_only=True)
    diet_plan_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = AssignedDiet
        fields = ['id', 'member', 'diet_plan', 'diet_plan_id', 'is_active', 'assigned_at']
        read_only_fields = ['assigned_at']

    def validate(self, data):
        member = data.get('member')
        diet_plan_id = data.get('diet_plan_id')
        
        if member.user_type != 'member':
            raise serializers.ValidationError("Invalid member selected.")
        
        try:
            diet_plan = DietPlan.objects.get(id=diet_plan_id, member=member)
        except DietPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid diet plan selected or not associated with this member.")
        
        return data
    
class WorkoutRoutineSerializer(serializers.ModelSerializer):
    member_email = serializers.EmailField(source='member.email', read_only=True)
    trainer_email = serializers.EmailField(source='trainer.email', read_only=True)
    class Meta:
        model = WorkoutRoutine
        fields = ['id', 'member', 'member_email', 'trainer', 'trainer_email', 'title', 'description', 'day_number',
                  'start_date', 'end_date', 'created_at', 'updated_at']
        read_only_fields = ['trainer', 'created_at', 'updated_at']
    def validate(self, data):
        request = self.context.get('request')
        trainer = request.user
        member = data['member']
        if member.assigned_trainer != trainer:
            raise serializers.ValidationError("You can only create workout routines for your assigned members.")
        if member.user_type != 'member':
            raise serializers.ValidationError("Invalid member selected.")
        day_number = data.get('day_number')
        if day_number not in [1, 2, 3, 4, 5, 6, 7]:
            raise serializers.ValidationError("Invalid day number. Must be between 1 and 7.")
        return data

class WeeklyWorkoutCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyWorkoutCycle
        fields = ['id', 'member', 'start_date', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    def validate(self, data):
        member = data.get('member')
        if member.user_type != 'member':
            raise serializers.ValidationError("Invalid member selected.")
        return data
    

class TrainerRatingSerializer(serializers.ModelSerializer):
    member = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(user_type='member'),
        required=False
    )
    trainer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(user_type='trainer'),
        required=False
    )

    class Meta:
        model = TrainerRating
        fields = ['id', 'member', 'trainer', 'rating', 'feedback', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")

        # Ensure only members can rate their assigned trainer
        if request.user.user_type != 'member':
            raise serializers.ValidationError("Only members can submit ratings")

        # Ensure the trainer is the member's assigned trainer
        trainer = data.get('trainer', None)
        if trainer and trainer != request.user.assigned_trainer:
            raise serializers.ValidationError("You can only rate your assigned trainer")

        # Ensure rating is between 1 and 5
        rating = data.get('rating')
        if rating < 1 or rating > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")

        # Set member and trainer automatically
        data['member'] = request.user
        data['trainer'] = request.user.assigned_trainer

        return data

    def create(self, validated_data):
        # Check if a rating already exists for this member-trainer pair
        if TrainerRating.objects.filter(
            member=validated_data['member'],
            trainer=validated_data['trainer']
        ).exists():
            raise serializers.ValidationError(
                "You have already submitted a rating for this trainer"
            )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Allow updating only if the instance belongs to the requesting member
        if instance.member != self.context['request'].user:
            raise serializers.ValidationError(
                "You can only update your own rating"
            )
        return super().update(instance, validated_data)


class TrainerAttendanceSerializer(serializers.ModelSerializer):
    trainer_email = serializers.EmailField(source='trainer.email', read_only=True)
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    admin_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerAttendance
        fields = ['id', 'trainer', 'trainer_email', 'admin', 'admin_email', 'admin_name', 'date', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_admin_name(self, obj):
        if obj.admin:
            name = f"{obj.admin.first_name} {obj.admin.last_name}".strip()
            return name or obj.admin.email
        return "Not available"

    def validate(self, data):
        request = self.context.get('request')
        admin = request.user
        trainer = data['trainer']
        if admin.user_type != 'admin':
            raise serializers.ValidationError("Only admins can mark trainer attendance.")
        if trainer.user_type != 'trainer':
            raise serializers.ValidationError("Invalid trainer selected.")
        return data


    