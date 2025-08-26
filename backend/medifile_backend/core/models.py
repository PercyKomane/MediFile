from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

# ------------------------------
# Custom user model & manager
# ------------------------------

class UserManager(BaseUserManager):
    """Custom manager for the User model using email as the username."""

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("The email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hash the password
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Core user model with role-based access control."""

    class Role(models.TextChoices):
        ADMIN = "admin", _("Admin")
        DOCTOR = "doctor", _("Doctor")
        PATIENT = "patient", _("Patient")
        NURSE = "nurse", _("Nurse")

    user_id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    objects = UserManager()

    USERNAME_FIELD = "email"  # Use email instead of username
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self) -> str:
        return self.email


class UserProfile(models.Model):
    """Profile details linked one-to-one with User."""

    profile_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile", db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "user_profiles"
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"


# ------------------------------
# Privacy Settings
# ------------------------------

class PrivacySettings(models.Model):
    """Per-user privacy preferences exposed in the Profile > Settings UI."""

    settings_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="privacy_settings", db_index=True)

    # Visibility controls
    show_profile_to_doctors = models.BooleanField(default=True)
    show_contact_info_to_doctors = models.BooleanField(default=False)

    # Communications & data use
    allow_marketing_emails = models.BooleanField(default=False)
    share_anonymized_analytics = models.BooleanField(default=False)

    # Interactions
    allow_chat_requests = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "privacy_settings"

    def __str__(self) -> str:
        return f"PrivacySettings for {self.user.email}"


# ------------------------------
# Patient records
# ------------------------------

class Patient(models.Model):
    """Basic medical metadata about the patient."""

    patient_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient", db_index=True)
    blood_type = models.CharField(max_length=3, blank=True)
    allergies = models.TextField(blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    insurance_provider = models.CharField(max_length=150, blank=True)

    class Meta:
        db_table = "patients"

    def __str__(self) -> str:
        return f"Patient #{self.patient_id} ({self.user.email})"


class MedicalHistory(models.Model):
    """Each row records one diagnosis/treatment."""

    record_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="medical_history")
    diagnosis = models.TextField()
    treatment = models.TextField(blank=True)
    date_recorded = models.DateField(default=timezone.now)
    doctor_id = models.ForeignKey("Doctor", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "medical_history"
        ordering = ["-date_recorded"]

    def __str__(self) -> str:
        return f"History #{self.record_id} for {self.patient}"


# ------------------------------
# Healthcare providers
# ------------------------------

class Hospital(models.Model):
    """Organization that employs doctors."""

    hospital_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    address = models.TextField()
    contact_number = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    class Meta:
        db_table = "hospitals"
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"

    def __str__(self) -> str:
        return self.name


class Doctor(models.Model):
    """Doctor is a user with specialization, license, and hospital affiliation."""

    doctor_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="doctor", db_index=True)
    specialization = models.CharField(max_length=150)
    license_number = models.CharField(max_length=100, unique=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, related_name="doctors")

    class Meta:
        db_table = "doctors"

    def __str__(self) -> str:
        return f"Dr. {self.user.profile.last_name} ({self.specialization})"


# ------------------------------
# Appointments & Scheduling
# ------------------------------

class Slot(models.Model):
    """Each doctor's available time slot."""

    slot_id = models.BigAutoField(primary_key=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="slots", db_index=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = "slots"
        ordering = ["start_time"]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "start_time", "end_time"], name="unique_slot")
        ]

    def __str__(self) -> str:
        return f"{self.doctor} | {self.start_time:%Y-%m-%d %H:%M} – {self.end_time:%H:%M}"


class Appointment(models.Model):
    """Scheduled interaction between doctor and patient."""

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", _("Scheduled")
        COMPLETED = "completed", _("Completed")
        CANCELED = "canceled", _("Canceled")

    appointment_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="appointments")
    date_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "appointments"
        ordering = ["-date_time"]

    def __str__(self) -> str:
        return f"Appt #{self.appointment_id} ({self.status})"


