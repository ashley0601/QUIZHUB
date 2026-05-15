from django.contrib import admin
from .models import ManualQuiz, Question, Choice, QuizAttempt

admin.site.register(ManualQuiz)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(QuizAttempt)