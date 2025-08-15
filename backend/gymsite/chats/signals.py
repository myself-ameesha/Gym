from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import User, CommunityChatRoom

@receiver(post_save, sender=User)
def update_community_chat_room(sender, instance, created, **kwargs):
    if instance.user_type == 'member' and instance.assigned_trainer:
        community_room, created = CommunityChatRoom.objects.get_or_create(
            trainer=instance.assigned_trainer
        )
        community_room.members.add(instance)
    elif instance.user_type == 'trainer':
        CommunityChatRoom.objects.get_or_create(trainer=instance)

@receiver(m2m_changed, sender=CommunityChatRoom.members.through)
def sync_community_chat_members(sender, instance, action, pk_set, **kwargs):
    if action in ['post_add', 'post_remove']:
        members = instance.members.all()
        expected_members = User.objects.filter(
            user_type='member',
            assigned_trainer=instance.trainer
        )
        if action == 'post_add':
            instance.members.set(expected_members)
        elif action == 'post_remove':
            instance.members.set(expected_members)