# ------------------------------
# Prescriptions & Medications
# ------------------------------

class Medication(models.Model):
    """List of known medications."""

    medication_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    manufacturer = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "medications"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Prescription(models.Model):
    """Issued by a doctor to a patient."""

    prescription_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="prescriptions")
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="prescriptions")
    issue_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "prescriptions"
        ordering = ["-issue_date"]

    def __str__(self) -> str:
        return f"Prescription #{self.prescription_id} for {self.patient}"


class PrescriptionItem(models.Model):
    """A single line item in a prescription."""

    item_id = models.BigAutoField(primary_key=True)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="items")
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)

    class Meta:
        db_table = "prescription_items"

    def __str__(self) -> str:
        return f"{self.medication_name} ({self.dosage})"


# ------------------------------
# Security & Auditing
# ------------------------------

class AuditLog(models.Model):
    """Track important user actions in the system."""

    class Action(models.TextChoices):
        LOGIN = "login", _("Login")
        RECORD_ACCESS = "record_access", _("Record Access")
        EDIT = "edit", _("Edit")

    log_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"{self.action} by {self.user} at {self.timestamp}"


class AccessToken(models.Model):
    """Token record for session validation or JWT revocation."""

    token_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tokens")
    token = models.CharField(max_length=512, unique=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "access_tokens"
        indexes = [models.Index(fields=["expires_at"])]

    def __str__(self) -> str:
        return f"Token for {self.user.email} expiring {self.expires_at}"


# ------------------------------
# Account Security (2FA & backup codes)
# ------------------------------

class AccountSecurity(models.Model):
    """Per-user security state, including TOTP and backup codes."""

    security_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account_security", db_index=True)

    is_totp_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, null=True, blank=True)
    # Store hashed backup codes (using Django's password hasher) as JSON array in text
    backup_code_hashes = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "account_security"

    def __str__(self) -> str:
        return f"AccountSecurity for {self.user.email}"

# ------------------------------
# Conversations & Messages
# ------------------------------

class Conversation(models.Model):
    """One conversation between a patient and a doctor."""

    conversation_id = models.BigAutoField(primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="conversations", db_index=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="conversations", db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "conversations"
        constraints = [
            models.UniqueConstraint(fields=["patient", "doctor"], name="unique_conversation_patient_doctor")
        ]

    def __str__(self) -> str:
        return f"Conv #{self.conversation_id} P:{self.patient_id} D:{self.doctor_id}"


class Message(models.Model):
    """Single chat message inside a conversation."""

    message_id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages", db_index=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages", db_index=True)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Msg #{self.message_id} -> Conv {self.conversation_id}"


# ------------------------------
# Payment Methods
# ------------------------------

class PaymentMethod(models.Model):
    """User payment methods for transactions."""
    
    class PaymentType(models.TextChoices):
        CARD = "card", _("Credit/Debit Card")
        BANK = "bank", _("Bank Account")
        WALLET = "wallet", _("Digital Wallet")
    
    payment_method_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_methods", db_index=True)
    type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.CARD)
    name = models.CharField(max_length=255)  # Name on card/account
    masked_number = models.CharField(max_length=50)  # **** **** **** 1234
    encrypted_number = models.TextField(blank=True, null=True)  # Encrypted actual number
    expiry_date = models.CharField(max_length=10, blank=True, null=True)  # MM/YY for cards
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "payment_methods"
        ordering = ["-is_default", "-created_at"]
    
    def __str__(self) -> str:
        return f"{self.name} - {self.masked_number}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default payment method per user
        if self.is_default:
            PaymentMethod.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

# ------------------------------
# Emergency Ambulance Requests
# ------------------------------

class AmbulanceRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", _("Requested")
        ACCEPTED = "accepted", _("Accepted")
        ENROUTE = "enroute", _("En route")
        ARRIVED = "arrived", _("Arrived")
        CANCELLED = "cancelled", _("Cancelled")

    request_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ambulance_requests", db_index=True)
    note = models.TextField(blank=True)
    audio_file = models.FileField(upload_to="ambulance_recordings/", null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    assigned_hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name="ambulance_requests")
    eta_minutes = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ambulance_requests"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"AmbulanceRequest #{self.request_id} - {self.status}"

# ------------------------------
# FAQ models
# ------------------------------

class FAQ(models.Model):
    """Frequently Asked Questions."""
    
    faq_id = models.BigAutoField(primary_key=True)
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100, default='general')  # general, pharmacy, appointments, etc.
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)  # For ordering questions
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "faqs"
        ordering = ["order", "created_at"]
    
    def __str__(self) -> str:
        return f"FAQ #{self.faq_id}: {self.question[:50]}..."


class UserQuestion(models.Model):
    """Questions asked by users."""
    
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        ANSWERED = "answered", _("Answered")
        CLOSED = "closed", _("Closed")
    
    question_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="questions", db_index=True)
    question = models.TextField()
    answer = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True, null=True)  # Internal notes for admins
    created_at = models.DateTimeField(default=timezone.now)
    answered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = "user_questions"
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"User Question #{self.question_id}: {self.question[:50]}..."


# ------------------------------
# Pharmacy models
# ------------------------------

class Medicine(models.Model):
    """Medicine/Pharmaceutical products."""

    medicine_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    dosage_form = models.CharField(max_length=100)  # tablet, syrup, injection, etc.
    strength = models.CharField(max_length=100)  # 500mg, 10ml, etc.
    manufacturer = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.IntegerField(default=0)
    image_url = models.URLField(blank=True)
    is_prescription_required = models.BooleanField(default=False)
    category = models.CharField(max_length=100)  # pain relief, antibiotics, etc.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "medicines"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} - {self.strength}"

    @property
    def is_on_sale(self):
        return self.original_price and self.original_price > self.price


class Cart(models.Model):
    """Shopping cart for pharmacy items."""

    cart_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="carts", db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "carts"

    def __str__(self) -> str:
        return f"Cart for {self.user.email}"

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    """Individual items in a shopping cart."""

    cart_item_id = models.BigAutoField(primary_key=True)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items", db_index=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="cart_items", db_index=True)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "cart_items"
        unique_together = ["cart", "medicine"]

    def __str__(self) -> str:
        return f"{self.quantity}x {self.medicine.name}"

    @property
    def subtotal(self):
        return self.medicine.price * self.quantity


# ------------------------------
# Support: Help & Support Tickets
# ------------------------------

class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", _("Open")
        IN_PROGRESS = "in_progress", _("In Progress")
        RESOLVED = "resolved", _("Resolved")
        CLOSED = "closed", _("Closed")

    class Priority(models.TextChoices):
        LOW = "low", _("Low")
        MEDIUM = "medium", _("Medium")
        HIGH = "high", _("High")

    ticket_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="support_tickets", db_index=True)
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_tickets"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Ticket #{self.ticket_id}: {self.subject}"


class SupportReply(models.Model):
    reply_id = models.BigAutoField(primary_key=True)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="replies", db_index=True)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "support_replies"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Reply #{self.reply_id} on Ticket {self.ticket_id}"


class Order(models.Model):
    """Pharmacy orders."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        CONFIRMED = "confirmed", _("Confirmed")
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        CANCELLED = "cancelled", _("Cancelled")

    order_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders", db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.JSONField(default=dict)
    delivery_option = models.CharField(max_length=20, default="standard")
    payment_method = models.CharField(max_length=50, default="card")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Order {self.order_id} - {self.user.email}"


class OrderItem(models.Model):
    """Individual items in an order."""

    order_item_id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", db_index=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="order_items", db_index=True)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"

    def __str__(self) -> str:
        return f"{self.quantity}x {self.medicine.name}"

