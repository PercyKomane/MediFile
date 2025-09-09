from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from core.models import User, Patient, VitalSign, LabResult, SymptomEntry, DnaTest, PatientMedicationRecord, MedicalHistory


class Command(BaseCommand):
    help = "Seed demo medical records (vitals, labs, symptoms, DNA, medications, history) for a patient by email"

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Patient user email')

    def handle(self, *args, **options):
        email = options['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f"User with email {email} does not exist")

        if not hasattr(user, 'patient'):
            raise CommandError(f"User {email} is not a patient")

        patient: Patient = user.patient

        # Seed Medical History (diagnoses/allergies)
        history_payloads = [
            {"diagnosis": "Peanuts Allergies", "treatment": "Avoid peanuts"},
            {"diagnosis": "Pollen Allergy", "treatment": "Antihistamines as needed"},
            {"diagnosis": "Type 2 Diabetes", "treatment": "Lifestyle changes, metformin"},
        ]
        for item in history_payloads:
            MedicalHistory.objects.get_or_create(
                patient=patient,
                diagnosis=item["diagnosis"],
                defaults={
                    "treatment": item.get("treatment", ""),
                    "date_recorded": timezone.now().date(),
                },
            )

        # Seed Vital Signs (recent ~20 readings)
        base_dt = timezone.now()
        for i in range(20, 0, -1):
            # Create subtle variation over days
            temp = 36.5 + (i % 6) * 0.1  # 36.5 - 37.0
            sys = 115 + (i % 8) * 2      # 115 - 129
            dia = 72 + (i % 6) * 2       # 72 - 82
            hr  = 68 + (i % 7) * 2       # 68 - 80
            VitalSign.objects.get_or_create(
                patient=patient,
                recorded_at=base_dt - timezone.timedelta(days=i),
                defaults={
                    "temperature_c": round(temp, 1),
                    "systolic_bp": sys,
                    "diastolic_bp": dia,
                    "heart_rate_bpm": hr,
                },
            )

        # Seed Lab Results
        lab_payloads = [
            {"test_name": "HbA1c", "result_value": "6.8", "units": "%", "reference_range": "< 5.7"},
            {"test_name": "Fasting Glucose", "result_value": "6.1", "units": "mmol/L", "reference_range": "3.9-5.6"},
            {"test_name": "Total Cholesterol", "result_value": "4.9", "units": "mmol/L", "reference_range": "< 5.0"},
        ]
        for lp in lab_payloads:
            LabResult.objects.get_or_create(
                patient=patient,
                test_name=lp["test_name"],
                recorded_at=timezone.now().date(),
                defaults={
                    "result_value": lp["result_value"],
                    "units": lp.get("units", ""),
                    "reference_range": lp.get("reference_range", ""),
                },
            )

        # Seed Symptoms
        symptoms_payloads = [
            {"description": "Headache", "severity": SymptomEntry.Severity.MILD},
            {"description": "Fatigue", "severity": SymptomEntry.Severity.MODERATE},
        ]
        for sp in symptoms_payloads:
            SymptomEntry.objects.get_or_create(
                patient=patient,
                description=sp["description"],
                defaults={
                    "severity": sp["severity"],
                    "onset_date": timezone.now().date(),
                },
            )

        # Seed DNA Tests
        dna_payloads = [
            {"test_name": "APOE Genotype", "trait": "Lipid metabolism", "interpretation": "E3/E3 (neutral risk)"},
            {"test_name": "MTHFR Variant", "trait": "Folate metabolism", "interpretation": "Heterozygous variant"},
        ]
        for dp in dna_payloads:
            DnaTest.objects.get_or_create(
                patient=patient,
                test_name=dp["test_name"],
                defaults={
                    "trait": dp.get("trait", ""),
                    "interpretation": dp.get("interpretation", ""),
                    "recorded_at": timezone.now().date(),
                },
            )

        # Seed Patient Medications
        meds_payloads = [
            {"name": "Metformin", "dosage": "500mg", "frequency": "2x/day", "is_active": True},
            {"name": "Cetirizine", "dosage": "10mg", "frequency": "1x/day PRN", "is_active": True},
        ]
        for mp in meds_payloads:
            PatientMedicationRecord.objects.get_or_create(
                patient=patient,
                name=mp["name"],
                start_date=timezone.now().date(),
                defaults={
                    "dosage": mp.get("dosage", ""),
                    "frequency": mp.get("frequency", ""),
                    "is_active": mp.get("is_active", True),
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded records for {email}"))


