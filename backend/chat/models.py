from django.db import models
from django.conf import settings
import uuid
import random
import string


def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class Chatroom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, blank=True)
    is_direct = models.BooleanField(default=False)
    photo = models.ImageField(upload_to='chatroom_photos/', null=True, blank=True)
    theme_color = models.CharField(max_length=7, default='#4299e1')
    wallpaper = models.CharField(max_length=20, default='default', blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_rooms'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ChatroomMember',
        through_fields=('chatroom', 'user'),
        related_name='joined_rooms'
    )
    invite_code = models.CharField(max_length=10, unique=True, default=generate_code)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name if self.name else f"Chat {self.id}"


class ChatroomMember(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    chatroom = models.ForeignKey(Chatroom, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=50, blank=True)
    nickname_set_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nicknames_set'
    )
    role = models.CharField(
        max_length=10,
        choices=[('admin', 'Admin'), ('member', 'Member')],
        default='member'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'chatroom')


class Message(models.Model):
    TEXT = 'text'
    FILE = 'file'
    IMAGE = 'image'
    QUIZ = 'quiz'
    LESSON = 'lesson'

    MESSAGE_TYPES = [
        (TEXT, 'Text'),
        (FILE, 'File'),
        (IMAGE, 'Image'),
        (QUIZ, 'Quiz'),
        (LESSON, 'Lesson'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatroom = models.ForeignKey(Chatroom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(null=True, blank=True)
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default=TEXT)
    file_url = models.FileField(upload_to='chat_files/', blank=True, null=True)
    quiz_id = models.UUIDField(blank=True, null=True)
    lesson_id = models.UUIDField(blank=True, null=True)
    reactions = models.JSONField(default=dict, blank=True)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class MembershipRequest(models.Model):
    chatroom = models.ForeignKey(Chatroom, on_delete=models.CASCADE)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_requests_sent'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_requests_received'
    )
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)


class Award(models.Model):
    AWARD_TYPES = [
        ('top_scorer', 'Top Scorer'),
        ('most_improved', 'Most Improved'),
        ('perfect_score', 'Perfect Score'),
        ('quiz_master', 'Quiz Master'),
        ('fastest_finisher', 'Fastest Finisher'),
        ('outstanding', 'Outstanding'),
        ('heart_of_class', 'Heart of Class'),
        ('participation', 'Participation'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatroom = models.ForeignKey(Chatroom, on_delete=models.CASCADE, related_name='awards')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='awards_received')
    award_type = models.CharField(max_length=20, choices=AWARD_TYPES)
    given_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='awards_given')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('chatroom', 'student', 'award_type', 'given_by')
    
    def __str__(self):
        return f"{self.student.username} - {self.get_award_type_display()}"