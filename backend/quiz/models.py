from django.db import models
from django.conf import settings
import uuid


class Subject(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subjects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['created_by', 'name'],
                name='unique_subject_name_per_user',
                violation_error_message='You already have a subject with this name.'
            )
        ]

    def __str__(self):
        return self.name


class Quiz(models.Model):
    EASY = 'easy'
    MEDIUM = 'medium'
    HARD = 'hard'
    DIFFICULTY_CHOICES = [(EASY, 'Easy'), (MEDIUM, 'Medium'), (HARD, 'Hard')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quizzes')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default=MEDIUM)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quizzes'
    )

    chatroom = models.ForeignKey(
        'chat.Chatroom',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quizzes'
    )

    time_per_question = models.IntegerField(default=30)
    max_retakes = models.IntegerField(
        default=1,
        help_text="Maximum number of times a student can retake this quiz"
    )
    is_public = models.BooleanField(default=False)
    
    # ---> ADD THIS NEW FIELD <---
    shared_to_library = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class QuizQuestion(models.Model):
    MPQ = 'mpq'
    TRUE_FALSE = 'true_false'
    IDENTIFICATION = 'identification'
    MATCHING = 'matching'

    TYPE_CHOICES = [
        (MPQ, 'Multiple Choice Question'),
        (TRUE_FALSE, 'True / False'),
        (IDENTIFICATION, 'Identification'),
        (MATCHING, 'Matching')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=MPQ)
    choices = models.JSONField(null=True, blank=True)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.quiz.title} - Q"


class QuizAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    score = models.IntegerField()
    percentage = models.FloatField()
    time_taken = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"