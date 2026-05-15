from django.urls import path
from .views import (
    GenerateQuizView,
    QuizDetailView,
    QuizInviteDetailView,
    SubmitQuizView,
    QuizLeaderboardView,
    ShareQuizView,
    QuizHistoryView,
    PublicLibraryView,
    QuizLibraryDetailView,
    ChatroomSearchView,
    SubjectListView,
    SubjectDetailView,
)

urlpatterns = [
    path('generate/', GenerateQuizView.as_view(), name='quiz-generate'),
    path('<uuid:quiz_id>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('invite/<str:invite_code>/', QuizInviteDetailView.as_view(), name='quiz-invite'),
    path('<uuid:quiz_id>/submit/', SubmitQuizView.as_view(), name='quiz-submit'),
    path('<uuid:quiz_id>/leaderboard/', QuizLeaderboardView.as_view(), name='quiz-leaderboard'),
    path('<uuid:quiz_id>/share/', ShareQuizView.as_view(), name='quiz-share'),
    path('history/', QuizHistoryView.as_view(), name='quiz-history'),
    path('library/', PublicLibraryView.as_view(), name='quiz-library'),
    path('library/<uuid:quiz_id>/', QuizLibraryDetailView.as_view(), name='quiz-library-detail'),
    path('chatrooms/search/', ChatroomSearchView.as_view(), name='quiz-chatroom-search'),
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
    path('subjects/<uuid:subject_id>/', SubjectDetailView.as_view(), name='subject-detail'),
]