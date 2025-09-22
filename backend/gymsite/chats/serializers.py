from rest_framework import serializers
from .models import ChatRoom, CommunityChatRoom, Message, Reaction, User, Notification
import logging

logger = logging.getLogger(__name__)
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
    
    # File fields - explicitly defined to ensure they're always included
    file_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    file_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    
    # Safe computed fields with fallback values
    file_size_formatted = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    is_video = serializers.SerializerMethodField()
    is_audio = serializers.SerializerMethodField()
    is_document = serializers.SerializerMethodField()
    file_category = serializers.SerializerMethodField()
    
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'chat_room', 'community_chat_room', 'sender', 'content', 
            'file_url', 'file_type', 'file_name', 'file_size', 'file_size_formatted',
            'is_image', 'is_video', 'is_audio', 'is_document', 'file_category',
            'timestamp', 'reactions', 'cloudinary_public_id'
        ]

    def get_file_size_formatted(self, obj):
        """Safe file size formatting"""
        try:
            if hasattr(obj, 'file_size_formatted'):
                return obj.file_size_formatted
            elif obj.file_size:
                size = obj.file_size
                for unit in ['B', 'KB', 'MB', 'GB']:
                    if size < 1024.0:
                        return f"{size:.1f} {unit}"
                    size /= 1024.0
                return f"{size:.1f} TB"
            return None
        except Exception as e:
            logger.error(f"Error formatting file size for message {obj.id}: {str(e)}")
            return None

    def get_is_image(self, obj):
        """Safe image detection"""
        try:
            if hasattr(obj, 'is_image'):
                return obj.is_image
            return bool(obj.file_type and obj.file_type.startswith('image/'))
        except Exception as e:
            logger.error(f"Error checking is_image for message {obj.id}: {str(e)}")
            return False

    def get_is_video(self, obj):
        """Safe video detection"""
        try:
            if hasattr(obj, 'is_video'):
                return obj.is_video
            return bool(obj.file_type and obj.file_type.startswith('video/'))
        except Exception as e:
            logger.error(f"Error checking is_video for message {obj.id}: {str(e)}")
            return False

    def get_is_audio(self, obj):
        """Safe audio detection"""
        try:
            if hasattr(obj, 'is_audio'):
                return obj.is_audio
            return bool(obj.file_type and obj.file_type.startswith('audio/'))
        except Exception as e:
            logger.error(f"Error checking is_audio for message {obj.id}: {str(e)}")
            return False

    def get_is_document(self, obj):
        """Safe document detection"""
        try:
            if hasattr(obj, 'is_document'):
                return obj.is_document
            
            if not obj.file_type:
                return False
                
            document_types = [
                'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv', 'text/rtf'
            ]
            return obj.file_type in document_types
        except Exception as e:
            logger.error(f"Error checking is_document for message {obj.id}: {str(e)}")
            return False

    def get_file_category(self, obj):
        """Safe file category detection"""
        try:
            if hasattr(obj, 'file_category'):
                return obj.file_category
            
            if not obj.file_type:
                return None
                
            if obj.file_type.startswith('image/'):
                return 'image'
            elif obj.file_type.startswith('video/'):
                return 'video'
            elif obj.file_type.startswith('audio/'):
                return 'audio'
            elif self.get_is_document(obj):
                return 'document'
            else:
                return 'other'
        except Exception as e:
            logger.error(f"Error getting file_category for message {obj.id}: {str(e)}")
            return None

    def to_representation(self, instance):
        """Enhanced error handling for serialization"""
        try:
            # Get basic representation first
            data = super().to_representation(instance)
            
            # Ensure file fields are explicitly set
            data['file_url'] = getattr(instance, 'file_url', None) or None
            data['file_type'] = getattr(instance, 'file_type', None) or None
            data['file_name'] = getattr(instance, 'file_name', None) or None
            data['file_size'] = getattr(instance, 'file_size', None) or None
            
            # Safely handle nested serializers
            try:
                if instance.sender:
                    data['sender'] = UserSerializer(instance.sender).data
            except Exception as sender_error:
                logger.error(f"Error serializing sender for message {instance.id}: {str(sender_error)}")
                data['sender'] = {
                    'id': getattr(instance.sender, 'id', None) if instance.sender else None,
                    'email': getattr(instance.sender, 'email', 'unknown@example.com') if instance.sender else 'unknown@example.com',
                    'first_name': getattr(instance.sender, 'first_name', 'Unknown') if instance.sender else 'Unknown',
                    'last_name': getattr(instance.sender, 'last_name', 'User') if instance.sender else 'User',
                    'assigned_trainer': None
                }
            
            # Handle room serialization safely (avoid circular references)
            request = self.context.get('request')
            room_type = self.context.get('room_type', 'chat')
            
            try:
                if instance.chat_room and room_type == 'chat':
                    # Simplified room data to avoid circular references
                    data['chat_room'] = {
                        'id': instance.chat_room.id,
                        'member': UserSerializer(instance.chat_room.member).data if instance.chat_room.member else None,
                        'trainer': UserSerializer(instance.chat_room.trainer).data if instance.chat_room.trainer else None,
                        'created_at': instance.chat_room.created_at.isoformat() if instance.chat_room.created_at else None
                    }
                elif instance.community_chat_room and room_type == 'community':
                    # Simplified community room data
                    data['community_chat_room'] = {
                        'id': instance.community_chat_room.id,
                        'name': getattr(instance.community_chat_room, 'name', ''),
                        'trainer': UserSerializer(instance.community_chat_room.trainer).data if instance.community_chat_room.trainer else None,
                        'created_at': instance.community_chat_room.created_at.isoformat() if instance.community_chat_room.created_at else None
                    }
            except Exception as room_error:
                logger.error(f"Error serializing room for message {instance.id}: {str(room_error)}")
                # Keep room data as None to avoid breaking the API
                data['chat_room'] = None
                data['community_chat_room'] = None
            
            # Handle reactions safely
            try:
                if hasattr(instance, 'reactions'):
                    reactions_qs = instance.reactions.select_related('user').all()
                    data['reactions'] = ReactionSerializer(reactions_qs, many=True).data
                else:
                    data['reactions'] = []
            except Exception as reactions_error:
                logger.error(f"Error serializing reactions for message {instance.id}: {str(reactions_error)}")
                data['reactions'] = []
            
            # Log for debugging if file exists
            if data.get('file_url'):
                logger.debug(f"Serialized message {instance.id} with file: {data.get('file_name')} ({data.get('file_type')})")
            
            return data
            
        except Exception as e:
            # Log the full error and return a safe fallback
            logger.error(f"Critical error serializing message {getattr(instance, 'id', 'unknown')}: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            
            # Return a minimal safe representation
            return {
                'id': getattr(instance, 'id', None),
                'sender': {
                    'id': getattr(instance.sender, 'id', None) if hasattr(instance, 'sender') and instance.sender else None,
                    'email': 'error@example.com',
                    'first_name': 'Serialization',
                    'last_name': 'Error',
                    'assigned_trainer': None
                },
                'content': getattr(instance, 'content', 'Error loading this message'),
                'file_url': getattr(instance, 'file_url', None),
                'file_type': getattr(instance, 'file_type', None),
                'file_name': getattr(instance, 'file_name', None),
                'file_size': getattr(instance, 'file_size', None),
                'file_size_formatted': None,
                'is_image': False,
                'is_video': False,
                'is_audio': False,
                'is_document': False,
                'file_category': None,
                'timestamp': getattr(instance, 'timestamp', None),
                'reactions': [],
                'cloudinary_public_id': getattr(instance, 'cloudinary_public_id', None),
                'chat_room': None,
                'community_chat_room': None,
            }


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    related_room = serializers.PrimaryKeyRelatedField(read_only=True)
    related_community_room = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'receiver', 'content', 'notification_type', 'related_room', 'related_community_room', 'is_read', 'created_at']


        

        