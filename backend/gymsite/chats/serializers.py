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

# class MessageSerializer(serializers.ModelSerializer):
#     sender = UserSerializer()
#     chat_room = ChatRoomSerializer(required=False)
#     community_chat_room = CommunityChatRoomSerializer(required=False)
#     file = serializers.FileField(required=False, allow_null=True)
#     file_type = serializers.CharField(required=False, allow_null=True) 
#     reactions = ReactionSerializer(many=True, read_only=True)

#     class Meta:
#         model = Message
#         fields = ['id', 'chat_room', 'community_chat_room', 'sender', 'content', 'file', 'timestamp', 'reactions','file_type']

#     def validate_file(self, value):
#         if value:
#             valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
#             if value.content_type not in valid_image_types:
#                 raise serializers.ValidationError('File must be an image (JPEG, PNG, or GIF).')
#             if value.size > 5 * 1024 * 1024:  # 5MB limit
#                 raise serializers.ValidationError('File size must not exceed 5MB.')
#         return value


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    chat_room = ChatRoomSerializer(required=False)
    community_chat_room = CommunityChatRoomSerializer(required=False)
    
    # IMPORTANT: Include file_url field explicitly
    file_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    file_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    
    # Additional computed fields
    file_size_formatted = serializers.CharField(read_only=True)
    is_image = serializers.BooleanField(read_only=True)
    is_video = serializers.BooleanField(read_only=True)
    is_audio = serializers.BooleanField(read_only=True)
    is_document = serializers.BooleanField(read_only=True)
    file_category = serializers.CharField(read_only=True)
    
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'chat_room', 'community_chat_room', 'sender', 'content', 
            'file_url', 'file_type', 'file_name', 'file_size', 'file_size_formatted',
            'is_image', 'is_video', 'is_audio', 'is_document', 'file_category',
            'timestamp', 'reactions', 'cloudinary_public_id'
        ]

    def to_representation(self, instance):
        """Override to ensure file data is always included in response"""
        data = super().to_representation(instance)
        
        # CRITICAL: Ensure file fields are explicitly set even if None
        data['file_url'] = instance.file_url if instance.file_url else None
        data['file_type'] = instance.file_type if instance.file_type else None
        data['file_name'] = instance.file_name if instance.file_name else None
        data['file_size'] = instance.file_size if instance.file_size else None
        
        # Log for debugging
        if instance.file_url:
            print(f"DEBUG: Message {instance.id} has file: {instance.file_name} ({instance.file_type})")
            print(f"DEBUG: File URL: {instance.file_url}")
        
        return data

    def validate_file(self, value):
        if value:
            # Define comprehensive file type restrictions
            allowed_mime_types = {
                # Images
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                'image/bmp', 'image/tiff', 'image/svg+xml', 'image/ico',
                
                # Documents
                'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv', 'text/rtf',
                
                # Archives
                'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
                'application/x-7z-compressed', 'application/gzip', 'application/x-tar',
                
                # Audio
                'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 
                'audio/flac', 'audio/x-ms-wma',
                
                # Video
                'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
                'video/x-ms-wmv', 'video/webm', 'video/x-flv',
                
                # Other
                'application/json', 'application/xml', 'text/xml', 'text/html',
                'application/javascript', 'text/css',
            }

            if value.content_type not in allowed_mime_types:
                raise serializers.ValidationError(f'File type {value.content_type} is not supported.')

            # File size limits based on type
            max_sizes = {
                'image': 10 * 1024 * 1024,  # 10MB for images
                'video': 100 * 1024 * 1024,  # 100MB for videos
                'audio': 50 * 1024 * 1024,   # 50MB for audio
                'document': 50 * 1024 * 1024,  # 50MB for documents
                'other': 50 * 1024 * 1024,   # 50MB for other files
            }

            # Determine file category
            content_type = value.content_type
            if content_type.startswith('image/'):
                max_size = max_sizes['image']
                category = 'image'
            elif content_type.startswith('video/'):
                max_size = max_sizes['video']
                category = 'video'
            elif content_type.startswith('audio/'):
                max_size = max_sizes['audio']
                category = 'audio'
            elif content_type in ['application/pdf', 'application/msword', 
                                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                 'application/vnd.ms-excel',
                                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                 'text/plain', 'text/csv', 'text/rtf']:
                max_size = max_sizes['document']
                category = 'document'
            else:
                max_size = max_sizes['other']
                category = 'other'

            if value.size > max_size:
                max_size_mb = max_size / (1024 * 1024)
                raise serializers.ValidationError(f'File size exceeds the {max_size_mb:.0f}MB limit for {category} files.')

        return value


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    related_room = serializers.PrimaryKeyRelatedField(read_only=True)
    related_community_room = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'receiver', 'content', 'notification_type', 'related_room', 'related_community_room', 'is_read', 'created_at']


        

        