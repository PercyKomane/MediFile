from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import User, UserProfile, Doctor, Hospital


class Command(BaseCommand):
    help = "Seed at least 10 doctors (idempotent). If missing, creates users, profiles, and links to hospitals."

    def add_arguments(self, parser):
        parser.add_argument('--hospital', type=str, default=None, help='Optional hospital name to assign all doctors to')

    def handle(self, *args, **options):
        hospital_name = options.get('hospital')
        hospital = None
        if hospital_name:
            hospital = Hospital.objects.filter(name=hospital_name).first()
            if not hospital:
                self.stdout.write(self.style.WARNING(f"Hospital '{hospital_name}' not found. Doctors will have no hospital assigned."))

        doctors_payload = [
            ("dr.john.smith@example.com", "John", "Smith", "Cardiology", "HPCSA-10001"),
            ("dr.sarah.mhlope@example.com", "Sarah", "Mhlope", "Dermatology", "HPCSA-10002"),
            ("dr.thabo.molefe@example.com", "Thabo", "Molefe", "Orthopedics", "HPCSA-10003"),
            ("dr.lerato.khoza@example.com", "Lerato", "Khoza", "Pediatrics", "HPCSA-10004"),
            ("dr.pieter.botha@example.com", "Pieter", "Botha", "General Surgery", "HPCSA-10005"),
            ("dr.nandi.khumalo@example.com", "Nandi", "Khumalo", "Neurology", "HPCSA-10006"),
            ("dr.mandla.ndlovu@example.com", "Mandla", "Ndlovu", "Oncology", "HPCSA-10007"),
            ("dr.karina.naidoo@example.com", "Karina", "Naidoo", "Endocrinology", "HPCSA-10008"),
            ("dr.sipho.dlamini@example.com", "Sipho", "Dlamini", "Family Medicine", "HPCSA-10009"),
            ("dr.ayanda.zuma@example.com", "Ayanda", "Zuma", "Psychiatry", "HPCSA-10010"),
            ("dr.mpho.mokoena@example.com", "Mpho", "Mokoena", "Ophthalmology", "HPCSA-10011"),
        ]

        created = 0
        updated = 0
        with transaction.atomic():
            for email, first, last, spec, license_no in doctors_payload:
                user, user_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "role": User.Role.DOCTOR,
                        "is_active": True,
                    },
                )
                if user_created:
                    # Set a default password for demo environments
                    user.set_password("Password123!")
                    user.save(update_fields=["password"])

                # Ensure profile exists and is updated
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={"first_name": first, "last_name": last},
                )
                # Update names if changed
                if profile.first_name != first or profile.last_name != last:
                    profile.first_name = first
                    profile.last_name = last
                    profile.save(update_fields=["first_name", "last_name"])

                # Ensure doctor record exists
                doctor, doc_created = Doctor.objects.get_or_create(
                    user=user,
                    defaults={
                        "specialization": spec,
                        "license_number": license_no,
                        "hospital": hospital,
                    },
                )

                # Update fields if changed
                changed = False
                if doctor.specialization != spec:
                    doctor.specialization = spec
                    changed = True
                if doctor.license_number != license_no:
                    doctor.license_number = license_no
                    changed = True
                if hospital and doctor.hospital_id != hospital.pk:
                    doctor.hospital = hospital
                    changed = True
                if changed:
                    doctor.save()
                    updated += 1
                elif doc_created or user_created:
                    created += 1

        self.stdout.write(self.style.SUCCESS(f"Doctors seeded. Created: {created}, Updated: {updated}"))


