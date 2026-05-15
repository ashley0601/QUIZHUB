import contextlib
import os
import json
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.parsers import MultiPartParser, FormParser

from django.conf import settings
from django.db.models import Q

from .models import Quiz, QuizQuestion, QuizAttempt, Subject
from .utils import extract_text_from_file, generate_quiz_questions
from chat.models import Chatroom, Message


def normalize_answer(value):
    value = str(value or '').strip().lower()
    value = re.sub(r'\s+', ' ', value)
    value = re.sub(r'[-_]', ' ', value)
    value = re.sub(r'[^\w\s]', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def check_text_answer(user_answer, correct_answer, accepted_answers=None):
    accepted_answers = accepted_answers or []

    normalized_user = normalize_answer(user_answer)
    if not normalized_user:
        return False

    valid_answers = [normalize_answer(correct_answer)]
    valid_answers += [normalize_answer(ans) for ans in accepted_answers if ans]

    if normalized_user in valid_answers:
        return True

    if len(normalized_user) >= 3:
        for valid in valid_answers:
            if normalized_user in valid or valid in normalized_user:
                return True

    return False


def check_matching_answer(user_answer, correct_answer):
    try:
        user_obj = json.loads(user_answer) if isinstance(user_answer, str) else user_answer
        correct_obj = json.loads(correct_answer) if isinstance(correct_answer, str) else correct_answer
    except (json.JSONDecodeError, TypeError, ValueError):
        return False

    if not isinstance(user_obj, dict) or not isinstance(correct_obj, dict):
        return False

    user_keys = set(user_obj.keys())
    correct_keys = set(correct_obj.keys())

    if user_keys != correct_keys:
        return False

    for key in correct_keys:
        user_val = normalize_answer(str(user_obj.get(key, '')))
        correct_val = normalize_answer(str(correct_obj.get(key, '')))
        if user_val != correct_val:
            return False

    return True


def deduplicate_questions(ai_questions):
    seen = set()
    cleaned = []

    for q in ai_questions:
        question_text = str(q.get("question", "")).strip()
        question_type = str(q.get("type", "")).strip()
        answer = q.get("answer", "")

        if isinstance(answer, dict):
            answer_key = json.dumps(answer, sort_keys=True)
        else:
            answer_key = str(answer).strip().lower()

        key = (
            re.sub(r'\s+', ' ', question_text.lower()),
            question_type,
            answer_key,
        )

        if key not in seen:
            seen.add(key)
            cleaned.append(q)

    return cleaned


def get_quiz_allow_retake(quiz):
    first_question = quiz.questions.first()
    if first_question and isinstance(first_question.choices, dict):
        return first_question.choices.get("allow_retake", True)
    return True


def get_quiz_visibility_type(quiz):
    return "public" if quiz.is_public else "private"


def get_invite_code(quiz):
    return str(quiz.id).replace("-", "")[:12]


def build_invite_link(request, quiz):
    code = get_invite_code(quiz)
    base = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    if base:
        return f"{base}/quiz/invite/{code}"
    return request.build_absolute_uri(f"/quiz/invite/{code}")


def get_best_attempts_for_quiz(quiz, scope="all"):
    attempts = QuizAttempt.objects.filter(quiz=quiz).select_related("user").order_by(
        "user_id", "-score", "time_taken", "-created_at"
    )

    best_by_user = {}
    for att in attempts:
        if att.user_id not in best_by_user:
            best_by_user[att.user_id] = att

    ranked = list(best_by_user.values())

    if scope == "public":
        ranked = [a for a in ranked if a.quiz.is_public]
    elif scope == "private":
        ranked = [a for a in ranked if not a.quiz.is_public]

    ranked.sort(key=lambda x: (-x.score, x.time_taken, -x.created_at.timestamp()))
    return ranked


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        data = request.data
        files = request.FILES

        title = (data.get('title') or '').strip()
        subject_id = (data.get('subject') or '').strip()
        difficulty = data.get('difficulty', 'medium')
        num_questions = int(data.get('num_questions', 5))
        time_per_question = int(data.get('time_per_question', 30))
        focus_area = (data.get('focus_area') or '').strip()
        allow_retake = str(data.get('allow_retake', 'true')).lower() == 'true'
        max_retakes = int(data.get('max_retakes', 1))

        question_types = data.getlist('question_types[]') or data.getlist('question_types')
        question_types = [q for q in question_types if q != 'flashcard']

        if not title:
            return Response({"error": "Title is required"}, status=400)

        try:
            subject = Subject.objects.get(id=subject_id, created_by=request.user, is_active=True)
        except Subject.DoesNotExist:
            return Response({"error": "Selected subject not found"}, status=400)
        except (ValueError, TypeError):
            return Response({"error": "Invalid subject ID"}, status=400)

        if not question_types:
            return Response({"error": "Please select at least one question type"}, status=400)

        content = extract_text_from_file(files['file']) if 'file' in files else ""

        ai_questions = generate_quiz_questions(
            topic=subject.name,
            content=content,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types,
            focus_area=focus_area if focus_area else None
        )

        if not ai_questions:
            return Response({"error": "AI failed to generate questions"}, status=500)

        ai_questions = deduplicate_questions(ai_questions)

        if len(ai_questions) == 0:
            return Response({"error": "AI generated duplicate/invalid questions only"}, status=500)

        quiz = Quiz.objects.create(
            title=title,
            subject=subject,
            difficulty=difficulty,
            created_by=request.user,
            time_per_question=time_per_question,
            max_retakes=max_retakes,
            is_public=False
        )

        invite_link = build_invite_link(request, quiz)

        for q in ai_questions:
            accepted_answers = q.get('accepted_answers', [])
            question_type = str(q.get('type') or 'mcq').strip().lower()

            if question_type in ['mcq', 'true_false', 'identification', 'fill_blank']:
                stored_choices = {
                    "options": q.get('choices', []),
                    "accepted_answers": accepted_answers,
                    "allow_retake": allow_retake,
                }
            else:
                raw_c = q.get('choices', {})
                stored_choices = {
                    "left": raw_c.get("left", []) if isinstance(raw_c, dict) else [],
                    "right": raw_c.get("right", []) if isinstance(raw_c, dict) else [],
                    "accepted_answers": accepted_answers,
                    "allow_retake": allow_retake,
                }

            QuizQuestion.objects.create(
                quiz=quiz,
                question_text=q.get('question', ''),
                question_type=question_type,
                choices=stored_choices,
                correct_answer=json.dumps(q.get('answer')) if isinstance(q.get('answer'), dict) else str(q.get('answer', '')),
                explanation=q.get('explanation', '')
            )

        return Response({
            "message": "Quiz generated",
            "id": str(quiz.id),
            "quiz_id": str(quiz.id),
            "questions_count": len(ai_questions),
            "allow_retake": allow_retake,
            "max_retakes": max_retakes,
            "invite_code": get_invite_code(quiz),
            "invite_link": invite_link,
            "leaderboard_type": "private",
        }, status=201)


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            questions = quiz.questions.all()

            q_list = []
            allow_retake = get_quiz_allow_retake(quiz)

            attempt_count = QuizAttempt.objects.filter(user=request.user, quiz=quiz).count()

            total_allowed = (quiz.max_retakes + 1) if allow_retake else 1
            can_take = attempt_count < total_allowed

            retakes_used = max(0, attempt_count - 1) if allow_retake else 0
            calc_remaining = max(0, quiz.max_retakes - retakes_used) if allow_retake else 0

            for q in questions:
                answer_value = q.correct_answer
                choices_value = q.choices

                if isinstance(q.choices, dict) and "allow_retake" in q.choices:
                    allow_retake = q.choices.get("allow_retake", True)

                if q.question_type == 'matching':
                    with contextlib.suppress(Exception):
                        answer_value = json.loads(q.correct_answer)
                    if isinstance(q.choices, dict):
                        left_values = q.choices.get("left", []) or []
                        right_values = q.choices.get("right", []) or []
                        if not left_values and not right_values and isinstance(answer_value, dict):
                            left_values = list(answer_value.keys())
                            right_values = list(answer_value.values())
                        choices_value = {
                            "left": left_values,
                            "right": right_values,
                        }
                elif q.question_type in ['mcq', 'true_false']:
                    if isinstance(q.choices, dict) and "options" in q.choices:
                        choices_value = q.choices["options"]
                    else:
                        choices_value = []
                elif q.question_type in ['identification', 'short_answer', 'fill_blank']:
                    choices_value = []

                q_list.append({
                    "id": str(q.id),
                    "question": q.question_text,
                    "type": q.question_type,
                    "choices": choices_value,
                    "answer": answer_value,
                    "accepted_answers": q.choices.get("accepted_answers", []) if isinstance(q.choices, dict) else [],
                    "explanation": q.explanation
                })

            return Response({
                "quiz": {
                    "id": str(quiz.id),
                    "title": quiz.title,
                    "subject": {
                        "id": str(quiz.subject.id),
                        "name": quiz.subject.name,
                    },
                    "time_per_question": quiz.time_per_question,
                    "max_retakes": quiz.max_retakes,
                    "remaining_retakes": calc_remaining,
                    "allow_retake": allow_retake,
                    "can_take": can_take,
                    "visibility": get_quiz_visibility_type(quiz),
                    "leaderboard_type": "public" if quiz.is_public else "private",
                    "invite_code": None if quiz.is_public else get_invite_code(quiz),
                    "invite_link": None if quiz.is_public else build_invite_link(request, quiz),
                },
                "questions": q_list if can_take else []
            })
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

    def put(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        title = (request.data.get('title') or '').strip()
        subject_id = (request.data.get('subject') or '').strip()
        difficulty = request.data.get('difficulty')
        time_per_question = request.data.get('time_per_question')
        max_retakes = request.data.get('max_retakes')

        if title:
            quiz.title = title
        if subject_id:
            try:
                subject = Subject.objects.get(id=subject_id, created_by=request.user, is_active=True)
                quiz.subject = subject
            except Subject.DoesNotExist:
                return Response({"error": "Selected subject not found"}, status=400)
            except (ValueError, TypeError):
                return Response({"error": "Invalid subject ID"}, status=400)
        if difficulty in ['easy', 'medium', 'hard']:
            quiz.difficulty = difficulty
        if time_per_question is not None:
            try:
                quiz.time_per_question = int(time_per_question)
            except (ValueError, TypeError):
                pass
        if max_retakes is not None:
            try:
                quiz.max_retakes = int(max_retakes)
            except (ValueError, TypeError):
                pass

        quiz.save()
        return Response({"message": "Quiz updated successfully"})

    def delete(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            quiz.delete()
            return Response({"message": "Quiz deleted successfully"})
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)


class QuizInviteDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, invite_code):
        quizzes = Quiz.objects.filter(is_public=False)
        matched_quiz = next(
            (quiz for quiz in quizzes if get_invite_code(quiz) == invite_code),
            None,
        )
        if not matched_quiz:
            return Response({"error": "Invalid invite link"}, status=404)

        questions = matched_quiz.questions.all()
        q_list = []
        allow_retake = get_quiz_allow_retake(matched_quiz)

        attempt_count = QuizAttempt.objects.filter(user=request.user, quiz=matched_quiz).count()
        total_allowed = (matched_quiz.max_retakes + 1) if allow_retake else 1
        can_take = attempt_count < total_allowed
        retakes_used = max(0, attempt_count - 1) if allow_retake else 0
        calc_remaining = max(0, matched_quiz.max_retakes - retakes_used) if allow_retake else 0

        for q in questions:
            answer_value = q.correct_answer
            choices_value = q.choices

            if q.question_type == 'matching':
                with contextlib.suppress(Exception):
                    answer_value = json.loads(q.correct_answer)
                if isinstance(q.choices, dict):
                    left_values = q.choices.get("left", []) or []
                    right_values = q.choices.get("right", []) or []
                    if not left_values and not right_values and isinstance(answer_value, dict):
                        left_values = list(answer_value.keys())
                        right_values = list(answer_value.values())
                    choices_value = {
                        "left": left_values,
                        "right": right_values
                    }
            elif q.question_type in ['mcq', 'true_false']:
                if isinstance(q.choices, dict) and "options" in q.choices:
                    choices_value = q.choices["options"]
                else:
                    choices_value = []
            elif q.question_type in ['identification', 'short_answer', 'fill_blank']:
                choices_value = []

            q_list.append({
                "id": str(q.id),
                "question": q.question_text,
                "type": q.question_type,
                "choices": choices_value,
                "answer": answer_value,
                "accepted_answers": q.choices.get("accepted_answers", []) if isinstance(q.choices, dict) else [],
                "explanation": q.explanation
            })

        return Response({
            "quiz": {
                "id": str(matched_quiz.id),
                "title": matched_quiz.title,
                "subject": {
                    "id": str(matched_quiz.subject.id),
                    "name": matched_quiz.subject.name,
                },
                "time_per_question": matched_quiz.time_per_question,
                "max_retakes": matched_quiz.max_retakes,
                "remaining_retakes": calc_remaining,
                "allow_retake": allow_retake,
                "can_take": can_take,
                "visibility": "private",
                "leaderboard_type": "private",
                "invite_code": invite_code,
                "invite_link": build_invite_link(request, matched_quiz),
            },
            "questions": q_list if can_take else []
        })


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        user_answers = request.data.get('answers', {})
        questions = quiz.questions.all()

        allow_retake = get_quiz_allow_retake(quiz)
        attempt_count = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user
        ).count()

        total_allowed = (quiz.max_retakes + 1) if allow_retake else 1

        if attempt_count >= total_allowed:
            return Response({
                "error": f"No more attempts allowed. You have used {attempt_count} of {total_allowed} attempt(s)."
            }, status=400)

        score = 0
        results = []

        for q in questions:
            correct = q.correct_answer
            user_ans = user_answers.get(str(q.id), "")
            accepted_answers = q.choices.get("accepted_answers", []) if isinstance(q.choices, dict) else []

            is_correct = False

            if q.question_type == 'matching':
                is_correct = check_matching_answer(user_ans, correct)
            else:
                is_correct = check_text_answer(user_ans, correct, accepted_answers)

            if is_correct:
                score += 1

            result_correct_answer = correct
            if q.question_type == 'matching':
                try:
                    result_correct_answer = json.loads(correct)
                except Exception:
                    pass

            results.append({
                "question_id": str(q.id),
                "correct": is_correct,
                "correct_answer": result_correct_answer,
                "user_answer": user_ans
            })

        total = len(questions)
        percentage = (score / total) * 100 if total > 0 else 0

        new_attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=request.user,
            score=score,
            percentage=percentage,
            time_taken=0
        )

        attempt_count += 1
        retakes_used = max(0, attempt_count - 1) if allow_retake else 0
        calc_remaining = max(0, quiz.max_retakes - retakes_used) if allow_retake else 0

        best_attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            user=request.user
        ).order_by('-score', 'time_taken', '-created_at').first()

        return Response({
            "score": score,
            "total": total,
            "percentage": round(percentage, 2),
            "results": results,
            "attempt_id": str(new_attempt.id),
            "attempt_count": attempt_count,
            "max_retakes": quiz.max_retakes,
            "remaining_retakes": calc_remaining,
            "best_score": best_attempt.score if best_attempt else score,
            "allow_retake": allow_retake and calc_remaining > 0,
            "leaderboard_type": "public" if quiz.is_public else "private",
            "visibility": get_quiz_visibility_type(quiz),
            "invite_code": None if quiz.is_public else get_invite_code(quiz),
            "invite_link": None if quiz.is_public else build_invite_link(request, quiz),
        })


class QuizLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, quiz_id):
        scope = request.query_params.get("scope")

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        if not scope:
            scope = "public" if quiz.is_public else "private"

        ranked = get_best_attempts_for_quiz(quiz, scope=scope)[:10]

        data = []
        for i, att in enumerate(ranked):
            retake_count = QuizAttempt.objects.filter(quiz=att.quiz, user=att.user).count() - 1

            data.append({
                "rank": i + 1,
                "username": att.user.username,
                "score": att.score,
                "total": att.quiz.questions.count(),
                "percentage": att.percentage,
                "retake_count": max(retake_count, 0),
                "leaderboard_type": scope,
                "visibility": "public" if att.quiz.is_public else "private",
            })

        return Response({
            "quiz_id": str(quiz.id),
            "leaderboard_type": scope,
            "visibility": get_quiz_visibility_type(quiz),
            "results": data
        })


class ShareQuizView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        target = request.data.get('target')

        if target == 'library':
            quiz.is_public = True
            # ---> ADDED THIS FLAG <---
            quiz.shared_to_library = True  
            quiz.save()
            return Response({
                "message": "Quiz posted to Public Library",
                "visibility": "public",
                "leaderboard_type": "public",
                "invite_link": None,
            })

        elif target == 'chatroom':
            chatroom_id = request.data.get('chatroom_id')

            if not chatroom_id:
                return Response({"error": "Chatroom is required"}, status=400)

            try:
                chatroom = Chatroom.objects.get(id=chatroom_id)
            except Chatroom.DoesNotExist:
                return Response({"error": "Chatroom not found"}, status=404)

            invite_link = build_invite_link(request, quiz)

            quiz.chatroom = chatroom
            quiz.save()

            message_text = (
                f"📘 Quiz Invitation\n"
                f"Title: {quiz.title}\n"
                f"Subject: {quiz.subject.name}\n"
                f"Click this link to open the quiz:\n{invite_link}"
            )

            Message.objects.create(
                chatroom=chatroom,
                sender=request.user,
                content=message_text
            )

            return Response({
                "message": "Quiz link sent to chatroom successfully",
                "visibility": "private",
                "leaderboard_type": "private",
                "invite_code": get_invite_code(quiz),
                "invite_link": invite_link,
                "chatroom_id": str(chatroom.id),
            })

        return Response({"error": "Invalid target"}, status=400)


