from rest_framework.permissions import BasePermission

class IsSubscriptionManager(BasePermission):
    """
    Allow only Subscription Manager (role = 'sm')
    """
    def has_permission(self, request, view):
        return hasattr(request.user, "profile") and request.user.profile.role == "sm"


class IsManager(BasePermission):
    """
    Allow only Admin Manager (role = 'manager')
    """
    def has_permission(self, request, view):
        return hasattr(request.user, "profile") and request.user.profile.role == "manager"


class RoleRequired(BasePermission):
    def __init__(self, role):
        self.role = role

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, "profile") and 
            request.user.profile.role == self.role
        )
