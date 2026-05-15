from django.contrib import admin
from .models import Lesson

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    # Updated list_display: replaced 'is_public' with 'visibility'
    list_display = ('title', 'subject', 'created_by', 'created_at', 'visibility')
    
    # Updated list_filter: replaced 'is_public' with 'visibility'
    list_filter = ('created_at', 'visibility')
    
    search_fields = ('title', 'subject', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at')