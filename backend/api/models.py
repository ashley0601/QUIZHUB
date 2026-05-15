from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import random
import string
import uuid

def generate_unique_id():
    return "USR-" + ''.join(random.choices(string.digits, k=6))

class User(AbstractUser):
    STUDENT = 'student'
    TEACHER = 'teacher'
    ROLE_CHOICES = [
        (STUDENT, 'Student'),
        (TEACHER, 'Teacher'),
    ]

    # Override id with UUID for security
    id = models.UUIDField(primary_key=True, editable=False, serialize=False)
    unique_id = models.CharField(max_length=20, unique=True, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    
    # Fix reverse accessor clashes
    groups = models.ManyToManyField(
        'auth.Group', related_name='api_users', blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name='api_users_permissions', blank=True
    )

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4()
        if not self.unique_id:
            self.unique_id = generate_unique_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.unique_id})"

# Friend Request System
class FriendRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # NEW FIELD: Tracks when status changes

    class Meta:
        # Prevent duplicate requests between the same two users
        unique_together = ('sender', 'receiver')
    
    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"

# Awards System for Teachers to award Students
class UserAward(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='awards')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    given_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_awards')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.user.username}"