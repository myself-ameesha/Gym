from rest_framework.permissions import BasePermission 

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_superuser or getattr(request.user, 'user_type', '') == 'admin')
    
class IsTrainer(BasePermission):
    """
    Custom permission to check if the user is a trainer.
    """
    def has_permission(self, request, view):
        # Ensure user is authenticated and a trainer
        if not request.user.is_authenticated:
            return False
        print(f"User: {request.user}, User Type: {request.user.user_type}")
        return request.user.user_type == 'trainer'

class IsAdminOrTrainer(BasePermission):
    """
    Custom permission to check if the user is either an admin or a trainer.
    """
    def has_permission(self, request, view):
        # Ensure user is authenticated and the user type is either admin or trainer
        if not request.user.is_authenticated:
            return False
        return request.user.user_type in ['admin', 'trainer']