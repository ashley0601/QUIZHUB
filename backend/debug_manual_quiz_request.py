import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from rest_framework.parsers import MultiPartParser

factory = APIRequestFactory()

# Simulate a multipart/form-data request with questions JSON string.
questions_json = '[{"text": "What is 2+2?", "question_type": "multiple_choice", "required": true, "choices": [{"text": "3", "is_correct": false}, {"text": "4", "is_correct": true}]}]'

data = {
    'title': 'Test Manual Quiz',
    'description': 'Desc',
    'show_results': 'false',
    'time_per_question': '30',
    'is_public': 'true',
    'questions': questions_json,
}

request = factory.post('/api/manual-quiz/create/', data, format='multipart')
parser = MultiPartParser()
stream, media_type, parsed = parser.parse(request._request, None, {'request': request})
print('parsed type:', type(parsed))
print('parsed keys:', list(parsed.keys()))
print('questions raw:', parsed.get('questions'))
print('questions type:', type(parsed.get('questions')))
print('questions repr:', repr(parsed.get('questions')))
