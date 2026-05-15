import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Chatroom, Message, ChatroomMember
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        is_member = await self.is_user_member()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'chat_message')

        if message_type == 'chat_message':
            await self.save_message(data['message'], 'text', None, None, None)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'sender': self.scope["user"].username,
                    'sender_id': str(self.scope["user"].id),
                }
            )
        elif message_type == 'share_quiz':
            await self.save_message(f"Shared a Quiz: {data['title']}", 'quiz', None, data['quiz_id'], None)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': f"Shared a Quiz: {data['title']}",
                    'sender': self.scope["user"].username,
                    'sender_id': str(self.scope["user"].id),
                    'msg_type': 'quiz',
                    'quiz_id': data['quiz_id']
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event.get('sender_id'),
            'type': event.get('msg_type', 'text'),
            'quiz_id': event.get('quiz_id'),
            'lesson_id': event.get('lesson_id'),
        }))

    @database_sync_to_async
    def is_user_member(self):
        try:
            room = Chatroom.objects.get(id=self.room_id)
            return ChatroomMember.objects.filter(user=self.scope["user"], chatroom=room).exists()
        except Exception:
            return False

    @database_sync_to_async
    def save_message(self, content, msg_type, file_url, quiz_id, lesson_id):
        room = Chatroom.objects.get(id=self.room_id)
        return Message.objects.create(
            chatroom=room,
            sender=self.scope["user"],
            content=content,
            message_type=msg_type,
            file_url=file_url,
            quiz_id=quiz_id,
            lesson_id=lesson_id
        )