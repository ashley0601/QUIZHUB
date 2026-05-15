from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import update_session_auth_hash
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q, Avg, Count, Sum
from django.contrib.auth import logout
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncMonth, TruncDay
from .serializers import UserSerializer, RegisterSerializer, SubjectSerializer, SubjectCreateSerializer, SubjectUpdateSerializer
from .models import User, FriendRequest, UserAward
from quiz.models import Quiz, Subject
from library.models import Lesson

try:
    from quiz.models import QuizAttempt
except ImportError:
    QuizAttempt = None

from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(username=request.data.get('username'))
                user.is_online = True
                user.last_seen_at = timezone.now()
                user.save()

                user_data = UserSerializer(user).data
                if user.profile_picture:
                    user_data['profile_picture'] = request.build_absolute_uri(user.profile_picture.url)

                response.data['user'] = user_data
            except User.DoesNotExist:
                pass
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            request.user.is_online = False
            request.user.last_seen_at = timezone.now()
            request.user.save()
            return Response({"message": "Logged out successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If an account with that email exists, we have sent a reset link."})

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

        subject = "Password Reset Request"
        message = f"Hi {user.username},\n\nClick the link below to reset your password:\n{reset_url}\n\nIf you didn't request this, ignore this email."

        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
        except Exception as e:
            print(f"Email Error: {e}")
            print(f"DEBUG RESET LINK: {reset_url}")

        return Response({"message": "If an account with that email exists, we have sent a reset link."})


class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid reset link"}, status=400)

        if default_token_generator.check_token(user, token):
            new_password = request.data.get('new_password')
            if not new_password or len(new_password) < 6:
                return Response({"error": "Password must be at least 6 characters"}, status=400)

            user.set_password(new_password)
            user.save()
            return Response({"message": "Password has been reset successfully"})
        else:
            return Response({"error": "Invalid or expired token"}, status=400)


class PublicProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_quiz_visibility(self, quiz):
        if hasattr(quiz, 'visibility'):
            return getattr(quiz, 'visibility', 'public') or 'public'

        if hasattr(quiz, 'status'):
            value = str(getattr(quiz, 'status', 'public') or 'public').lower()
            if value in ['public', 'private', 'friends']:
                return value

        if hasattr(quiz, 'is_private'):
            return 'private' if getattr(quiz, 'is_private', False) else 'public'

        if hasattr(quiz, 'is_public'):
            return 'public' if getattr(quiz, 'is_public', True) else 'private'

        return 'public'

    def get(self, request, pk=None):
        try:
            target_user = User.objects.get(id=pk) if pk else request.user
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        is_owner = request.user == target_user
        user_data = UserSerializer(target_user).data

        if target_user.profile_picture:
            user_data['profile_picture'] = request.build_absolute_uri(target_user.profile_picture.url)

        friend_status = 'none'
        request_id = None

        if not is_owner:
            is_friend = FriendRequest.objects.filter(
                (Q(sender=request.user, receiver=target_user) | Q(sender=target_user, receiver=request.user)),
                status='accepted'
            ).exists()

            if is_friend:
                friend_status = 'friends'
            else:
                sent_req = FriendRequest.objects.filter(
                    sender=request.user,
                    receiver=target_user,
                    status='pending'
                ).first()

                if sent_req:
                    friend_status = 'sent'
                else:
                    recv_req = FriendRequest.objects.filter(
                        sender=target_user,
                        receiver=request.user,
                        status='pending'
                    ).first()

                    if recv_req:
                        friend_status = 'received'
                        request_id = recv_req.id

        friend_requests = FriendRequest.objects.filter(
            (Q(sender=target_user) | Q(receiver=target_user)) & Q(status='accepted')
        )

        friends = []
        for req in friend_requests:
            friend = req.receiver if req.sender == target_user else req.sender
            pic_url = request.build_absolute_uri(friend.profile_picture.url) if friend.profile_picture else None

            friends.append({
                "id": str(friend.id),
                "username": friend.username,
                "profile_pic": pic_url
            })

        awards = []

        awards_qs = UserAward.objects.filter(user=target_user)
        for a in awards_qs:
            awards.append({
                "id": str(a.id),
                "award_type": None,
                "title": a.title,
                "award_name": a.title,
                "description": a.description,
                "given_by": a.given_by.username if a.given_by else "System",
                "chatroom_name": None
            })

        try:
            from chat.models import Award as ChatAward
        except ImportError:
            ChatAward = None

        if ChatAward:
            chat_awards_qs = ChatAward.objects.filter(
                student=target_user
            ).select_related('given_by', 'chatroom').order_by('-created_at')

            for a in chat_awards_qs:
                award_type_display = dict(ChatAward.AWARD_TYPES).get(a.award_type, a.award_type)
                awards.append({
                    "id": str(a.id),
                    "award_type": a.award_type,
                    "title": award_type_display,
                    "award_name": award_type_display,
                    "given_by": a.given_by.username if a.given_by else "Unknown",
                    "chatroom_name": a.chatroom.name if a.chatroom.name else "Group Chat"
                })

        raw_quizzes_qs = Quiz.objects.filter(created_by=target_user).order_by('-created_at')[:20]

        quizzes = []
        for q in raw_quizzes_qs:
            quiz_visibility = self.get_quiz_visibility(q)

            if not is_owner and quiz_visibility != 'public':
                continue

            quizzes.append({
                "id": str(q.id),
                "title": q.title,
                "visibility": quiz_visibility
            })

            if len(quizzes) >= 10:
                break

        if is_owner:
            lessons_qs = Lesson.objects.filter(created_by=target_user).order_by('-created_at')[:10]
        else:
            lessons_qs = Lesson.objects.filter(
                created_by=target_user,
                visibility='public'
            ).order_by('-created_at')[:10]

        lessons = [
            {
                "id": str(l.id),
                "title": l.title,
                "file": request.build_absolute_uri(l.file.url) if l.file else None,
                "visibility": getattr(l, 'visibility', 'public')
            }
            for l in lessons_qs
        ]

        data = {
            "user": user_data,
            "is_owner": is_owner,
            "friend_status": friend_status,
            "request_id": request_id,
            "awards": awards,
            "friends": friends,
            "quizzes": quizzes,
            "lessons": lessons
        }
        return Response(data)

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            response_data = serializer.data

            if user.profile_picture:
                response_data['profile_picture'] = request.build_absolute_uri(user.profile_picture.url)

            return Response(response_data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        chatroom_id = request.query_params.get('chatroom_id') 

        # FETCH GROUP CHATROOMS ONLY
        chatrooms_data = []
        try:
            from chat.models import Chatroom
            chatrooms_qs = Chatroom.objects.filter(members=user, is_direct=False).order_by('-created_at')
            for c in chatrooms_qs:
                last_msg = c.messages.order_by('-created_at').first()
                chatrooms_data.append({
                    "id": str(c.id),
                    "name": c.name,
                    "members": c.members.count(),
                    "last_message": last_msg.content[:50] if last_msg and last_msg.content else "No messages yet"
                })
        except ImportError:
            pass

        if user.role == 'teacher':
            
            # 1. FETCH STANDARD QUIZ ATTEMPTS
            standard_data = []
            if QuizAttempt:
                std_qs = QuizAttempt.objects.filter(
                    quiz__created_by=user
                ).exclude(user=user).select_related('user', 'quiz', 'quiz__subject')
                
                for a in std_qs:
                    pct = a.percentage if a.percentage is not None else 0
                    standard_data.append({
                        'user_id': a.user.id,
                        'username': a.user.username,
                        'percentage': pct,
                        'quiz_title': getattr(a.quiz, 'title', 'Unknown'),
                        'subject_name': getattr(getattr(a.quiz, 'subject', None), 'name', None),
                        'created_at': a.created_at
                    })

            # 2. FETCH MANUAL QUIZ ATTEMPTS
            manual_data = []
            try:
                from manual_quiz.models import QuizAttempt as ManualQuizAttempt
                manual_qs = ManualQuizAttempt.objects.filter(
                    quiz__teacher=user
                ).exclude(student=user).select_related('student', 'quiz')
                
                for a in manual_qs:
                    pct = round((a.score / a.total_points) * 100) if a.total_points and a.total_points > 0 else 0
                    manual_data.append({
                        'user_id': a.student.id,
                        'username': a.student.username,
                        'percentage': pct,
                        'quiz_title': getattr(a.quiz, 'title', 'Unknown'),
                        'subject_name': None, 
                        'created_at': a.submitted_at 
                    })
            except ImportError:
                pass
            except Exception as e:
                print(f"Error fetching manual attempts: {e}")

            # 3. COMBINE ALL ATTEMPTS INTO ONE LIST
            all_attempts_data = standard_data + manual_data

            # 4. FILTER BY CHATROOM MEMBERS IF APPLICABLE
            if chatroom_id:
                try:
                    from chat.models import Chatroom
                    room = Chatroom.objects.get(id=chatroom_id, members=user, is_direct=False)
                    member_ids = set(room.members.values_list('id', flat=True))
                    all_attempts_data = [a for a in all_attempts_data if a['user_id'] in member_ids]
                except Chatroom.DoesNotExist:
                    pass

            # 5. PROCESS ANALYTICS FROM COMBINED DATA
            total_students = len(set(a['user_id'] for a in all_attempts_data))
            avg_score = round(sum(a['percentage'] for a in all_attempts_data) / len(all_attempts_data), 1) if all_attempts_data else 0

            # Performance Buckets
            all_pcts = [a['percentage'] for a in all_attempts_data]
            buckets = [0, 0, 0, 0, 0]
            for p in all_pcts:
                if p <= 20: buckets[0] += 1
                elif p <= 40: buckets[1] += 1
                elif p <= 60: buckets[2] += 1
                elif p <= 80: buckets[3] += 1
                else: buckets[4] += 1
            
            performance_data = [
                {"name": "Excellent", "value": buckets[4], "color": "#8B5CF6"},
                {"name": "Good", "value": buckets[3], "color": "#60A5FA"},
                {"name": "Average", "value": buckets[2], "color": "#34D399"},
                {"name": "Needs Work", "value": buckets[0] + buckets[1], "color": "#F59E0B"},
            ]

            # Mon-Fri Activity (Distinct Students)
            today = timezone.now()
            start_of_week = today - timedelta(days=today.weekday())
            start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

            day_name_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri'}
            day_students = {day: set() for day in ["Mon", "Tue", "Wed", "Thu", "Fri"]}
            
            for a in all_attempts_data:
                if a['created_at'] >= start_of_week:
                    day_name = day_name_map.get(a['created_at'].weekday())
                    if day_name:
                        day_students[day_name].add(a['user_id'])
            
            activity_data = [
                {"name": day, "students": len(day_students[day])} 
                for day in ["Mon", "Tue", "Wed", "Thu", "Fri"]
            ]

            # Top Students
            student_scores = {}
            for a in all_attempts_data:
                if a['user_id'] not in student_scores:
                    student_scores[a['user_id']] = {'username': a['username'], 'total_pct': 0, 'count': 0}
                student_scores[a['user_id']]['total_pct'] += a['percentage']
                student_scores[a['user_id']]['count'] += 1

            top_students_list = sorted(student_scores.items(), key=lambda x: (x[1]['total_pct']/x[1]['count']), reverse=True)[:5]
            top_students = [
                {"name": data['username'], "score": round(data['total_pct']/data['count']), "id": str(uid)} 
                for uid, data in top_students_list
            ]

            # Class Weaknesses
            subject_map = {}
            for a in all_attempts_data:
                subj_name = a['subject_name'] or "General / Manual"
                if subj_name not in subject_map:
                    subject_map[subj_name] = {'total_pct': 0, 'count': 0}
                subject_map[subj_name]['total_pct'] += a['percentage']
                subject_map[subj_name]['count'] += 1

            class_weaknesses = []
            for subj, stats in sorted(subject_map.items(), key=lambda x: x[1]['total_pct']/x[1]['count']):
                avg = round(stats['total_pct'] / stats['count']) if stats['count'] > 0 else 0
                class_weaknesses.append({"name": subj, "accuracy": avg, "students": stats['count']})

            # Recent Student Activity Feed
            recent_sorted = sorted(all_attempts_data, key=lambda x: x['created_at'], reverse=True)[:5]
            recent_attempts = [
                {
                    "student": a['username'], 
                    "student_id": str(a['user_id']), 
                    "quiz": a['quiz_title'], 
                    "score": round(a['percentage']), 
                    "date": a['created_at'].strftime("%b %d, %Y")
                } for a in recent_sorted
            ]

            # Pass/Fail Data for Class Health UI
            total_attempts_count = len(all_attempts_data)
            passed_count = sum(1 for a in all_attempts_data if a['percentage'] >= 60)
            failed_count = total_attempts_count - passed_count
            pass_rate_val = round((passed_count / total_attempts_count) * 100) if total_attempts_count > 0 else 0

            pass_fail_data = {
                "passed": passed_count,
                "failed": failed_count,
                "total_attempts": total_attempts_count,
                "pass_rate": pass_rate_val
            }

            # Score Extremes & Engagement for Class Health UI
            highest_score = round(max([a['percentage'] for a in all_attempts_data], default=0))
            lowest_score = round(min([a['percentage'] for a in all_attempts_data], default=0))
            avg_attempts = round(len(all_attempts_data) / total_students, 1) if total_students > 0 else 0

            score_extremes_data = {
                "highest": highest_score,
                "lowest": lowest_score,
                "avg_attempts": avg_attempts
            }

            data = {
                "role": "teacher", "total_students": total_students, "average_score": avg_score,
                "chatrooms": chatrooms_data, "activity_data": activity_data, "performance_data": performance_data, 
                "top_students": top_students, "recent_attempts": recent_attempts, 
                "class_weaknesses": class_weaknesses, "pass_fail_data": pass_fail_data,
                "score_extremes_data": score_extremes_data
            }
        
        else:
            if not QuizAttempt:
                return Response({"role": "student", "quizzes_taken": 0, "average_score": 0, "study_streak": 0, "progress_data": [], "subject_data": [], "recent_quizzes": [], "recent_lessons": [], "chatrooms": chatrooms_data})

            attempts_data = list(QuizAttempt.objects.filter(user=user).select_related('quiz', 'quiz__subject').values('score', 'percentage', 'created_at', 'created_at__date', 'quiz__title', 'quiz__subject__name', 'quiz__subject'))
            total_attempts = len(attempts_data)

            if not attempts_data:
                return Response({"role": "student", "quizzes_taken": 0, "average_score": 0, "study_streak": 0, "progress_data": [], "subject_data": [], "recent_quizzes": [], "recent_lessons": [], "chatrooms": chatrooms_data})

            recent_quizzes = []
            for a in reversed(attempts_data):
                if len(recent_quizzes) < 5:
                    recent_quizzes.append({"title": a.get('quiz__title', 'Quiz'), "score": round(a['percentage'], 1) if a['percentage'] else 0, "date": a['created_at'].strftime("%Y-%m-%d")})

            avg_agg = QuizAttempt.objects.filter(user=user).aggregate(avg=Avg('percentage'))
            average_score = round(avg_agg['avg'], 1) if avg_agg['avg'] else 0

            attempt_dates = set(a['created_at__date'] for a in attempts_data)
            today = timezone.now().date()
            study_streak = 0
            check_date = today
            if check_date not in attempt_dates: check_date = today - timedelta(days=1)
            while check_date in attempt_dates:
                study_streak += 1
                check_date -= timedelta(days=1)

            lessons_qs = Lesson.objects.filter(created_by=user).order_by('-created_at')[:5]
            recent_lessons = [{"title": l.title, "subject": getattr(l, 'subject', '') or '', "uploaded_by": l.created_by.username, "date": l.created_at.strftime("%b %d, %Y")} for l in lessons_qs]

            current_year = timezone.now().year
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            progress_qs = QuizAttempt.objects.filter(user=user, created_at__year=current_year).annotate(month=TruncMonth('created_at')).values('month').annotate(avg_score=Avg('percentage')).order_by('month')
            month_score_map = {p['month'].month: round(p['avg_score'], 1) for p in progress_qs}
            progress_data = [{"name": month_names[m - 1], "score": month_score_map.get(m, 0)} for m in range(1, 13)]

            subject_qs = QuizAttempt.objects.filter(user=user).values('quiz__subject__name', 'quiz__subject').annotate(avg=Avg('percentage')).order_by('-avg')[:4]
            colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea']
            subject_data = []
            for i, s in enumerate(subject_qs):
                name = s.get('quiz__subject__name') or str(s.get('quiz__subject', 'Unknown'))
                if name and name != 'None':
                    subject_data.append({"name": name, "value": round(s['avg'], 1), "color": colors[i]})

            data = {"role": "student", "quizzes_taken": total_attempts, "average_score": average_score, "study_streak": study_streak, "progress_data": progress_data, "subject_data": subject_data, "recent_quizzes": recent_quizzes, "recent_lessons": recent_lessons, "chatrooms": chatrooms_data}

        return Response(data)


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        empty_res = {
            "xp_earned": 0, "average_score": 0, "study_streak": 0, "streak_data": [],
            "accuracy_data": [{"name": "Correct", "value": 0, "color": "#22c55e"}, {"name": "Incorrect", "value": 0, "color": "#f87171"}],
            "score_distribution": [{"range": "0-20", "count": 0}, {"range": "21-40", "count": 0}, {"range": "41-60", "count": 0}, {"range": "61-80", "count": 0}, {"range": "81-100", "count": 0}],
            "weekly_comparison": [{"day": d, "thisWeek": 0, "lastWeek": 0} for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]],
            "weak_topics": [], "strong_topics": [], "completion_data": {"completed": 0, "in_progress": 0, "abandoned": 0}
        }

        if not QuizAttempt:
            return Response(empty_res)

        attempts_data = list(
            QuizAttempt.objects.filter(user=user)
            .select_related('quiz', 'quiz__subject')
            .values('score', 'percentage', 'created_at', 'created_at__date', 'quiz__subject__name', 'quiz__subject')
        )

        if not attempts_data:
            return Response(empty_res)

        total_pct = 0
        total_correct = 0
        total_incorrect = 0
        percentages = []
        dates_set = set()

        for a in attempts_data:
            pct = a['percentage'] if a['percentage'] is not None else 0
            total_pct += pct
            percentages.append(pct)
            dates_set.add(a['created_at__date'])

            total_correct += a['score'] if a['score'] is not None else 0
            
            if pct > 0 and a['score'] is not None:
                total_q_calc = (a['score'] / pct) * 100
                total_incorrect += int(round(total_q_calc - a['score']))

        count = len(attempts_data)
        xp_earned = round(total_pct)
        average_score = round(total_pct / count, 1)

        today = timezone.now().date()
        study_streak = 0
        check_date = today
        if check_date not in dates_set:
            check_date = today - timedelta(days=1)
        while check_date in dates_set:
            study_streak += 1
            check_date -= timedelta(days=1)

        ninety_days_ago = today - timedelta(days=89)
        date_counts = {}
        for a in attempts_data:
            d = a['created_at__date']
            if d >= ninety_days_ago:
                date_counts[d] = date_counts.get(d, 0) + 1

        streak_data = []
        for i in range(90):
            d = ninety_days_ago + timedelta(days=i)
            streak_data.append({"date": d.strftime("%Y-%m-%d"), "count": date_counts.get(d, 0)})

        accuracy_data = [
            {"name": "Correct", "value": total_correct, "color": "#22c55e"},
            {"name": "Incorrect", "value": total_incorrect, "color": "#f87171"},
        ]

        buckets = [0, 0, 0, 0, 0]
        for p in percentages:
            if p <= 20: buckets[0] += 1
            elif p <= 40: buckets[1] += 1
            elif p <= 60: buckets[2] += 1
            elif p <= 80: buckets[3] += 1
            else: buckets[4] += 1

        score_distribution = [
            {"range": "0-20", "count": buckets[0]}, {"range": "21-40", "count": buckets[1]},
            {"range": "41-60", "count": buckets[2]}, {"range": "61-80", "count": buckets[3]},
            {"range": "81-100", "count": buckets[4]},
        ]

        today_dt = timezone.now()
        start_of_this_week = today_dt - timedelta(days=today_dt.weekday())
        start_of_this_week = start_of_this_week.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_last_week = start_of_this_week - timedelta(days=7)

        days_of_week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        weekly_comparison = []
        for i in range(7):
            last_s = start_of_last_week + timedelta(days=i)
            last_e = last_s + timedelta(days=1)
            this_s = start_of_this_week + timedelta(days=i)
            this_e = this_s + timedelta(days=1)
            weekly_comparison.append({
                "day": days_of_week[i],
                "thisWeek": sum(1 for a in attempts_data if this_s <= a['created_at'] < this_e),
                "lastWeek": sum(1 for a in attempts_data if last_s <= a['created_at'] < last_e)
            })

        topic_map = {}
        for a in attempts_data:
            name = a.get('quiz__subject__name') or str(a.get('quiz__subject', ''))
            if name and name != 'None':
                if name not in topic_map:
                    topic_map[name] = {'total_pct': 0, 'count': 0}
                topic_map[name]['total_pct'] += (a['percentage'] if a['percentage'] else 0)
                topic_map[name]['count'] += 1

        topic_list = [{'name': k, 'avg': round(v['total_pct'] / v['count']), 'count': v['count']} for k, v in topic_map.items()]
        topic_list.sort(key=lambda x: x['avg'])

        weak_topics = [{"name": t['name'], "accuracy": t['avg']} for t in topic_list[:2] if t['count'] >= 1]
        strong_topics = [{"name": t['name'], "accuracy": t['avg']} for t in list(reversed(topic_list))[:2] if t['count'] >= 1]

        completed = count

        return Response({
            "xp_earned": xp_earned, "average_score": average_score, "study_streak": study_streak,
            "streak_data": streak_data, "accuracy_data": accuracy_data, "score_distribution": score_distribution,
            "weekly_comparison": weekly_comparison, "weak_topics": weak_topics, "strong_topics": strong_topics,
            "completion_data": {"completed": completed, "in_progress": 0, "abandoned": 0}
        })


