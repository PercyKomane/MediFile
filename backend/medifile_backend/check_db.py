import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')
django.setup()

from core.models import Doctor, Conversation, Message, User

print(f'Users: {User.objects.count()}')
print(f'Doctors: {Doctor.objects.count()}')
print(f'Conversations: {Conversation.objects.count()}')
print(f'Messages: {Message.objects.count()}')

# List first few doctors
doctors = Doctor.objects.all()[:5]
for doc in doctors:
    print(f'  Doctor: {doc.user.email} - {doc.specialization}')

# List conversations
convs = Conversation.objects.all()[:5]
for conv in convs:
    print(f'  Conversation {conv.pk}: Patient {conv.patient_id} with Doctor {conv.doctor_id}')
