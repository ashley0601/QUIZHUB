from django.urls import path
from .views import (
    CreateManualQuizView,
    TeacherQuizListView,
    QuizResultsView,
    JoinQuizView,
    SubmitQuizView,
    QuizSettingsView,
    ExportResultsExcelView,
    PublicManualQuizLibraryView,
    QuizDetailView,
    QuizDeleteView,
    QuizUpdateView,
)

urlpatterns = [
    # Teacher Routes
    path('create/', CreateManualQuizView.as_view(), name='create-manual-quiz'),
    path('my-quizzes/', TeacherQuizListView.as_view(), name='my-manual-quizzes'),
    path('<int:quiz_id>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:quiz_id>/update/', QuizUpdateView.as_view(), name='quiz-update'),
    path('<int:quiz_id>/delete/', QuizDeleteView.as_view(), name='quiz-delete'),
    path('<int:quiz_id>/results/', QuizResultsView.as_view(), name='quiz-results'),
    path('<int:quiz_id>/export/', ExportResultsExcelView.as_view(), name='quiz-export'),
    path('<int:quiz_id>/settings/', QuizSettingsView.as_view(), name='quiz-settings'),
    path('library/', PublicManualQuizLibraryView.as_view(), name='manual-quiz-library'),

    # Student Routes
    path('join/<str:code>/', JoinQuizView.as_view(), name='join-quiz'),
    path('<int:quiz_id>/submit/', SubmitQuizView.as_view(), name='submit-quiz'),
]