class SearchUsersView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])

        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(unique_id__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(id=request.user.id)[:10]

        data = []
        for u in users:
            pic_url = None
            if u.profile_picture:
                pic_url = request.build_absolute_uri(u.profile_picture.url)

            is_friend = FriendRequest.objects.filter(
                (Q(sender=request.user) & Q(receiver=u) & Q(status='accepted')) |
                (Q(sender=u) & Q(receiver=request.user) & Q(status='accepted'))
            ).exists()

            request_sent = FriendRequest.objects.filter(
                sender=request.user, receiver=u, status='pending'
            ).exists()

            data.append({
                "id": str(u.id), "username": u.username,
                "unique_id": u.unique_id,
                "profile_pic": pic_url,
                "is_friend": is_friend, "request_sent": request_sent
            })
        return Response(data)


class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, user_id):
        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if receiver == request.user:
            return Response({"error": "Cannot add self"}, status=400)

        req, created = FriendRequest.objects.get_or_create(
            sender=request.user, receiver=receiver
        )

        if not created:
            if req.status == 'accepted':
                return Response({"message": "Already friends"}, status=200)
            if req.status == 'pending':
                return Response({"message": "Request already sent"}, status=200)
            req.status = 'pending'
            req.save()
            return Response({"message": "Friend request sent!"})

        return Response({"message": "Friend request sent!"}, status=201)


class HandleFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, req_id):
        action = request.data.get('action')

        try:
            req = FriendRequest.objects.get(id=req_id, receiver=request.user)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=404)

        if action == 'accept':
            req.status = 'accepted'
            req.save()
            return Response({"message": "Friend request accepted"})
        elif action == 'reject':
            req.status = 'rejected'
            req.save()
            return Response({"message": "Friend request rejected"})

        return Response({"error": "Invalid action"}, status=400)


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        friend_requests = FriendRequest.objects.filter(
            (Q(sender=request.user) | Q(receiver=request.user)) & Q(status='accepted')
        )

        friends = []
        for req in friend_requests:
            friend = req.receiver if req.sender == request.user else req.sender

            pic_url = None
            if friend.profile_picture:
                pic_url = request.build_absolute_uri(friend.profile_picture.url)

            last_seen = None
            if hasattr(friend, 'last_seen_at') and friend.last_seen_at:
                last_seen = friend.last_seen_at.isoformat()

            friends.append({
                "id": str(friend.id),
                "username": friend.username,
                "profile_pic": pic_url,
                "is_online": friend.is_online,
                "last_seen_at": last_seen
            })
        online_friends = sorted(
            [f for f in friends if f['is_online']],
            key=lambda x: x['last_seen_at'] or '',
            reverse=True
        )
        offline_friends = sorted(
            [f for f in friends if not f['is_online']],
            key=lambda x: x['last_seen_at'] or '',
            reverse=True
        )

        return Response(online_friends + offline_friends)


class PendingRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        reqs = FriendRequest.objects.filter(receiver=request.user, status='pending')
        data = []
        for r in reqs:
            data.append({
                "id": r.id,
                "from_user": {
                    "id": str(r.sender.id),
                    "username": r.sender.username
                }
            })
        return Response(data)


class NotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        notifications = []

        pending_requests = FriendRequest.objects.filter(
            receiver=request.user,
            status='pending'
        ).order_by('-created_at')

        for req in pending_requests:
            notifications.append({
                "id": req.id,
                "type": "friend_request",
                "message": f"{req.sender.username} sent you a friend request.",
                "sender_name": req.sender.username,
                "sender_pic": request.build_absolute_uri(req.sender.profile_picture.url) if req.sender.profile_picture else None,
                "status": "pending",
                "created_at": req.created_at
            })

        time_threshold = timezone.now() - timedelta(days=30)
        accepted_requests = FriendRequest.objects.filter(
            (Q(sender=request.user) | Q(receiver=request.user)),
            status='accepted',
            created_at__gte=time_threshold
        ).order_by('-created_at')

        for req in accepted_requests:
            is_sender = req.sender == request.user
            other_user = req.receiver if is_sender else req.sender
            
            notifications.append({
                "id": req.id,
                "type": "friend_accepted",
                "message": f"{other_user.username} accepted your friend request!" if is_sender else f"You are now friends with {other_user.username}.",
                "friend_name": other_user.username,
                "friend_pic": request.build_absolute_uri(other_user.profile_picture.url) if other_user.profile_picture else None,
                "status": "accepted",
                "created_at": req.created_at
            })

        return Response(notifications)


class ChatNotificationsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        notifications = []

        try:
            from chat.models import Chatroom, Message
        except ImportError:
            return Response([])

        try:
            rooms = Chatroom.objects.filter(members=request.user)

            for room in rooms:
                last_unread_msg = (
                    Message.objects
                    .filter(chatroom=room, sender__isnull=False)
                    .exclude(sender=request.user)
                    .filter(read_at__isnull=True)
                    .order_by('-created_at')
                    .first()
                )

                if not last_unread_msg:
                    continue

                sender = last_unread_msg.sender
                sender_name = sender.username if sender else "Someone"
                sender_pic = None

                if sender and hasattr(sender, 'profile_picture') and sender.profile_picture:
                    try:
                        sender_pic = request.build_absolute_uri(sender.profile_picture.url)
                    except Exception:
                        pass

                content_preview = "Sent a message"
                if last_unread_msg.content:
                    content_preview = last_unread_msg.content[:120]
                elif last_unread_msg.message_type == 'file':
                    content_preview = "📎 Sent a file"
                elif last_unread_msg.message_type == 'image':
                    content_preview = "🖼️ Sent an image"
                elif last_unread_msg.message_type == 'quiz':
                    content_preview = "📝 Shared a quiz"
                elif last_unread_msg.message_type == 'lesson':
                    content_preview = "📚 Shared a lesson"

                room_name = room.name if room.name else "Group Chat"

                if room.is_direct:
                    try:
                        other_member = room.members.exclude(id=request.user.id).first()
                        if other_member:
                            room_name = other_member.username
                    except Exception:
                        pass

                unread_count = (
                    Message.objects
                    .filter(chatroom=room)
                    .exclude(sender=request.user)
                    .filter(read_at__isnull=True)
                    .count()
                )

                notifications.append({
                    "id": f"chat_{room.id}_{last_unread_msg.id}",
                    "type": "chat_message",
                    "message": content_preview,
                    "sender_name": sender_name,
                    "sender_pic": sender_pic,
                    "room_name": room_name,
                    "room_id": str(room.id),
                    "unread_count": unread_count,
                    "status": "unread",
                    "created_at": last_unread_msg.created_at,
                })

            notifications.sort(key=lambda x: x['created_at'], reverse=True)

        except Exception as e:
            print(f"ChatNotificationsView error: {e}")
            return Response([])

        return Response(notifications[:20])

    def post(self, request):
        try:
            from chat.models import Chatroom, Message
            rooms = Chatroom.objects.filter(members=request.user)
            updated_count = Message.objects.filter(
                chatroom__in=rooms
            ).exclude(sender=request.user).filter(read_at__isnull=True).update(read_at=timezone.now())
            
            return Response({"message": f"{updated_count} messages marked as read"})
        except ImportError:
            return Response({"message": "Chat not available"}, status=400)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"error": "Both old and new passwords are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"error": "Incorrect old password"}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
             return Response({"error": "Password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)

        return Response({"message": "Password changed successfully"})


class SubjectListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        subjects = Subject.objects.filter(is_active=True).order_by('name')
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SubjectCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            subject = serializer.save()
            response_serializer = SubjectSerializer(subject)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubjectDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self, pk):
        try:
            return Subject.objects.get(pk=pk, is_active=True)
        except Subject.DoesNotExist:
            return None

    def get(self, request, pk):
        subject = self.get_object(pk)
        if not subject:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubjectSerializer(subject)
        return Response(serializer.data)

    def put(self, request, pk):
        subject = self.get_object(pk)
        if not subject:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        if subject.created_by != request.user:
            return Response({"error": "You can only update subjects you created"}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubjectUpdateSerializer(subject, data=request.data)
        if serializer.is_valid():
            updated_subject = serializer.save()
            response_serializer = SubjectSerializer(updated_subject)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        subject = self.get_object(pk)
        if not subject:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        if subject.created_by != request.user:
            return Response({"error": "You can only delete subjects you created"}, status=status.HTTP_403_FORBIDDEN)

        subject.is_active = False
        subject.save()
        return Response({"message": "Subject deleted successfully"})