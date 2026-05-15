from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.utils import timezone
from .models import Chatroom, ChatroomMember, Message, MembershipRequest, Award
from api.models import User
from quiz.models import Quiz, QuizAttempt


def serialize_message(msg):
    return {
        "id": str(msg.id),
        "sender": msg.sender.username,
        "sender_id": str(msg.sender.id),
        "sender_pic": msg.sender.profile_picture.url if getattr(msg.sender, 'profile_picture', None) else None,
        "content": msg.content,
        "type": msg.message_type,
        "file_url": msg.file_url.url if msg.file_url else None,
        "created_at": msg.created_at,
        "reactions": msg.reactions or {},
        "is_edited": msg.is_edited,
        "read_at": msg.read_at,
        "quiz_id": str(msg.quiz_id) if msg.quiz_id else None,
        "lesson_id": str(msg.lesson_id) if msg.lesson_id else None,
    }


class ChatroomListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = request.user.joined_rooms.all()
        data = []

        for room in rooms:
            last_msg = room.messages.last()
            name = room.name
            photo = room.photo.url if room.photo else None

            if room.is_direct:
                other = room.members.exclude(id=request.user.id).first()
                if other:
                    other_member = ChatroomMember.objects.filter(
                        user=other, chatroom=room
                    ).first()
                    name = other_member.nickname if other_member and other_member.nickname else other.username

                if not photo and other and getattr(other, 'profile_picture', None):
                    photo = other.profile_picture.url

            data.append({
                "id": str(room.id),
                "name": name,
                "photo": photo,
                "is_direct": room.is_direct,
                "last_message": last_msg.content if last_msg else "",
                "last_time": last_msg.created_at if last_msg else None
            })
        return Response(data)

    def post(self, request):
        is_direct = request.data.get('is_direct', False)

        if is_direct:
            target_id = request.data.get('user_id')
            if not target_id:
                return Response({"error": "User ID required"}, status=400)

            target = get_object_or_404(User, id=target_id)

            existing = Chatroom.objects.filter(is_direct=True, members=request.user).filter(members=target).first()
            if existing:
                return Response({"id": str(existing.id), "message": "Room already exists"})

            room = Chatroom.objects.create(is_direct=True, creator=request.user)
            ChatroomMember.objects.create(user=request.user, chatroom=room)
            ChatroomMember.objects.create(user=target, chatroom=room)
            return Response({"id": str(room.id)})

        name = request.data.get('name')
        member_ids = request.data.get('members', [])

        if not name:
            return Response({"error": "Group name required"}, status=400)

        room = Chatroom.objects.create(name=name, creator=request.user)
        ChatroomMember.objects.create(user=request.user, chatroom=room, role='admin')

        for user_id in member_ids:
            try:
                user = User.objects.get(id=user_id)
                if user != request.user:
                    ChatroomMember.objects.create(user=user, chatroom=room, role='member')
            except User.DoesNotExist:
                pass

        return Response({"id": str(room.id), "invite_code": room.invite_code})


class JoinChatroomView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('invite_code')
        try:
            room = Chatroom.objects.get(invite_code=code)
            if ChatroomMember.objects.filter(user=request.user, chatroom=room).exists():
                return Response({"message": "Already joined", "room_id": str(room.id)})

            ChatroomMember.objects.create(user=request.user, chatroom=room)
            return Response({"message": "Joined successfully", "room_id": str(room.id)})
        except Chatroom.DoesNotExist:
            return Response({"error": "Invalid Code"}, status=404)


class ChatroomDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)

        if request.user not in room.members.all():
            return Response({"error": "Access Denied"}, status=403)

        messages = room.messages.all().order_by('created_at')

        direct_info = None
        if room.is_direct:
            other_user = room.members.exclude(id=request.user.id).first()
            if other_user:
                direct_info = {
                    "id": str(other_user.id),
                    "username": other_user.username,
                    "profile_picture": other_user.profile_picture.url if getattr(other_user, 'profile_picture', None) else None,
                    "is_online": getattr(other_user, 'is_online', False),
                    "last_seen": getattr(other_user, 'last_seen', None),
                }

        member_records = ChatroomMember.objects.filter(chatroom=room).select_related('user', 'nickname_set_by')

        members_data = []
        for m in member_records:
            members_data.append({
                "id": str(m.user.id),
                "username": m.user.username,
                "role": m.role,
                "nickname": m.nickname,
                "nickname_set_by": str(m.nickname_set_by.id) if m.nickname_set_by else None,
                "nickname_set_by_name": m.nickname_set_by.username if m.nickname_set_by else None,
                "profile_picture": m.user.profile_picture.url if getattr(m.user, 'profile_picture', None) else None,
                "is_online": getattr(m.user, 'is_online', False),
                "last_seen": getattr(m.user, 'last_seen', None),
            })

        data = {
            "room": {
                "id": str(room.id),
                "name": room.name,
                "photo": room.photo.url if room.photo else None,
                "theme_color": room.theme_color,
                "theme": room.theme_color,
                "wallpaper": room.wallpaper,
                "invite_code": room.invite_code,
                "is_direct": room.is_direct
            },
            "direct_info": direct_info,
            "messages": [serialize_message(m) for m in messages],
            "members": members_data,
            "stats": {
                "quiz_count": Quiz.objects.filter(chatroom=room).count(),
                "member_count": room.members.count()
            }
        }
        return Response(data)

    def put(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        member = ChatroomMember.objects.filter(user=request.user, chatroom=room).first()

        if not member:
            return Response({"error": "Access Denied"}, status=403)

        if member.role != 'admin' and not room.is_direct:
            return Response({"error": "Only admins can edit group settings"}, status=403)

        if 'photo' in request.FILES:
            room.photo = request.FILES['photo']
        if 'theme_color' in request.data:
            room.theme_color = request.data.get('theme_color')
        if 'name' in request.data:
            room.name = request.data.get('name')
        if 'wallpaper' in request.data:
            room.wallpaper = request.data.get('wallpaper')

        room.save()
        return Response({"message": "Updated"})


class AddMemberView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        requester = get_object_or_404(ChatroomMember, chatroom=room, user=request.user)

        identifier = request.data.get('identifier')
        if not identifier:
            return Response({"error": "Identifier required"}, status=400)

        try:
            from uuid import UUID
            try:
                uuid_obj = UUID(identifier, version=4)
                target_user = User.objects.get(id=uuid_obj)
            except ValueError:
                target_user = User.objects.get(username__iexact=identifier)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if requester.role == 'admin':
            ChatroomMember.objects.get_or_create(chatroom=room, user=target_user)
            return Response({"message": "Added successfully"})
        return Response({"error": "Only admins can add members"}, status=403)


class UpdateNicknameView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)

        requester_member = ChatroomMember.objects.filter(chatroom=room, user=request.user).first()
        if not requester_member:
            return Response({"error": "Not a member"}, status=403)

        target_id = request.data.get('user_id')
        nickname = request.data.get('nickname', '').strip()

        if target_id:
            target_member = get_object_or_404(ChatroomMember, chatroom=room, user_id=target_id)
        else:
            target_member = requester_member

        target_member.nickname = nickname if nickname else ''
        target_member.nickname_set_by = request.user if nickname else None
        target_member.save()

        return Response({
            "message": "Nickname updated",
            "nickname": target_member.nickname,
            "nickname_set_by": str(target_member.nickname_set_by.id) if target_member.nickname_set_by else None
        })


class ChatroomQuizzesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        if request.user not in room.members.all():
            return Response({"error": "Access Denied"}, status=403)

        quizzes = Quiz.objects.filter(chatroom=room).order_by('-created_at')
        data = []
        for q in quizzes:
            data.append({
                "id": str(q.id),
                "title": q.title,
                "created_by": q.created_by.username,
                "questions_count": q.questions.count(),
                "created_at": q.created_at
            })
        return Response(data)


class MessageCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        if request.user not in room.members.all():
            return Response({"error": "Access Denied"}, status=403)

        content = request.data.get('content', '')
        message_type = request.data.get('message_type', 'text')
        file_obj = request.FILES.get('file')

        if file_obj:
            file_name = file_obj.name.lower()
            content_type = getattr(file_obj, 'content_type', '') or ''
            if content_type.startswith('image/') or file_name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg')):
                message_type = 'image'
            else:
                message_type = 'file'

        msg = Message.objects.create(
            chatroom=room,
            sender=request.user,
            content=content,
            message_type=message_type,
            file_url=file_obj if file_obj else None
        )

        return Response(serialize_message(msg), status=201)


class MessageEditView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, msg_id):
        msg = get_object_or_404(Message, id=msg_id)
        if msg.sender != request.user:
            return Response({"error": "Not authorized"}, status=403)

        msg.content = request.data.get('content', msg.content)
        msg.is_edited = True
        msg.save()
        return Response({
            "message": "Updated",
            "content": msg.content,
            "is_edited": True
        })


class MessageDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, msg_id):
        msg = get_object_or_404(Message, id=msg_id)
        if msg.sender != request.user:
            return Response({"error": "Not authorized"}, status=403)
        msg.delete()
        return Response({"message": "Deleted"})


class MessageReactionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        msg = get_object_or_404(Message, id=msg_id)
        reaction = request.data.get('reaction')

        if not msg.reactions:
            msg.reactions = {}

        user_id = str(request.user.id)

        if msg.reactions.get(user_id) == reaction:
            msg.reactions.pop(user_id)
        else:
            msg.reactions[user_id] = reaction

        msg.save()
        return Response({"reactions": msg.reactions})


class ForwardMessageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, msg_id):
        original_msg = get_object_or_404(Message, id=msg_id)

        target_room_id = request.data.get('room_id') or request.data.get('chatroom_id')

        if not target_room_id:
            return Response({"error": "Target room ID required"}, status=400)

        try:
            from uuid import UUID
            target_room_id = str(UUID(target_room_id))
        except ValueError:
            return Response({"error": "Invalid room ID"}, status=400)

        target_room = get_object_or_404(Chatroom, id=target_room_id)
        if request.user not in target_room.members.all():
            return Response({"error": "Access denied to target room"}, status=403)

        forwarded = Message.objects.create(
            chatroom=target_room,
            sender=request.user,
            content=original_msg.content,
            message_type=original_msg.message_type,
            quiz_id=original_msg.quiz_id,
            lesson_id=original_msg.lesson_id,
        )

        if original_msg.file_url:
            forwarded.file_url = original_msg.file_url.name
            forwarded.save()

        return Response({
            "message": "Forwarded successfully",
            "forwarded_message_id": str(forwarded.id)
        })


class ChatroomSearchView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        messages = Message.objects.filter(
            chatroom_id=pk,
            content__icontains=query
        ).order_by('-created_at')[:50]

        data = [{
            "id": str(m.id),
            "content": m.content,
            "sender": m.sender.username,
            "sender_id": str(m.sender.id),
            "created_at": m.created_at,
            "type": m.message_type
        } for m in messages]
        return Response(data)


class ChatroomStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        attempts = QuizAttempt.objects.filter(quiz__chatroom=pk)

        if room.is_direct:
            user_scores = attempts.values('user__username').annotate(total_score=Sum('score'))
            stats = {"type": "1v1", "data": list(user_scores)}
        else:
            leaderboard = attempts.values('user__username', 'quiz_id').annotate(
                total_score=Sum('score'),
                total_quizzes=Count('id')
            ).order_by('-total_score')[:10]
            stats = {"type": "group", "leaderboard": list(leaderboard)}
        return Response(stats)


class MarkChatroomReadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        user = request.user

        if user not in room.members.all():
            return Response({"error": "Access Denied"}, status=403)

        updated_count = Message.objects.filter(
            chatroom=room
        ).exclude(
            sender=user
        ).filter(
            read_at__isnull=True
        ).update(read_at=timezone.now())

        return Response({"status": "marked read", "updated_count": updated_count})


class AwardStudentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)

        member = ChatroomMember.objects.filter(user=request.user, chatroom=room).first()
        if not member or member.role != 'admin':
            return Response({"error": "Only admins can give awards"}, status=403)

        student_id = request.data.get('student_id')
        award_type = request.data.get('award_type')

        if not student_id or not award_type:
            return Response({"error": "Student ID and award type required"}, status=400)

        valid_types = [t[0] for t in Award.AWARD_TYPES]
        if award_type not in valid_types:
            return Response({"error": "Invalid award type"}, status=400)

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)

        if student not in room.members.all():
            return Response({"error": "Student is not a member of this chatroom"}, status=400)

        if student == request.user:
            return Response({"error": "Cannot award yourself"}, status=400)

        award, created = Award.objects.get_or_create(
            chatroom=room,
            student=student,
            award_type=award_type,
            given_by=request.user,
        )

        if not created:
            return Response({"message": "Award already given to this student"}, status=200)

        return Response({
            "message": "Award given successfully",
            "award_id": str(award.id),
            "award_type": award.get_award_type_display()
        }, status=201)

    def get(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        awards = Award.objects.filter(chatroom=room).select_related('student', 'given_by').order_by('-created_at')

        data = [{
            "id": str(a.id),
            "student_id": str(a.student.id),
            "student_name": a.student.username,
            "award_type": a.award_type,
            "award_name": a.get_award_type_display(),
            "given_by_name": a.given_by.username,
            "created_at": a.created_at
        } for a in awards]

        return Response(data)


class RemoveMemberView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        room = get_object_or_404(Chatroom, id=pk)
        requester = ChatroomMember.objects.filter(user=request.user, chatroom=room).first()

        if not requester or requester.role != 'admin':
            return Response({"error": "Only admins can remove members"}, status=403)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID required"}, status=400)

        try:
            target_member = ChatroomMember.objects.get(chatroom=room, user_id=user_id)
        except ChatroomMember.DoesNotExist:
            return Response({"error": "Member not found"}, status=404)

        if target_member.user == request.user:
            return Response({"error": "Cannot remove yourself"}, status=400)

        target_member.delete()
        return Response({"message": "Member removed successfully"})