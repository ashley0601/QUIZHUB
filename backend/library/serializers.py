from rest_framework import serializers
from .models import Lesson, SavedItem

class LessonSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    is_owner = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'subject', 'description', 'file', 'file_type', 
            'created_by', 'created_by_username', 'created_at', 'updated_at', 
            'visibility', 'is_owner', 'file_url' 
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'file_type']
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.created_by == request.user
        return False
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class SavedItemSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=["quiz", "lesson"])
    item_id = serializers.IntegerField()

    def create(self, validated_data):
        request = self.context.get('request')
        # get_or_create prevents duplicate saves cleanly
        item, created = SavedItem.objects.get_or_create(
            user=request.user,
            item_type=validated_data['item_type'],
            item_id=validated_data['item_id']
        )
        return item

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'item_type': instance.item_type,
            'item_id': instance.item_id,
            'created_at': instance.created_at
        }