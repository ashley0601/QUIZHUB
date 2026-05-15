from rest_framework import serializers
from .models import User
from quiz.models import Subject

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'unique_id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile_picture']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords didn't match."})
        return attrs

    def create(self, validated_data):
        # sourcery skip: inline-immediately-returned-variable
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'student')
        )
        return user

class SubjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    quiz_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_by_name', 'created_at', 'updated_at', 'is_active', 'quiz_count']
        read_only_fields = ['created_at', 'updated_at', 'created_by_name', 'quiz_count']

    def get_quiz_count(self, obj):
        return obj.quizzes.count()

class SubjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['name', 'description']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class SubjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['name', 'description', 'is_active']