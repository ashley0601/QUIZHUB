from rest_framework import serializers
from .models import Quiz, QuizQuestion, QuizAttempt


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'
        read_only_fields = ['id', 'quiz']


class QuizSerializer(serializers.ModelSerializer):
    # ---> ADD THESE CUSTOM FIELDS <---
    # This makes q.subject return "Math" instead of a UUID
    subject = serializers.StringRelatedField() 
    # This makes q.created_by return "Kurt" instead of a UUID
    created_by = serializers.StringRelatedField(read_only=True) 
    # Frontend logic checks these two booleans
    is_owner = serializers.SerializerMethodField()
    shared_to_library = serializers.BooleanField(read_only=True)
    # Frontend displays this: {q.questions_count}
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.created_by.id == request.user.id
        return False

    def get_questions_count(self, obj):
        # Counts the related QuizQuestion objects
        return obj.questions.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['id', 'user', 'score', 'percentage', 'created_at']