from django.db import models
from django.conf import settings
import random
import string


def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


class ManualQuiz(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manual_quizzes')
    unique_code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    deadline = models.DateTimeField(null=True, blank=True)
    show_results = models.BooleanField(default=False)
    time_per_question = models.IntegerField(default=30, blank=True, null=True)
    is_public = models.BooleanField(default=False)
    image = models.ImageField(upload_to='quiz_banners/', null=True, blank=True)

    shuffle_questions = models.BooleanField(default=False)
    shuffle_choices = models.BooleanField(default=False)
    collect_email = models.BooleanField(default=False)
    show_progress_bar = models.BooleanField(default=True)
    instructions = models.TextField(default="Please read each question carefully.")
    allow_review = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.unique_code:
            self.unique_code = generate_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Question(models.Model):
    SHORT_TEXT = 'short_text'
    PARAGRAPH = 'paragraph'
    MULTIPLE_CHOICE = 'multiple_choice'
    CHECKBOXES = 'checkboxes'
    DROPDOWN = 'dropdown'
    TRUE_FALSE = 'true_false'

    QUESTION_TYPES = [
        (SHORT_TEXT, 'Short Answer'),
        (PARAGRAPH, 'Paragraph'),
        (MULTIPLE_CHOICE, 'Multiple Choice'),
        (CHECKBOXES, 'Checkboxes'),
        (DROPDOWN, 'Dropdown'),
        (TRUE_FALSE, 'True / False'),
    ]

    quiz = models.ForeignKey(ManualQuiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    order = models.IntegerField(default=0)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default=MULTIPLE_CHOICE)
    required = models.BooleanField(default=True)
    correct_text_answer = models.TextField(blank=True, null=True)
    points = models.IntegerField(default=1)
    feedback_correct = models.TextField(blank=True, default="Correct!")
    feedback_incorrect = models.TextField(blank=True, default="Incorrect.")

    def __str__(self):
        return f"Q: {self.text[:50]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.text


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(ManualQuiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manual_attempts')
    score = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    student_name = models.CharField(max_length=255, blank=True, default="")
    student_email = models.EmailField(blank=True, default="")
    is_reviewed = models.BooleanField(default=False)
    teacher_notes = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ('quiz', 'student')

    @property
    def percentage(self):
        if self.total_points == 0:
            return 0
        return round((self.score / self.total_points) * 100, 1)


class StudentAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice_id = models.IntegerField(null=True, blank=True)
    selected_choice_ids = models.JSONField(default=list, blank=True)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)