# ---> ADDED THIS NEW VIEW <---
class UnshareQuizView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        quiz.shared_to_library = False
        quiz.save(update_fields=['shared_to_library'])
        
        return Response({"message": "Quiz removed from library"})


class QuizHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        quizzes = Quiz.objects.filter(attempts__user=request.user).distinct().order_by('-created_at')

        data = []
        for quiz in quizzes:
            attempts = QuizAttempt.objects.filter(user=request.user, quiz=quiz).order_by('-created_at')
            latest_attempt = attempts.first()
            best_attempt = attempts.order_by('-score', 'time_taken', '-created_at').first()
            attempt_count = attempts.count()
            allow_retake = get_quiz_allow_retake(quiz)

            total_allowed = (quiz.max_retakes + 1) if allow_retake else 1
            retakes_used = max(0, attempt_count - 1) if allow_retake else 0
            calc_remaining = max(0, quiz.max_retakes - retakes_used) if allow_retake else 0
            can_take = attempt_count < total_allowed

            if latest_attempt:
                data.append({
                    "id": str(latest_attempt.id),
                    "quiz_id": str(quiz.id),
                    "quiz_title": quiz.title,
                    "score": best_attempt.score if best_attempt else latest_attempt.score,
                    "latest_score": latest_attempt.score,
                    "total": quiz.questions.count(),
                    "date": latest_attempt.created_at,
                    "attempt_count": attempt_count,
                    "retake_count": max(attempt_count - 1, 0),
                    "max_retakes": quiz.max_retakes,
                    "status": f"{attempt_count} take{'s' if attempt_count > 1 else ''}",
                    "subject_id": str(quiz.subject.id),
                    "subject_name": quiz.subject.name,
                    "can_retake": can_take,
                    "visibility": get_quiz_visibility_type(quiz),
                    "leaderboard_type": "public" if quiz.is_public else "private",
                    "invite_code": None if quiz.is_public else get_invite_code(quiz),
                })

        data.sort(key=lambda x: x["date"], reverse=True)
        return Response(data[:10])


