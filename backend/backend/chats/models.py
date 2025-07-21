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
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)
    file_type = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        room = self.chat_room or self.community_chat_room
        return f"{self.sender.email}: {self.content} at {self.timestamp} in {room}"

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

