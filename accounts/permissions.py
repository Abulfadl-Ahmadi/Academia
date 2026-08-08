from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    """
    Allows access only to users with the 'student' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'student')

class IsTeacher(permissions.BasePermission):
    """
    Allows access only to users with the 'teacher' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'teacher')

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsSupport(permissions.BasePermission):
    """
    Allows access only to users with the 'support' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'support')

class IsContentCreator(permissions.BasePermission):
    """
    Allows access only to users with the 'content_creator' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'content_creator')

class IsFinance(permissions.BasePermission):
    """
    Allows access only to users with the 'finance' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'finance')

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Allows access to users with either 'teacher' or 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['teacher', 'admin'])

class IsAdminOrSupport(permissions.BasePermission):
    """
    Allows access to users with either 'admin' or 'support' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'support'])

class IsAdminOrFinance(permissions.BasePermission):
    """
    Allows access to users with either 'admin' or 'finance' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'finance'])

class IsTeacherOrAdminOrContentCreator(permissions.BasePermission):
    """
    Allows access to users with 'teacher', 'admin', or 'content_creator' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['teacher', 'admin', 'content_creator'])

class IsStaffUser(permissions.BasePermission):
    """
    Allows access to any non-student role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role != 'student')

