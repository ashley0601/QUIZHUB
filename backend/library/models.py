from django.db import models
from django.conf import settings
import os

def lesson_file_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f'lessons/temp_{filename}'

def lesson_file_path_final(instance, filename):
    # Remove the temp_ prefix when moving to final location
    if filename.startswith('temp_'):
        filename = filename[5:]
    return f'lessons/{instance.id}/{filename}'

class Lesson(models.Model):
    FILE_TYPES = (
        ('pdf', 'PDF'),
        ('ppt', 'PowerPoint'),
        ('pptx', 'PowerPoint'),
        ('doc', 'Word'),
        ('docx', 'Word'),
    )
    
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('friends', 'Friends Only'),
        ('private', 'Only Me'),
    ]
    
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=lesson_file_path)
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lessons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if self.file:
            ext = os.path.splitext(self.file.name)[1].lower().replace('.', '')
            if ext in ['ppt', 'pptx']:
                self.file_type = 'ppt' if ext == 'ppt' else 'pptx'
            elif ext in ['doc', 'docx']:
                self.file_type = 'doc' if ext == 'doc' else 'docx'
            else:
                self.file_type = 'pdf'
                
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Extra safety: ensure ID exists before moving files
        if is_new and self.file and self.pk is not None:
            old_path = self.file.path
            
            # Extract just the filename, not the full path
            original_filename = self.file.name.split('/')[-1]
            new_relative_path = lesson_file_path_final(self, original_filename)
            new_path = os.path.join(settings.MEDIA_ROOT, new_relative_path)
            
            import shutil
            if os.path.exists(old_path):
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                shutil.move(old_path, new_path)
                # Store only the relative path
                self.file.name = new_relative_path
                super().save(update_fields=['file'])


class SavedItem(models.Model):
    ITEM_TYPES = (
        ('quiz', 'Quiz'),
        ('lesson', 'Lesson'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_items')
    item_type = models.CharField(max_length=10, choices=ITEM_TYPES)
    item_id = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'item_type', 'item_id')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} saved {self.item_type} #{self.item_id}"