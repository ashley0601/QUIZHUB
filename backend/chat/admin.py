from django.contrib import admin
from .models import Chatroom, ChatroomMember, Message, MembershipRequest

admin.site.register(Chatroom)
admin.site.register(ChatroomMember)
admin.site.register(Message)
admin.site.register(MembershipRequest)

# Register your models here.
