from django.contrib import admin
from .models import User, UserProfile, Patient, Doctor, Hospital, Appointment, Prescription

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Hospital)
admin.site.register(Appointment)
admin.site.register(Prescription)
