from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket, TicketResponse, TicketAttachment
from .serializers import TicketSerializer, TicketResponseSerializer
from django.db.models import Q

class IsTeacherOrStaffPermission(permissions.BasePermission):
    """
    Custom permission to only allow teachers or staff to access.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or hasattr(request.user, 'is_teacher') and request.user.is_teacher)

class IsOwnerOrTeacherOrStaffPermission(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or teachers/staff to access.
    """
    def has_object_permission(self, request, view, obj):
        # Allow teachers and staff to access all tickets
        if request.user.is_staff or (hasattr(request.user, 'is_teacher') and request.user.is_teacher):
            return True
        
        # Allow ticket owners to access their own tickets
        return obj.created_by == request.user

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Teachers and staff can see all tickets
        if user.is_staff or user.role != 'student':
            return Ticket.objects.all()
        
        # Students can see only their own tickets
        return Ticket.objects.filter(created_by=user)
    
    @action(detail=True, methods=['post'])
    def add_response(self, request, pk=None):
        ticket = self.get_object()
        
        # Create a new serializer with the ticket context
        serializer = TicketResponseSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(ticket=ticket, user=request.user)
            
            # Update ticket status to IN_PROGRESS if a teacher responds
            if (hasattr(request.user, 'is_teacher') and request.user.is_teacher) and ticket.status == 'open':
                ticket.status = 'in_progress'
                ticket.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        ticket = self.get_object()
        
        # Only teachers and staff can change ticket status
        if not (request.user.is_staff or (hasattr(request.user, 'is_teacher') and request.user.is_teacher)):
            return Response({'error': 'Only teachers and staff can change ticket status'},
                          status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in dict(Ticket._meta.get_field('status').choices):
            return Response({'error': 'Invalid status value'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        ticket.status = new_status
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
