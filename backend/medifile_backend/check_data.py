#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')
django.setup()

from core.models import User, Doctor, Patient, Appointment, UserProfile

print("=== DATABASE CONTENT CHECK ===")

# Check Users
print(f"\nUsers: {User.objects.count()}")
for user in User.objects.all():
    print(f"  - {user.email} (role: {user.role})")

# Check Doctors
print(f"\nDoctors: {Doctor.objects.count()}")
for doctor in Doctor.objects.all():
    print(f"  - Doctor ID: {doctor.doctor_id}, User: {doctor.user.email}")

# Check Patients
print(f"\nPatients: {Patient.objects.count()}")
for patient in Patient.objects.all():
    print(f"  - Patient ID: {patient.patient_id}, User: {patient.user.email}")

# Check Appointments
print(f"\nAppointments: {Appointment.objects.count()}")
for appt in Appointment.objects.all():
    print(f"  - Appointment ID: {appt.appointment_id}")
    print(f"    Patient: {appt.patient.patient_id} ({appt.patient.user.email})")
    print(f"    Doctor: {appt.doctor.doctor_id} ({appt.doctor.user.email})")
    print(f"    Status: {appt.status}")
    print(f"    Notes: {appt.notes[:50]}...")

# Check specific doctor's appointments
if Doctor.objects.exists():
    doctor = Doctor.objects.first()
    print(f"\n=== Appointments for Doctor {doctor.doctor_id} ({doctor.user.email}) ===")
    appointments = Appointment.objects.filter(doctor=doctor)
    print(f"Total appointments: {appointments.count()}")
    
    for appt in appointments:
        print(f"  - Appt {appt.appointment_id}: Patient {appt.patient.patient_id}, Status: {appt.status}")

print("\n=== END CHECK ===")




