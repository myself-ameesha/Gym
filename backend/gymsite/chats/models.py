from django.contrib.auth import get_user_model
from django.db import models
from django.conf import settings

User = get_user_model()

class ChatRoom(models.Model):
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='member_rooms')
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trainer_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('member', 'trainer')

    def __str__(self):
        return f"Chat between {self.member.email} and {self.trainer.email}"

class CommunityChatRoom(models.Model):
    trainer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_chat_rooms',
        limit_choices_to={'user_type': 'trainer'}
    )
    members = models.ManyToManyField(
        User,
        related_name='community_chats',
        limit_choices_to={'user_type': 'member'}
    )
    name = models.CharField(max_length=100, blank=True)  # e.g., "Trainer John's Group"
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.name and self.trainer:
            self.name = f"{self.trainer.first_name}'s Community Chat"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# class Message(models.Model):
#     chat_room = models.ForeignKey(
#         ChatRoom,
#         on_delete=models.CASCADE,
#         related_name='messages',
#         null=True,
#         blank=True
#     )
#     community_chat_room = models.ForeignKey(
#         CommunityChatRoom,
#         on_delete=models.CASCADE,
#         related_name='messages',
#         null=True,
#         blank=True
#     )
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     content = models.TextField(blank=True)
#     file = models.FileField(upload_to='chat_files/', blank=True, null=True)
#     file_type = models.CharField(max_length=100, blank=True, null=True)
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         room = self.chat_room or self.community_chat_room
#         return f"{self.sender.email}: {self.content} at {self.timestamp} in {room}"



class Message(models.Model):
    chat_room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True
    )
    community_chat_room = models.ForeignKey(
        CommunityChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    
    # Cloudinary integration - store URL and metadata
    file_url = models.URLField(max_length=500, blank=True, null=True, help_text="Cloudinary file URL")
    file_type = models.CharField(max_length=100, blank=True, null=True, help_text="MIME type of the file")
    file_name = models.CharField(max_length=255, blank=True, null=True, help_text="Original filename")
    file_size = models.BigIntegerField(null=True, blank=True, help_text="File size in bytes")
    cloudinary_public_id = models.CharField(max_length=255, blank=True, null=True, help_text="Cloudinary public ID for file management")
    
    timestamp = models.DateTimeField(auto_now_add=True)

    @property
    def is_image(self):
        """Check if the file is an image"""
        if not self.file_type:
            return False
        return self.file_type.startswith('image/')

    @property
    def is_video(self):
        """Check if the file is a video"""
        if not self.file_type:
            return False
        return self.file_type.startswith('video/')

    @property
    def is_audio(self):
        """Check if the file is audio"""
        if not self.file_type:
            return False
        return self.file_type.startswith('audio/')

    @property
    def is_document(self):
        """Check if the file is a document"""
        if not self.file_type:
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
        return self.file_type in document_types

    @property
    def file_size_formatted(self):
        """Return formatted file size"""
        if not self.file_size:
            return "Unknown size"
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    @property
    def file_category(self):
        """Get file category for UI purposes"""
        if self.is_image:
            return 'image'
        elif self.is_video:
            return 'video'
        elif self.is_audio:
            return 'audio'
        elif self.is_document:
            return 'document'
        else:
            return 'other'

    def delete_cloudinary_file(self):
        """Delete the associated file from Cloudinary"""
        if self.cloudinary_public_id:
            try:
                import cloudinary.uploader
                result = cloudinary.uploader.destroy(
                    self.cloudinary_public_id,
                    resource_type='auto'  # Let Cloudinary determine the resource type
                )
                return result.get('result') == 'ok'
            except Exception as e:
                # Log the error but don't prevent message deletion
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to delete Cloudinary file {self.cloudinary_public_id}: {str(e)}")
                return False
        return True

    def delete(self, *args, **kwargs):
        """Override delete to also remove Cloudinary file"""
        self.delete_cloudinary_file()
        super().delete(*args, **kwargs)

    def __str__(self):
        room = self.chat_room or self.community_chat_room
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        file_info = f" [File: {self.file_name}]" if self.file_name else ""
        return f"{self.sender.email}: {content_preview}{file_info} at {self.timestamp} in {room}"



class Reaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=10)  # Store emoji as string
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'reaction')

    def __str__(self):
        return f"{self.user.email} reacted {self.reaction} to message {self.message.id}"
    

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('message', 'Message'),
        ('member_assigned', 'Member Assigned'),
        ('plan_expiring', 'Plan Expiring'),
        ('chat', 'Chat'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='notifications',
        on_delete=models.CASCADE,
        help_text="The user who receives the notification"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_notifications',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The user who triggered the notification (optional)"
    )
    content = models.CharField(max_length=255, help_text="Notification message content")
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    related_room = models.ForeignKey(
        'ChatRoom',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Related chat room, if applicable"
    )
    related_community_room = models.ForeignKey(
        'CommunityChatRoom',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Related community chat room, if applicable"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.notification_type} for {self.user.email}: {self.content}"

