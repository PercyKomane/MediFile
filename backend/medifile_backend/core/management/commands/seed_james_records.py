from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import (
    User,
    Patient,
    MedicalHistory,
    VitalSign,
    LabResult,
    SymptomEntry,
    DnaTest,
    PatientMedicationRecord,
    Doctor,
    Hospital,
    Prescription,
    PrescriptionItem,
)


class Command(BaseCommand):
    help = "Seed demo medical records for patient James Bond (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            dest="email",
            default="james@gmail.com",
            help="Email of the user for whom to seed records",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User with email {email} not found"))
            return

        patient, _ = Patient.objects.get_or_create(user=user)

        # Basic patient info
        if not patient.blood_type:
            patient.blood_type = "O+"
        if not patient.allergies:
            patient.allergies = "Peanuts, Pollen"
        if not patient.height:
            patient.height = 178
        if not patient.weight:
            patient.weight = 80
        patient.save()

        # Medical history (diagnoses)
        mh_items = [
            ("Peanuts Allergies", "Avoid peanuts", date.today() - timedelta(days=365 * 10)),
            ("Pollen Allergy", "Antihistamines as needed", date.today() - timedelta(days=365 * 5)),
            ("Diabetes", "Metformin 500mg BID", date.today() - timedelta(days=365)),
        ]
        for diag, treat, when in mh_items:
            MedicalHistory.objects.update_or_create(
                patient=patient,
                diagnosis=diag,
                defaults={"treatment": treat, "date_recorded": when},
            )

        # Vitals
        VitalSign.objects.update_or_create(
            patient=patient,
            recorded_at=date.today(),
            defaults={
                "temperature_c": 36.7,
                "systolic_bp": 120,
                "diastolic_bp": 78,
                "heart_rate_bpm": 72,
                "notes": "Routine check",
            },
        )

        # Lab results
        lab_items = [
            ("HbA1c", "7.2", "%", "4.0 - 5.6", date.today() - timedelta(days=30)),
            ("Fasting Glucose", "6.8", "mmol/L", "3.9 - 5.5", date.today() - timedelta(days=60)),
            ("Total Cholesterol", "4.8", "mmol/L", "< 5.0", date.today() - timedelta(days=120)),
        ]
        for name, value, units, ref, when in lab_items:
            LabResult.objects.update_or_create(
                patient=patient,
                test_name=name,
                recorded_at=when,
                defaults={
                    "result_value": value,
                    "units": units,
                    "reference_range": ref,
                },
            )

        # Symptoms
        SymptomEntry.objects.update_or_create(
            patient=patient,
            description="Seasonal sneezing and itchy eyes",
            onset_date=date.today() - timedelta(days=14),
            defaults={"severity": SymptomEntry.Severity.MILD, "notes": "Worse outdoors"},
        )

        # DNA tests
        DnaTest.objects.update_or_create(
            patient=patient,
            test_name="Lactose Intolerance",
            defaults={"trait": "Likely intolerant", "interpretation": "Consider lactase supplements"},
        )

        # Medications
        meds = [
            ("Metformin", "500 mg", "Twice daily", True),
            ("Loratadine", "10 mg", "Once daily as needed", False),
        ]
        for name, dose, freq, active in meds:
            PatientMedicationRecord.objects.update_or_create(
                patient=patient,
                name=name,
                defaults={
                    "dosage": dose,
                    "frequency": freq,
                    "is_active": active,
                },
            )

        # Prescriptions aligned to conditions
        # Pick an existing doctor, otherwise create a simple demo doctor
        doctor = Doctor.objects.first()
        if doctor is None:
            # minimal demo doctor + hospital
            hosp, _ = Hospital.objects.get_or_create(
                name="MediFile General Hospital",
                defaults={"address": "123 Health St", "contact_number": "+27 11 000 0000"},
            )
            # create a user for doctor
            doc_user, _ = User.objects.get_or_create(
                email="dr.demo@medifile.com",
                defaults={"role": "doctor"},
            )
            doctor = Doctor.objects.create(
                user=doc_user,
                specialization="General Practitioner",
                license_number="DEMO-LIC-001",
                hospital=hosp,
            )

        # Diabetes prescription: Metformin
        diabetes_rx, _ = Prescription.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            notes="Diabetes management",
            defaults={
                "issue_date": date.today() - timedelta(days=30),
                "expiry_date": date.today() + timedelta(days=60),
            },
        )
        PrescriptionItem.objects.update_or_create(
            prescription=diabetes_rx,
            medication_name="Metformin",
            dosage="500 mg",
            defaults={
                "frequency": "Twice daily",
                "duration": "90 days",
            },
        )

        # Allergy prescription: Loratadine
        allergy_rx, _ = Prescription.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            notes="Allergic rhinitis management",
            defaults={
                "issue_date": date.today() - timedelta(days=10),
                "expiry_date": date.today() + timedelta(days=20),
            },
        )
        PrescriptionItem.objects.update_or_create(
            prescription=allergy_rx,
            medication_name="Loratadine",
            dosage="10 mg",
            defaults={
                "frequency": "Once daily as needed",
                "duration": "30 days",
            },
        )

        self.stdout.write(self.style.SUCCESS(f"Seeded records for patient {user.email}"))


