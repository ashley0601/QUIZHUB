from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonViewSet, SavedItemViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('', include(router.urls)),
    path('saved/', SavedItemViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='saved-list'),
    path('saved/<str:item_type>/<int:item_id>/', SavedItemViewSet.as_view({
        'delete': 'destroy',
    }), name='saved-detail'),
]