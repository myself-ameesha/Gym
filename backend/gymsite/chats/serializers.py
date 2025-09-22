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
            """Override to ensure file data is always included in response and handle serialization errors"""
            try:
                data = super().to_representation(instance)
                
                # CRITICAL: Ensure file fields are explicitly set even if None
                data['file_url'] = getattr(instance, 'file_url', None) or None
                data['file_type'] = getattr(instance, 'file_type', None) or None
                data['file_name'] = getattr(instance, 'file_name', None) or None
                data['file_size'] = getattr(instance, 'file_size', None) or None
                
                # Handle computed properties safely
                try:
                    data['file_size_formatted'] = instance.file_size_formatted if hasattr(instance, 'file_size_formatted') else None
                    data['is_image'] = instance.is_image if hasattr(instance, 'is_image') else False
                    data['is_video'] = instance.is_video if hasattr(instance, 'is_video') else False
                    data['is_audio'] = instance.is_audio if hasattr(instance, 'is_audio') else False
                    data['is_document'] = instance.is_document if hasattr(instance, 'is_document') else False
                    data['file_category'] = instance.file_category if hasattr(instance, 'file_category') else None
                except Exception as property_error:
                    # Log property access errors but don't fail serialization
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Error accessing computed properties for message {instance.id}: {str(property_error)}")
                    
                    # Set safe defaults
                    data['file_size_formatted'] = None
                    data['is_image'] = False
                    data['is_video'] = False
                    data['is_audio'] = False
                    data['is_document'] = False
                    data['file_category'] = None
                
                # Safely handle nested serializers
                try:
                    if instance.sender:
                        data['sender'] = UserSerializer(instance.sender).data
                except Exception as sender_error:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error serializing sender for message {instance.id}: {str(sender_error)}")
                    data['sender'] = {'id': None, 'email': 'Unknown', 'first_name': 'Unknown', 'last_name': 'User'}
                
                # Handle room serialization safely
                try:
                    if instance.chat_room:
                        data['chat_room'] = ChatRoomSerializer(instance.chat_room).data
                    elif instance.community_chat_room:
                        data['community_chat_room'] = CommunityChatRoomSerializer(instance.community_chat_room).data
                except Exception as room_error:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error serializing room for message {instance.id}: {str(room_error)}")
                    # Keep the room data as None instead of failing
                    
                # Log for debugging if file exists
                if data.get('file_url'):
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.debug(f"Serialized message {instance.id} with file: {data.get('file_name')} ({data.get('file_type')})")
                
                return data
                
            except Exception as e:
                # Log the full error and return a safe fallback
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Critical error serializing message {getattr(instance, 'id', 'unknown')}: {str(e)}")
                logger.error(f"Error type: {type(e).__name__}")
                
                # Return a minimal safe representation
                return {
                    'id': getattr(instance, 'id', None),
                    'sender': {'id': None, 'email': 'Error', 'first_name': 'Serialization', 'last_name': 'Error'},
                    'content': 'Error loading this message',
                    'file_url': None,
                    'file_type': None,
                    'file_name': None,
                    'file_size': None,
                    'file_size_formatted': None,
                    'is_image': False,
                    'is_video': False,
                    'is_audio': False,
                    'is_document': False,
                    'file_category': None,
                    'timestamp': getattr(instance, 'timestamp', None),
                    'reactions': [],
                    'cloudinary_public_id': None,
                    'chat_room': None,
                    'community_chat_room': None,
                }
        
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


        

        