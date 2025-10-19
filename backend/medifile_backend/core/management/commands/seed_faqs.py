from django.core.management.base import BaseCommand
from core.models import FAQ


class Command(BaseCommand):
    help = "Seed FAQs (idempotent)"

    def handle(self, *args, **options):
        faqs = [
            # General
            {"question": "What is MediFile?", "answer": "MediFile is a digital health platform for appointments, messaging, pharmacy orders, and managing your medical data.", "category": "general", "order": 1},
            {"question": "Which platforms are supported?", "answer": "MediFile supports Android (Expo Go), iOS (Expo Go), and Web.", "category": "general", "order": 2},

            # Accounts & Authentication
            {"question": "How do I create an account?", "answer": "Use the Register option in the app or POST /api/auth/register/ with your details.", "category": "account", "order": 1},
            {"question": "How do I sign in?", "answer": "Use your email and password. The app uses JWT via /api/auth/token/ for authentication.", "category": "authentication", "order": 2},
            {"question": "How do I reset my password?", "answer": "From the login screen choose Forgot Password (if enabled) or contact support.", "category": "account", "order": 3},
            {"question": "What roles exist in MediFile?", "answer": "Admin, Doctor, Patient, and Nurse roles are supported with different permissions.", "category": "account", "order": 4},

            # Profile & Settings
            {"question": "Where can I update my profile?", "answer": "Go to Profile to update name, contact details, and preferences.", "category": "profile", "order": 1},
            {"question": "How do privacy settings work?", "answer": "You can control profile visibility, contact sharing, analytics, and chat requests in Settings.", "category": "privacy", "order": 2},

            # Appointments & Doctors
            {"question": "How do I book a doctor appointment?", "answer": "Go to Appointments, pick a doctor and available slot, then confirm the booking.", "category": "appointments", "order": 1},
            {"question": "Can I see available time slots?", "answer": "Yes. Each doctor has a list of available slots you can select from.", "category": "appointments", "order": 2},
            {"question": "How do I cancel or reschedule an appointment?", "answer": "Open the appointment details and use the cancel/reschedule option if allowed.", "category": "appointments", "order": 3},
            {"question": "How are doctors verified?", "answer": "Doctors provide license numbers and are reviewed by admins before activation.", "category": "doctors", "order": 1},
            {"question": "How do I choose a hospital?", "answer": "Doctors may be affiliated with hospitals. You can filter by hospital in the listings.", "category": "hospitals", "order": 1},

            # Messaging & Notifications
            {"question": "Can I chat with my doctor?", "answer": "Yes. Use Messages to communicate with your assigned doctor.", "category": "messaging", "order": 1},
            {"question": "Are notifications supported?", "answer": "Yes. You receive alerts for new messages, appointments, and order updates.", "category": "notifications", "order": 1},

            # Pharmacy & Medicines
            {"question": "How do I order medication from the pharmacy?", "answer": "Open Pharmacy, add items to cart, then checkout to place an order.", "category": "pharmacy", "order": 1},
            {"question": "Do I need a prescription?", "answer": "Some medicines require a prescription. The product page indicates if it's required.", "category": "pharmacy", "order": 2},
            {"question": "Can I track my pharmacy order?", "answer": "Yes. Check Orders for status updates like pending, confirmed, shipped, or delivered.", "category": "orders", "order": 1},

            # Payments & Billing
            {"question": "What payment methods do you support?", "answer": "Major cards and selected digital wallets are supported.", "category": "payments", "order": 1},
            {"question": "Is my payment information stored securely?", "answer": "Yes. Sensitive details are encrypted and masked; only necessary information is stored.", "category": "payments", "order": 2},
            {"question": "Can I save multiple payment methods?", "answer": "Yes. You can add multiple payment methods and set a default one.", "category": "payments", "order": 3},

            # Medical Records
            {"question": "What medical data can I view?", "answer": "You can view vitals, lab results, medications, medical history, and prescriptions.", "category": "medical_records", "order": 1},
            {"question": "Who can see my medical data?", "answer": "Only you and authorized providers. You can adjust sharing in Privacy Settings.", "category": "privacy", "order": 3},
            {"question": "Can I download my data?", "answer": "Contact support to request a data export if self-service is unavailable.", "category": "data", "order": 1},

            # Security
            {"question": "Is my data secure?", "answer": "MediFile uses secure authentication, role-based access control, and safeguards for sensitive data.", "category": "security", "order": 1},
            {"question": "Do you support two-factor authentication (2FA)?", "answer": "2FA may be enabled for certain accounts. Check Security settings if available.", "category": "security", "order": 2},

            # Ambulance & Emergency
            {"question": "How do I request an ambulance?", "answer": "Use the Emergency feature to share your location and request immediate assistance.", "category": "ambulance", "order": 1},
            {"question": "How is my location used in emergencies?", "answer": "Your shared coordinates help route responders and may be linked to a nearby hospital.", "category": "ambulance", "order": 2},

            # Troubleshooting & Support
            {"question": "I can’t log in—what should I do?", "answer": "Check your email/password, reset your password, or contact support if issues persist.", "category": "troubleshooting", "order": 1},
            {"question": "Why do I see ‘Authentication credentials were not provided’?", "answer": "Your session expired or you are accessing a protected API without a token. Sign in again.", "category": "troubleshooting", "order": 2},
            {"question": "How do I contact support?", "answer": "Use Support in the app to open a ticket, or email the support address listed in the app.", "category": "support", "order": 1},

            # Admin & Web
            {"question": "How do admins manage content?", "answer": "Admins can use the Django admin site to manage users, doctors, hospitals, and pharmacy items.", "category": "admin", "order": 1},
            {"question": "Why is the admin site missing styles?", "answer": "In production, static files are collected and served; ensure collectstatic is run and static hosting is configured.", "category": "admin", "order": 2},

            # Mobile & Connectivity
            {"question": "The app can’t reach the backend—what now?", "answer": "Confirm your API URL, internet connection, and try switching Expo connection to Tunnel.", "category": "troubleshooting", "order": 3},
            {"question": "How do updates reach my app?", "answer": "Over-the-air updates may be delivered via Expo EAS for compatible changes.", "category": "mobile", "order": 1},
        ]

        created = 0
        updated = 0
        for data in faqs:
            obj, was_created = FAQ.objects.update_or_create(
                question=data["question"],
                defaults={
                    "answer": data["answer"],
                    "category": data.get("category", "general"),
                    "is_active": True,
                    "order": data.get("order", 0),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"FAQs seeded. Created: {created}, Updated: {updated}"))