class PublicLibraryView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        search = request.query_params.get('search', '')

        # ---> UPDATED FILTER: ONLY FETCH EXPLICITLY SHARED QUIZZES <---
        quizzes = Quiz.objects.filter(shared_to_library=True).order_by('-created_at')

        if search:
            quizzes = quizzes.filter(
                Q(title__icontains=search) | Q(subject__name__icontains=search)
            )

        data = []
        for q in quizzes:
            data.append({
                "id": str(q.id),
                "title": q.title,
                "subject": q.subject.name if q.subject else "N/A",
                "difficulty": q.difficulty,
                "questions_count": q.questions.count(),
                "created_by": q.created_by.username,
                "created_at": q.created_at,
                "visibility": "public" if q.is_public else "private",
                "leaderboard_type": "public" if q.is_public else "private",
                "is_owner": q.created_by == request.user,
                # ---> ADDED THIS FOR FRONTEND CHECK <---
                "shared_to_library": True, 
            })

        return Response(data)


class QuizLibraryDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id, is_public=True)
            questions = quiz.questions.all()

            q_list = []
            allow_retake = True

            for q in questions:
                answer_value = q.correct_answer
                choices_value = q.choices

                if isinstance(q.choices, dict) and "allow_retake" in q.choices:
                    allow_retake = q.choices.get("allow_retake", True)

                if q.question_type == 'matching':
                    try:
                        answer_value = json.loads(q.correct_answer)
                    except Exception:
                        pass
                elif q.question_type in ['identification', 'short_answer', 'fill_blank']:
                    choices_value = []
                else:
                    if isinstance(q.choices, dict) and "options" in q.choices:
                        choices_value = q.choices["options"]

                q_list.append({
                    "id": str(q.id),
                    "question": q.question_text,
                    "type": q.question_type,
                    "choices": choices_value,
                    "answer": answer_value,
                    "accepted_answers": q.choices.get("accepted_answers", []) if isinstance(q.choices, dict) else [],
                    "explanation": q.explanation
                })

            return Response({
                "quiz": {
                    "id": str(quiz.id),
                    "title": quiz.title,
                    "time_per_question": quiz.time_per_question,
                    "allow_retake": allow_retake,
                    "visibility": "public",
                    "leaderboard_type": "public",
                    "invite_code": None,
                    "invite_link": None,
                },
                "questions": q_list
            })
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found or not public"}, status=404)


