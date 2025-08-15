from rest_framework import serializers
from .models import ChatRoom, CommunityChatRoom, Message, Reaction, User, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'assigned_trainer']
    


class CommunityChatRoomSerializer(serializers.ModelSerializer):
    trainer = UserSerializer()
    members = UserSerializer(many=True)
    other_users = serializers.SerializerMethodField()

    class Meta:
        model = CommunityChatRoom
        fields = ['id', 'trainer', 'members', 'other_users', 'name', 'created_at']

    def get_other_users(self, obj):
        request = self.context.get('request')
        if not request:
            return []
        current_user = request.user
        users = [obj.trainer] + list(obj.members.all())
        return UserSerializer([user for user in users if user != current_user], many=True).data

class ChatRoomSerializer(serializers.ModelSerializer):
    member = UserSerializer()
    trainer = UserSerializer()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'member', 'trainer', 'other_user', 'created_at']

    def get_other_user(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        current_user = request.user
        if current_user == obj.trainer:
            return UserSerializer(obj.member).data
        elif current_user == obj.member:
            return UserSerializer(obj.trainer).data
        return None

class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    chat_room = ChatRoomSerializer(required=False)
    community_chat_room = CommunityChatRoomSerializer(required=False)
    file = serializers.FileField(required=False, allow_null=True)
    file_type = serializers.CharField(required=False, allow_null=True) 
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'community_chat_room', 'sender', 'content', 'file', 'timestamp', 'reactions','file_type']

    def validate_file(self, value):
        if value:
            valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if value.content_type not in valid_image_types:
                raise serializers.ValidationError('File must be an image (JPEG, PNG, or GIF).')
            if value.size > 5 * 1024 * 1024:  # 5MB limit
                raise serializers.ValidationError('File size must not exceed 5MB.')
        return value


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    related_room = serializers.PrimaryKeyRelatedField(read_only=True)
    related_community_room = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'receiver', 'content', 'notification_type', 'related_room', 'related_community_room', 'is_read', 'created_at']


        

        