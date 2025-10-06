from rest_framework import serializers
from django.db import IntegrityError
from .models import (
    User, UserProfile, Patient, Doctor, Hospital,
    Appointment, Slot, Medication, Prescription,
    PrescriptionItem, AuditLog, AccessToken,
    Conversation, Message, Medicine, Cart, CartItem, Order, OrderItem, PaymentMethod,
    FAQ, UserQuestion, AmbulanceRequest, PrivacySettings, AccountSecurity, SupportTicket, SupportReply,
    VitalSign, LabResult, SymptomEntry, DnaTest, PatientMedicationRecord,
)

# --------------------------
# User & Profile Serializers
# --------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    first_name = serializers.CharField(required=False, max_length=150, write_only=True)
    last_name = serializers.CharField(required=False, max_length=150, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'email', 'role', 'is_active', 'created_at', 'profile', 
                 'first_name', 'last_name', 'phone', 'address', 'date_of_birth']
        read_only_fields = ['user_id', 'created_at', 'email', 'role']

    def to_representation(self, instance):
        """Custom representation to include profile fields directly"""
        data = super().to_representation(instance)
        if hasattr(instance, 'profile') and instance.profile:
            data['first_name'] = instance.profile.first_name
            data['last_name'] = instance.profile.last_name
            data['phone'] = instance.profile.phone
            data['address'] = instance.profile.address
            data['date_of_birth'] = instance.profile.date_of_birth
        return data

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        user = User.objects.create_user(**validated_data)
        if profile_data:
            UserProfile.objects.create(user=user, **profile_data)
        return user

    def validate(self, data):
        """Custom validation to handle empty strings for date_of_birth"""
        if 'date_of_birth' in data and data['date_of_birth'] == '':
            data['date_of_birth'] = None
        return data

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Handle profile fields
        profile_fields = ['first_name', 'last_name', 'phone', 'address', 'date_of_birth']
        profile_updates = {}
        
        for field in profile_fields:
            if field in validated_data:
                profile_updates[field] = validated_data.pop(field)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile
        if profile_data or profile_updates:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            if profile_data:
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
            for attr, value in profile_updates.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
# --------------------------
# Auth: Registration
# --------------------------

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=User.Role.choices)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def create(self, validated_data):
        profile_data = {
            "first_name": validated_data.pop("first_name"),
            "last_name": validated_data.pop("last_name"),
            "phone": validated_data.pop("phone", ""),
            "address": validated_data.pop("address", ""),
            "date_of_birth": validated_data.pop("date_of_birth", None),
        }
        password = validated_data.pop("password")
        try:
            user = User.objects.create_user(password=password, **validated_data)
        except IntegrityError:
            raise serializers.ValidationError({"email": "Email already registered"})
        UserProfile.objects.create(user=user, **profile_data)

        # Create related role record shells
        if user.role == User.Role.PATIENT:
            Patient.objects.get_or_create(user=user)
        elif user.role == User.Role.DOCTOR:
            Doctor.objects.get_or_create(user=user, defaults={"specialization": "General", "license_number": f"LIC-{user.user_id}"})

        return user

    def to_representation(self, instance):
        # instance is a User returned from create(); serialize with UserSerializer
        return UserSerializer(instance).data


