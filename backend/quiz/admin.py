from django.contrib import admin
from django.db import models
from django import forms  # <-- Added this
from .models import Subject, Quiz, QuizQuestion, QuizAttempt


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_by')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'difficulty', 'created_by', 'is_public', 'created_at')
    list_filter = ('difficulty', 'is_public', 'created_by')
    search_fields = ('title',)
    raw_id_fields = ('subject', 'created_by', 'chatroom')
    readonly_fields = ('created_at',)


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'quiz', 'question_type')
    list_filter = ('question_type',)
    raw_id_fields = ('quiz',)
    formfield_overrides = {
        models.TextField: {'widget': forms.Textarea(attrs={'rows': 4, 'cols': 40})},  # <-- Changed to forms.Textarea
    }


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'percentage', 'time_taken', 'created_at')
    list_filter = ('created_at',)
    raw_id_fields = ('user', 'quiz')
    readonly_fields = ('created_at',)