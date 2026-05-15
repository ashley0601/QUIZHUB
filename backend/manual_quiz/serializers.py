from rest_framework import serializers
from .models import ManualQuiz, Question, Choice, QuizAttempt, StudentAnswer


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['question_id', 'text_answer', 'selected_choice_id', 'selected_choice_ids', 'is_correct', 'points_earned']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'question_type', 'required', 'correct_text_answer', 'choices', 'points', 'feedback_correct', 'feedback_incorrect']


class ManualQuizListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualQuiz
        fields = ['id', 'title', 'unique_code', 'created_at', 'is_active', 'deadline', 'is_public']


class ManualQuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    teacher_name = serializers.ReadOnlyField(source='teacher.username')
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = ManualQuiz
        fields = [
            'id', 'title', 'description', 'unique_code', 'teacher_name', 'image',
            'deadline', 'show_results', 'time_per_question', 'is_public',
            'questions', 'shuffle_questions', 'shuffle_choices', 'collect_email',
            'show_progress_bar', 'instructions', 'allow_review'
        ]


class ManualQuizCreateSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)

    class Meta:
        model = ManualQuiz
        fields = [
            'id', 'title', 'description', 'image', 'deadline', 'show_results',
            'time_per_question', 'is_public', 'questions', 'shuffle_questions',
            'shuffle_choices', 'collect_email', 'show_progress_bar',
            'instructions', 'is_active', 'allow_review'
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        quiz = ManualQuiz.objects.create(**validated_data)
        for idx, q_data in enumerate(questions_data):
            choices_data = q_data.pop('choices', [])
            question = Question.objects.create(quiz=quiz, order=idx + 1, **q_data)
            for c_idx, c_data in enumerate(choices_data):
                Choice.objects.create(question=question, order=c_idx + 1, **c_data)
        return quiz


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    answers = StudentAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'student_name', 'score', 'total_points', 'percentage', 'submitted_at', 'student_email', 'answers']