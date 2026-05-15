import json
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import Lesson, SavedItem
from .serializers import LessonSerializer
from api.models import FriendRequest 


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        
        sent_friends = FriendRequest.objects.filter(sender=user, status='accepted').values_list('receiver_id', flat=True)
        received_friends = FriendRequest.objects.filter(receiver=user, status='accepted').values_list('sender_id', flat=True)
        friend_ids = list(sent_friends) + list(received_friends)

        queryset = Lesson.objects.filter(
            Q(visibility='public') | 
            Q(visibility='private', created_by=user) |
            (Q(visibility='friends') & (Q(created_by=user) | Q(created_by__in=friend_ids))) |
            Q(created_by=user) 
        ).distinct()

        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(subject__icontains=search) | 
                Q(description__icontains=search)
            )
            
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Lesson deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )


class SavedItemViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    # No parser_classes! We read the raw body to avoid ALL parsing conflicts.

    def list(self, request):
        items = SavedItem.objects.filter(user=request.user)
        data = [{
            'id': item.id,
            'item_type': item.item_type,
            'item_id': item.item_id,
            'created_at': item.created_at
        } for item in items]
        return Response(data)

    def create(self, request):
        # Read raw body directly to bypass DRF parser completely
        try:
            data = json.loads(request.body)
        except (ValueError, AttributeError):
            # Fallback if body isn't JSON
            data = request.data

        item_type = data.get('item_type')
        item_id = data.get('item_id')

        if not item_type or item_id is None:
            return Response(
                {"error": "Missing item_type or item_id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item_id = int(item_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "item_id must be a number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        item, created = SavedItem.objects.get_or_create(
            user=request.user,
            item_type=item_type,
            item_id=item_id
        )

        return Response({
            'id': item.id,
            'item_type': item.item_type,
            'item_id': item.item_id,
            'created_at': item.created_at
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, item_type=None, item_id=None):
        try:
            instance = SavedItem.objects.get(
                user=request.user,
                item_type=item_type,
                item_id=item_id
            )
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedItem.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)