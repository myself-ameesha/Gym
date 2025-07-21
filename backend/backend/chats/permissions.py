from rest_framework import permissions
from .models import ChatRoom

class IsTrainerOrAssignedMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type in ['trainer', 'member']

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, ChatRoom):
            if request.user.user_type == 'trainer':
                return obj.trainer == request.user and obj.member.assigned_trainer == request.user
            elif request.user.user_type == 'member':
                return obj.member == request.user and obj.trainer == request.user.assigned_trainer
        return False