class ChatroomSearchView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()

        chatrooms = Chatroom.objects.filter(
            Q(members=request.user) | Q(creator=request.user)
        ).distinct().order_by("name")

        if query:
            chatrooms = chatrooms.filter(name__icontains=query)

        data = [
            {
                "id": str(room.id),
                "name": getattr(room, "name", "Unnamed Chatroom"),
            }
            for room in chatrooms[:20]
        ]

        return Response(data)


class SubjectListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        subjects = Subject.objects.filter(
            created_by=request.user,
            is_active=True
        ).order_by('name')
        data = [
            {"id": str(s.id), "name": s.name, "created_at": s.created_at}
            for s in subjects
        ]
        return Response(data)

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        description = (request.data.get('description') or '').strip()

        if not name:
            return Response({"error": "Subject name is required"}, status=400)

        if len(name) > 100:
            return Response(
                {"error": "Subject name must be 100 characters or less"},
                status=400
            )

        if Subject.objects.filter(
            created_by=request.user,
            name__iexact=name,
            is_active=True
        ).exists():
            return Response(
                {"name": ["You already have a subject with this name"]},
                status=400
            )

        subject = Subject.objects.create(
            name=name,
            description=description,
            created_by=request.user
        )
        return Response({
            "id": str(subject.id),
            "name": subject.name,
            "description": subject.description,
            "created_at": subject.created_at
        }, status=201)


class SubjectDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def _get_subject(self, subject_id, user):
        try:
            return Subject.objects.get(id=subject_id, created_by=user, is_active=True)
        except Subject.DoesNotExist:
            return None

    def put(self, request, subject_id):
        subject = self._get_subject(subject_id, request.user)
        if not subject:
            return Response({"error": "Subject not found"}, status=404)

        name = (request.data.get('name') or '').strip()
        description = (request.data.get('description') or '').strip()

        if not name:
            return Response({"error": "Subject name is required"}, status=400)

        if len(name) > 100:
            return Response(
                {"error": "Subject name must be 100 characters or less"},
                status=400
            )

        if Subject.objects.filter(
            created_by=request.user,
            name__iexact=name,
            is_active=True
        ).exclude(id=subject_id).exists():
            return Response(
                {"name": ["You already have a subject with this name"]},
                status=400
            )

        subject.name = name
        if description:
            subject.description = description
        subject.save()

        return Response({
            "id": str(subject.id),
            "name": subject.name,
            "description": subject.description,
            "created_at": subject.created_at
        })

    def delete(self, request, subject_id):
        subject = self._get_subject(subject_id, request.user)
        if not subject:
            return Response({"error": "Subject not found"}, status=404)

        quiz_count = Quiz.objects.filter(
            subject=subject,
            created_by=request.user
        ).count()

        if quiz_count > 0:
            return Response({
                "error": f"Cannot delete subject. It is used in {quiz_count} quiz(es)."
            }, status=400)

        subject.is_active = False
        subject.save()

        return Response({"message": "Subject deleted successfully"})