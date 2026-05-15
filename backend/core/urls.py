from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import Views
from api.views import (
    LoginView, 
    RegisterView, 
    LogoutView,
    PublicProfileView,
    DashboardStatsView,
    DashboardAnalyticsView,
    ChatNotificationsView,
    ChangePasswordView,
    SearchUsersView, 
    SendFriendRequestView, 
    HandleFriendRequestView, 
    FriendListView, 
    PendingRequestsView,
    PasswordResetRequestView, PasswordResetConfirmView,
    NotificationsView,
    SubjectListView,
    SubjectDetailView,
)

from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),

    # ==============================
    # Authentication & User APIs
    # ==============================
    path('api/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile System
    path('api/profile/', PublicProfileView.as_view(), name='my-profile'),
    path('api/profile/<uuid:pk>/', PublicProfileView.as_view(), name='user-profile'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Dashboard
    path('api/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/notifications/', NotificationsView.as_view(), name='notifications'),
    path('api/chat/notifications/', ChatNotificationsView.as_view(), name='chat-notifications'),
    path('api/dashboard-analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('api/search-users/', SearchUsersView.as_view(), name='search-users-api'),

    # Password Reset
    path('api/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('api/password-reset/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # ==============================
    # Friend System URLs
    # ==============================
    path('api/users/search/', SearchUsersView.as_view(), name='search-users'),
    path('api/friends/request/<uuid:user_id>/', SendFriendRequestView.as_view(), name='send-request'),
    path('api/friends/request/<int:req_id>/handle/', HandleFriendRequestView.as_view(), name='handle-request'),
    path('api/friends/', FriendListView.as_view(), name='friends-list'),
    path('api/friends/requests/pending/', PendingRequestsView.as_view(), name='pending-requests'),

    # ==============================
    # Subject Management URLs
    # ==============================
    path('api/subjects/', SubjectListView.as_view(), name='subject-list'),
    path('api/subjects/<int:pk>/', SubjectDetailView.as_view(), name='subject-detail'),

    # ==============================
    # Other Apps
    # ==============================
    path('api/quiz/', include('quiz.urls')),
    path('api/library/', include('library.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/manual-quiz/', include('manual_quiz.urls')),
]

# Serve Media Files in Debug Mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)