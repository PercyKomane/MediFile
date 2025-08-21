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