# --------------------------
# Messaging
# --------------------------

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source="sender.email")

    class Meta:
        model = Message
        fields = [
            "message_id",
            "conversation",
            "sender",
            "sender_email",
            "text",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["sender", "created_at", "is_read"]



# --------------------------
# Patient & Doctor
# --------------------------

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Patient
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        patient = Patient.objects.create(user=user, **validated_data)
        return patient


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['hospital_id', 'name', 'address', 'contact_number', 'latitude', 'longitude']


class AmbulanceRequestSerializer(serializers.ModelSerializer):
    assigned_hospital = HospitalSerializer(read_only=True)
    audio_file_url = serializers.SerializerMethodField()

    class Meta:
        model = AmbulanceRequest
        fields = [
            'request_id', 'user', 'note', 'audio_file', 'audio_file_url', 'latitude', 'longitude',
            'status', 'assigned_hospital', 'eta_minutes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'assigned_hospital', 'eta_minutes', 'created_at', 'updated_at']
        extra_kwargs = {
            'audio_file': {'write_only': True, 'required': False, 'allow_null': True},
        }

    def get_audio_file_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request') if hasattr(self, 'context') else None
            try:
                return request.build_absolute_uri(obj.audio_file.url) if request else obj.audio_file.url
            except Exception:
                return None
        return None


class CreateAmbulanceRequestSerializer(serializers.ModelSerializer):
    latitude = serializers.CharField(required=False, allow_blank=True)
    longitude = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = AmbulanceRequest
        fields = ['note', 'audio_file', 'latitude', 'longitude']

    def validate(self, attrs):
        lat = attrs.get('latitude')
        lon = attrs.get('longitude')
        def parse_num(val):
            if val in (None, ''):
                return None
            try:
                return float(val)
            except Exception:
                raise serializers.ValidationError({'latitude/longitude': 'Invalid coordinates'})
        if 'latitude' in attrs:
            attrs['latitude'] = parse_num(lat)
        if 'longitude' in attrs:
            attrs['longitude'] = parse_num(lon)
        return attrs


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    hospital = HospitalSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        doctor = Doctor.objects.create(user=user, **validated_data)
        return doctor


# --------------------------
# Appointments & Scheduling
# --------------------------

class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient = PatientSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = '__all__'


# --------------------------
# Prescriptions & Medications
# --------------------------

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'


class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, required=False)

    class Meta:
        model = Prescription
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        prescription = Prescription.objects.create(**validated_data)
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
        return prescription


# --------------------------
# Security & Tokens
# --------------------------

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


class AccessTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessToken
        fields = '__all__'


# --------------------------
# Medical History
# --------------------------

from .models import MedicalHistory

class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'


# --------------------------
# Additional Records
# --------------------------

class VitalSignSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSign
        fields = '__all__'
        read_only_fields = ['patient']


class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'
        read_only_fields = ['patient']


class SymptomEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SymptomEntry
        fields = '__all__'
        read_only_fields = ['patient']


class DnaTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DnaTest
        fields = '__all__'
        read_only_fields = ['patient']


class PatientMedicationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientMedicationRecord
        fields = '__all__'
        read_only_fields = ['patient']


# --------------------------
# Pharmacy Serializers
# --------------------------

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'


class CartItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'payment_method_id', 'type', 'name', 'masked_number', 
            'encrypted_number', 'expiry_date', 'is_default', 'is_active', 'created_at'
        ]
        read_only_fields = ['payment_method_id', 'masked_number', 'created_at']
        extra_kwargs = {
            'encrypted_number': {'write_only': True}
        }

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


# --------------------------
# FAQ Serializers
# --------------------------

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'


class UserQuestionSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = UserQuestion
        fields = [
            'question_id', 'question', 'answer', 'status', 
            'created_at', 'answered_at', 'user_email'
        ]
        read_only_fields = ['question_id', 'status', 'created_at', 'answered_at', 'user_email']


class CreateUserQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserQuestion
        fields = ['question']


# --------------------------
# Privacy Settings
# --------------------------

class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacySettings
        fields = [
            'settings_id',
            'show_profile_to_doctors',
            'show_contact_info_to_doctors',
            'allow_marketing_emails',
            'share_anonymized_analytics',
            'allow_chat_requests',
        ]
        read_only_fields = ['settings_id']


# --------------------------
# Account Security
# --------------------------

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        from django.contrib.auth.hashers import check_password
        if not check_password(attrs['current_password'], user.password):
            raise serializers.ValidationError({'current_password': 'Incorrect password'})
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class AccountSecuritySerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountSecurity
        fields = [
            'security_id',
            'is_totp_enabled',
            # Do not expose totp_secret or backup_code_hashes
        ]
        read_only_fields = ['security_id', 'is_totp_enabled']


# --------------------------
# Support: Tickets & Replies
# --------------------------

class SupportReplySerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')

    class Meta:
        model = SupportReply
        fields = ['reply_id', 'message', 'created_at', 'sender_email']
        read_only_fields = ['reply_id', 'created_at', 'sender_email']


class SupportTicketSerializer(serializers.ModelSerializer):
    replies = SupportReplySerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'ticket_id', 'subject', 'category', 'message', 'status', 'priority', 'created_at', 'updated_at', 'replies'
        ]
        read_only_fields = ['ticket_id', 'status', 'created_at', 'updated_at', 'replies']

    def create(self, validated_data):
        user = self.context['request'].user
        return SupportTicket.objects.create(user=user, **validated_data)
