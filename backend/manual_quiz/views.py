import io
import json
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
from .models import ManualQuiz, Question, Choice, QuizAttempt, StudentAnswer
from .serializers import (
    ManualQuizCreateSerializer, ManualQuizListSerializer,
    ManualQuizDetailSerializer, QuizAttemptSerializer
)


def _extract_data(request):
    if not hasattr(request.data, 'getlist'):
        return dict(request.data)

    plain = {}
    for key in request.data:
        vals = request.data.getlist(key)
        plain[key] = vals[0] if len(vals) == 1 else vals

    for field in [
        'is_public', 'shuffle_questions', 'shuffle_choices',
        'collect_email', 'show_progress_bar', 'show_results',
        'is_active', 'allow_review'
    ]:
        if field in plain and isinstance(plain[field], str):
            plain[field] = plain[field].lower() in ['true', '1', 'yes']

    for field in ['time_per_question']:
        if field in plain and isinstance(plain[field], str):
            try:
                plain[field] = int(plain[field])
            except ValueError:
                plain[field] = 0

    if 'questions' in plain and isinstance(plain['questions'], str):
        try:
            plain['questions'] = json.loads(plain['questions'])
        except json.JSONDecodeError:
            pass

    dl = plain.get('deadline')
    if not dl or str(dl).strip() in ['', 'null', 'undefined', 'None']:
        plain.pop('deadline', None)

    plain.setdefault('allow_review', True)
    plain.setdefault('show_progress_bar', True)
    plain.setdefault('is_active', True)
    plain.setdefault('shuffle_questions', False)
    plain.setdefault('shuffle_choices', False)
    plain.setdefault('collect_email', False)
    plain.setdefault('show_results', False)
    plain.setdefault('is_public', False)

    return plain


def _save_quiz_with_questions(quiz, questions_data):
    """Delete old questions/choices and recreate from scratch."""
    Question.objects.filter(quiz=quiz).delete()
    for idx, q_data in enumerate(questions_data):
        choices_data = q_data.pop('choices', [])
        question = Question.objects.create(quiz=quiz, order=idx + 1, **q_data)
        for c_idx, c_data in enumerate(choices_data):
            Choice.objects.create(question=question, order=c_idx + 1, **c_data)


class CreateManualQuizView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if request.user.role != 'teacher':
            return Response({"error": "Only teachers can create quizzes"}, status=403)

        data = _extract_data(request)

        questions = data.get('questions')
        if not questions or not isinstance(questions, list) or len(questions) == 0:
            return Response({"error": "Questions data is missing or invalid"}, status=400)

        serializer = ManualQuizCreateSerializer(data=data, context={'request': request})

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    quiz = serializer.save(teacher=request.user)
                return Response(ManualQuizDetailSerializer(quiz).data, status=201)
            except Exception as e:
                print(f"Save failed: {e}")
                return Response({"error": str(e)}, status=500)
        else:
            print("SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=400)


class TeacherQuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = ManualQuiz.objects.filter(teacher=request.user).order_by('-created_at')
        data = []
        for q in quizzes:
            data.append({
                'id': q.id,
                'title': q.title,
                'description': q.description,
                'unique_code': q.unique_code,
                'is_active': q.is_active,
                'is_public': q.is_public,
                'questions_count': q.questions.count(),
                'attempts_count': q.attempts.count(),
                'created_at': q.created_at.strftime("%Y-%m-%d %H:%M"),
                'deadline': q.deadline.strftime("%Y-%m-%d %H:%M") if q.deadline else None,
                'image': request.build_absolute_uri(q.image.url) if q.image else None,
            })
        return Response(data)


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        serializer = ManualQuizDetailSerializer(quiz)
        return Response(serializer.data)


class QuizUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        data = _extract_data(request)
        questions = data.get('questions')

        if not questions or not isinstance(questions, list):
            return Response({"error": "Questions data is missing"}, status=400)

        try:
            with transaction.atomic():
                for field in ['title', 'description', 'is_active', 'is_public',
                              'shuffle_questions', 'shuffle_choices', 'collect_email',
                              'show_progress_bar', 'show_results', 'time_per_question',
                              'allow_review', 'instructions']:
                    if field in data:
                        setattr(quiz, field, data[field])

                dl = data.get('deadline')
                quiz.deadline = dl if dl else None

                if 'image' in request.FILES:
                    quiz.image = request.FILES['image']

                quiz.save()
                _save_quiz_with_questions(quiz, questions)

            return Response(ManualQuizDetailSerializer(quiz).data)
        except Exception as e:
            print(f"Update failed: {e}")
            return Response({"error": str(e)}, status=500)


class QuizDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
            quiz.delete()
            return Response({"message": "Quiz deleted successfully"})
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)


class QuizResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        attempts = QuizAttempt.objects.filter(quiz=quiz).select_related('student').prefetch_related('answers__question')
        serializer = QuizAttemptSerializer(attempts, many=True)
        return Response({"quiz_title": quiz.title, "results": serializer.data})


class ExportResultsExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
            attempts = QuizAttempt.objects.filter(quiz=quiz).select_related('student')

            rows = [{
                'Student Name': a.student.username,
                'Email': a.student_email or a.student.email,
                'Score': a.score,
                'Total Points': a.total_points,
                'Percentage': f"{a.percentage}%",
                'Submitted At': a.submitted_at.strftime("%Y-%m-%d %H:%M"),
            } for a in attempts]

            df = pd.DataFrame(rows)
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="results_{quiz.unique_code}.xlsx"'

            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Results')
            buffer.seek(0)
            response.write(buffer.getvalue())
            return response
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)


class QuizSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id, teacher=request.user)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        allowed = [
            'title', 'description', 'is_active', 'deadline', 'show_results',
            'time_per_question', 'is_public', 'shuffle_questions', 'shuffle_choices',
            'collect_email', 'show_progress_bar', 'instructions', 'allow_review'
        ]
        for field in allowed:
            if field in request.data:
                setattr(quiz, field, request.data[field])

        quiz.save()
        return Response({"message": "Settings updated", "is_active": quiz.is_active})


class PublicManualQuizLibraryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '')
        quizzes = ManualQuiz.objects.filter(is_public=True, is_active=True).order_by('-created_at')
        if search:
            quizzes = quizzes.filter(Q(title__icontains=search) | Q(description__icontains=search))

        data = [{
            'id': q.id,
            'unique_code': q.unique_code,
            'title': q.title,
            'questions_count': q.questions.count(),
            'created_by': q.teacher.username,
            'quiz_type': 'manual'
        } for q in quizzes]
        return Response(data)


class JoinQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        try:
            quiz = ManualQuiz.objects.get(unique_code=code)
            if not quiz.is_active:
                return Response({"error": "This quiz is no longer accepting responses."}, status=400)
            if quiz.deadline and timezone.now() > quiz.deadline:
                return Response({"error": "The deadline for this quiz has passed."}, status=400)
            if QuizAttempt.objects.filter(quiz=quiz, student=request.user).exists():
                return Response({"error": "You have already attempted this quiz."}, status=400)

            serializer = ManualQuizDetailSerializer(quiz)
            data = serializer.data

            if not quiz.show_results:
                for q in data['questions']:
                    for c in q['choices']:
                        c.pop('is_correct', None)
                    q.pop('correct_text_answer', None)
                    q.pop('feedback_correct', None)
                    q.pop('feedback_incorrect', None)

            return Response(data)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Invalid Quiz Code"}, status=404)


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request, quiz_id):
        try:
            quiz = ManualQuiz.objects.get(id=quiz_id)
        except ManualQuiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=404)

        if not quiz.is_active:
            return Response({"error": "Quiz is not accepting submissions."}, status=400)
        if quiz.deadline and timezone.now() > quiz.deadline:
            return Response({"error": "Deadline passed."}, status=400)
        if QuizAttempt.objects.filter(quiz=quiz, student=request.user).exists():
            return Response({"error": "Already submitted"}, status=400)

        answers_data = request.data.get('answers', [])
        total_points = sum(q.points for q in quiz.questions.all())
        score = 0
        feedback_list = []

        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                student=request.user,
                score=0,
                total_points=total_points,
                student_email=request.data.get('email') or "",
                student_name=request.user.username or "",
                is_reviewed=False
            )

            for ans in answers_data:
                try:
                    q = Question.objects.get(id=ans.get('question_id'), quiz=quiz)
                    is_correct = False
                    earned = 0
                    fb = {'question_id': q.id, 'is_correct': False}

                    if q.question_type in ['multiple_choice', 'dropdown', 'true_false']:
                        sel_id = ans.get('choice_id')
                        if sel_id and Choice.objects.filter(id=sel_id, question=q, is_correct=True).exists():
                            is_correct, earned = True, q.points
                        StudentAnswer.objects.create(
                            attempt=attempt, question=q,
                            selected_choice_id=sel_id,
                            is_correct=is_correct, points_earned=earned
                        )

                    elif q.question_type == 'checkboxes':
                        sel_ids = set(ans.get('choice_ids', []))
                        correct_ids = set(q.choices.filter(is_correct=True).values_list('id', flat=True))
                        if sel_ids == correct_ids:
                            is_correct, earned = True, q.points
                        StudentAnswer.objects.create(
                            attempt=attempt, question=q,
                            selected_choice_ids=list(sel_ids),
                            is_correct=is_correct, points_earned=earned
                        )

                    elif q.question_type in ['short_text', 'paragraph']:
                        student_ans = ans.get('text_answer', '').strip().lower()
                        correct_ans = (q.correct_text_answer or "").strip().lower()
                        if student_ans == correct_ans:
                            is_correct, earned = True, q.points
                        StudentAnswer.objects.create(
                            attempt=attempt, question=q,
                            text_answer=ans.get('text_answer', ''),
                            is_correct=is_correct, points_earned=earned
                        )

                    score += earned
                    fb['is_correct'] = is_correct

                    if quiz.show_results:
                        fb['feedback'] = q.feedback_correct if is_correct else q.feedback_incorrect
                        if q.question_type in ['multiple_choice', 'dropdown', 'checkboxes', 'true_false']:
                            fb['correct_options'] = list(q.choices.filter(is_correct=True).values_list('id', flat=True))
                        elif q.question_type in ['short_text', 'paragraph']:
                            fb['correct_text'] = q.correct_text_answer

                    feedback_list.append(fb)

                except Exception as e:
                    print(f"Error grading question {ans.get('question_id')}: {e}")

            attempt.score = score
            attempt.save()

        response_data = {
            "message": "Quiz submitted successfully",
            "score": score,
            "total": total_points,
            "percentage": attempt.percentage
        }

        if quiz.show_results:
            response_data['feedback'] = feedback_list

        return Response(response_data)