from django.shortcuts import render
from django.db import models, transaction
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from .models import User, UserProfile, Patient, Doctor, Hospital, Appointment, Prescription, Conversation, Message, MedicalHistory, Medicine, Cart, CartItem, Order, OrderItem, PaymentMethod, FAQ, UserQuestion, AmbulanceRequest, PrivacySettings, AccountSecurity, SupportTicket, SupportReply, VitalSign, LabResult, SymptomEntry, DnaTest, PatientMedicationRecord
from .serializers import (
    UserSerializer, UserProfileSerializer,
    PatientSerializer, DoctorSerializer,
    HospitalSerializer, AppointmentSerializer,
    PrescriptionSerializer, RegisterSerializer,
    ConversationSerializer, MessageSerializer,
    MedicalHistorySerializer, SlotSerializer, MedicineSerializer, CartSerializer, CartItemSerializer, OrderSerializer, PaymentMethodSerializer,
    FAQSerializer, UserQuestionSerializer, CreateUserQuestionSerializer, AmbulanceRequestSerializer, CreateAmbulanceRequestSerializer,
    PrivacySettingsSerializer, ChangePasswordSerializer, AccountSecuritySerializer, SupportTicketSerializer, SupportReplySerializer,
    VitalSignSerializer, LabResultSerializer, SymptomEntrySerializer, DnaTestSerializer, PatientMedicationRecordSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
class AmbulanceRequestViewSet(viewsets.ModelViewSet):
    queryset = AmbulanceRequest.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ['create']:
            return CreateAmbulanceRequestSerializer
        return AmbulanceRequestSerializer

    def get_queryset(self):
        # users see only their requests; doctors/admin could see all in future
        return AmbulanceRequest.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Naive assignment: pick nearest hospital with coords; compute rough ETA 10-25 min
        assigned = None
        eta = None
        lat = serializer.validated_data.get('latitude')
        lon = serializer.validated_data.get('longitude')

        hospitals = Hospital.objects.exclude(latitude__isnull=True).exclude(longitude__isnull=True)
        if hospitals.exists() and lat is not None and lon is not None:
            try:
                lat_f = float(lat)
                lon_f = float(lon)
                # pick first for now; in real app compute distance
                assigned = hospitals.first()
                eta = 15
            except Exception:
                pass

        serializer.save(user=self.request.user, assigned_hospital=assigned, eta_minutes=eta)

    def create(self, request, *args, **kwargs):
        # Validate with the write serializer but respond with the read serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        read_serializer = AmbulanceRequestSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        req = self.get_object()
        return Response(AmbulanceRequestSerializer(req, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        req = self.get_object()
        if req.status in [AmbulanceRequest.Status.CANCELLED, AmbulanceRequest.Status.ARRIVED]:
            return Response({'detail': 'Cannot cancel.'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = AmbulanceRequest.Status.CANCELLED
        req.save()
        return Response(AmbulanceRequestSerializer(req, context=self.get_serializer_context()).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = AmbulanceRequestSerializer(instance, data=request.data, partial=partial, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# Example viewset for the custom User model
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [AllowAny]  # Allow public access to browse doctors

    @action(detail=False, methods=['post'])
    def seed_sample_data(self, request):
        """Seed sample doctor data for demonstration purposes."""
        from django.utils import timezone
        
        # Sample doctor data
        sample_doctors = [
            {
                'email': 'dr.sarah.johnson@medifile.com',
                'password': 'password123',
                'role': 'doctor',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'phone': '+27 82 123 4567',
                'address': '123 Medical Center Drive, Johannesburg',
                'date_of_birth': '1985-03-15',
                'specialization': 'Cardiologist',
                'license_number': 'MD-001-CARD',
                'hospital_name': 'Johannesburg Heart Institute',
                'hospital_address': '456 Health Street, Johannesburg, Gauteng',
                'hospital_contact': '+27 11 234 5678'
            },
            {
                'email': 'dr.michael.chen@medifile.com',
                'password': 'password123',
                'role': 'doctor',
                'first_name': 'Michael',
                'last_name': 'Chen',
                'phone': '+27 83 234 5678',
                'address': '789 Wellness Avenue, Cape Town',
                'date_of_birth': '1982-07-22',
                'specialization': 'Neurologist',
                'license_number': 'MD-002-NEURO',
                'hospital_name': 'Cape Town Neurology Center',
                'hospital_address': '321 Brain Street, Cape Town, Western Cape',
                'hospital_contact': '+27 21 345 6789'
            },
            {
                'email': 'dr.emma.williams@medifile.com',
                'password': 'password123',
                'role': 'doctor',
                'first_name': 'Emma',
                'last_name': 'Williams',
                'phone': '+27 84 345 6789',
                'address': '567 Pediatric Lane, Durban',
                'date_of_birth': '1988-11-08',
                'specialization': 'Pediatrician',
                'license_number': 'MD-003-PED',
                'hospital_name': 'Durban Children\'s Hospital',
                'hospital_address': '654 Child Care Road, Durban, KwaZulu-Natal',
                'hospital_contact': '+27 31 456 7890'
            },
            {
                'email': 'dr.david.rodriguez@medifile.com',
                'password': 'password123',
                'role': 'doctor',
                'first_name': 'David',
                'last_name': 'Rodriguez',
                'phone': '+27 85 456 7890',
                'address': '890 Orthopedic Way, Pretoria',
                'date_of_birth': '1980-05-12',
                'specialization': 'Orthopedic Surgeon',
                'license_number': 'MD-004-ORTHO',
                'hospital_name': 'Pretoria Orthopedic Center',
                'hospital_address': '987 Bone Street, Pretoria, Gauteng',
                'hospital_contact': '+27 12 567 8901'
            },
            {
                'email': 'dr.lisa.patel@medifile.com',
                'password': 'password123',
                'role': 'doctor',
                'first_name': 'Lisa',
                'last_name': 'Patel',
                'phone': '+27 86 567 8901',
                'address': '234 Dermatology Drive, Port Elizabeth',
                'date_of_birth': '1987-09-30',
                'specialization': 'Dermatologist',
                'license_number': 'MD-005-DERM',
                'hospital_name': 'PE Skin Care Clinic',
                'hospital_address': '543 Skin Avenue, Port Elizabeth, Eastern Cape',
                'hospital_contact': '+27 41 678 9012'
            }
        ]

        created_doctors = []
        
        for doctor_data in sample_doctors:
            try:
                # Check if user already exists
                if User.objects.filter(email=doctor_data['email']).exists():
                    continue
                
                # Create user
                user = User.objects.create_user(
                    email=doctor_data['email'],
                    password=doctor_data['password']
                )
                
                # Create user profile
                profile = UserProfile.objects.create(
                    user=user,
                    first_name=doctor_data['first_name'],
                    last_name=doctor_data['last_name'],
                    phone=doctor_data['phone'],
                    address=doctor_data['address'],
                    date_of_birth=doctor_data['date_of_birth']
                )
                
                # Create or get hospital
                hospital, _ = Hospital.objects.get_or_create(
                    name=doctor_data['hospital_name'],
                    defaults={
                        'address': doctor_data['hospital_address'],
                        'contact_number': doctor_data['hospital_contact']
                    }
                )
                
                # Create doctor
                doctor = Doctor.objects.create(
                    user=user,
                    specialization=doctor_data['specialization'],
                    license_number=doctor_data['license_number'],
                    hospital=hospital
                )
                
                created_doctors.append({
                    'email': doctor_data['email'],
                    'name': f"Dr. {doctor_data['first_name']} {doctor_data['last_name']}",
                    'specialization': doctor_data['specialization'],
                    'hospital': hospital.name
                })
                
            except Exception as e:
                print(f"Error creating doctor {doctor_data['email']}: {e}")
                continue
        
        return Response({
            'message': f'Successfully created {len(created_doctors)} sample doctors',
            'doctors': created_doctors
        })


# ------------------------------
# Pharmacy Viewsets
# ------------------------------

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.filter(is_active=True)
    serializer_class = MedicineSerializer
    permission_classes = [AllowAny]  # Allow browsing medicines without login

    def get_queryset(self):
        queryset = Medicine.objects.filter(is_active=True)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(generic_name__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by sale items
        on_sale = self.request.query_params.get('on_sale', None)
        if on_sale == 'true':
            queryset = queryset.filter(original_price__isnull=False).exclude(original_price__lte=models.F('price'))
        
        return queryset.order_by('name')

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all available medicine categories."""
        categories = Medicine.objects.filter(is_active=True).values_list('category', flat=True).distinct()
        return Response(list(categories))

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular medicines (can be based on sales or ratings)."""
        popular_medicines = Medicine.objects.filter(is_active=True).order_by('-created_at')[:10]
        serializer = self.get_serializer(popular_medicines, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        """Get medicines that are on sale."""
        sale_medicines = Medicine.objects.filter(
            is_active=True,
            original_price__isnull=False
        ).exclude(original_price__lte=models.F('price'))
        serializer = self.get_serializer(sale_medicines, many=True)
        return Response(serializer.data)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user, is_active=True)

    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """Get the current user's active cart."""
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            is_active=True,
            defaults={'created_at': timezone.now()}
        )
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add an item to the cart."""
        medicine_id = request.data.get('medicine_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            medicine = Medicine.objects.get(medicine_id=medicine_id, is_active=True)
        except Medicine.DoesNotExist:
            return Response(
                {'error': 'Medicine not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if medicine.stock_quantity < quantity:
            return Response(
                {'error': 'Insufficient stock'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            is_active=True,
            defaults={'created_at': timezone.now()}
        )
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            medicine=medicine,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['put'])
    def update_item(self, request):
        """Update cart item quantity."""
        cart_item_id = request.data.get('cart_item_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            cart_item = CartItem.objects.get(
                cart_item_id=cart_item_id,
                cart__user=request.user,
                cart__is_active=True
            )
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if quantity <= 0:
            cart_item.delete()
        else:
            if cart_item.medicine.stock_quantity < quantity:
                return Response(
                    {'error': 'Insufficient stock'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = quantity
            cart_item.save()
        
        cart = cart_item.cart
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        """Remove an item from the cart."""
        cart_item_id = request.data.get('cart_item_id')
        
        try:
            cart_item = CartItem.objects.get(
                cart_item_id=cart_item_id,
                cart__user=request.user,
                cart__is_active=True
            )
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        cart = cart_item.cart
        cart_item.delete()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def clear_cart(self, request):
        """Clear all items from the cart."""
        cart = Cart.objects.filter(user=request.user, is_active=True).first()
        if cart:
            cart.items.all().delete()
        
        serializer = CartSerializer(cart) if cart else None
        return Response(serializer.data if serializer else {'message': 'Cart is empty'})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Create an order from cart or direct items."""
        items = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address')
        delivery_option = request.data.get('delivery_option', 'standard')
        payment_method = request.data.get('payment_method', 'card')
        total_amount = request.data.get('total_amount')
        
        if not shipping_address or not items:
            return Response(
                {'error': 'Shipping address and items are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                shipping_address=shipping_address,
                delivery_option=delivery_option,
                payment_method=payment_method,
                status='pending'
            )
            
            # Create order items
            for item_data in items:
                medicine_id = item_data.get('medicine_id')
                quantity = item_data.get('quantity', 1)
                
                try:
                    medicine = Medicine.objects.get(medicine_id=medicine_id, is_active=True)
                except Medicine.DoesNotExist:
                    raise ValidationError(f"Medicine with ID {medicine_id} not found")
                
                # Check stock availability
                if medicine.stock_quantity < quantity:
                    raise ValidationError(f"Insufficient stock for {medicine.name}")
                
                # Create order item
                OrderItem.objects.create(
                    order=order,
                    medicine=medicine,
                    quantity=quantity,
                    price=medicine.price
                )
                
                # Update stock
                medicine.stock_quantity -= quantity
                medicine.save()
            
            # Clear the cart if this was from cart
            cart = Cart.objects.filter(user=request.user, is_active=True).first()
            if cart:
                cart.items.all().delete()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get all orders for the current user."""
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        """Cancel an order."""
        try:
            order = Order.objects.get(order_id=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if order.status != 'pending':
            return Response(
                {'error': 'Order cannot be cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Restore stock
            for order_item in order.items.all():
                order_item.medicine.stock_quantity += order_item.quantity
                order_item.medicine.save()
            
            # Cancel order
            order.status = 'cancelled'
            order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def doctors(self, request, pk=None):
        """Get all doctors for a specific hospital."""
        hospital = self.get_object()
        doctors = Doctor.objects.filter(hospital=hospital)
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        """Allow patients to update their appointment notes."""
        user = request.user
        appt = self.get_object()
        
        # Check if user owns this appointment
        if hasattr(user, 'patient') and appt.patient == user.patient:
            # Patients can only update notes
            if 'notes' in request.data:
                appt.notes = request.data['notes']
                appt.save(update_fields=['notes'])
                return Response(self.get_serializer(appt).data)
            else:
                raise ValidationError('Patients can only update notes')
        elif hasattr(user, 'doctor') and appt.doctor == user.doctor:
            # Doctors can update more fields
            return super().update(request, *args, **kwargs)
        else:
            raise ValidationError('Not authorized to update this appointment')

    @action(detail=False, methods=['get'])
    def my(self, request):
        user = request.user
        if hasattr(user, 'patient'):
            qs = Appointment.objects.filter(patient=user.patient)
        elif hasattr(user, 'doctor'):
            qs = Appointment.objects.filter(doctor=user.doctor)
        else:
            qs = Appointment.objects.none()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can view pending appointments')
        qs = Appointment.objects.filter(doctor=user.doctor, notes__icontains='pending')
        
        # If no pending appointments, try to get all appointments for this doctor
        if not qs.exists():
            all_appointments = Appointment.objects.filter(doctor=user.doctor)
            result = []
            for appt in all_appointments:
                try:
                    result.append({
                        'appointment_id': appt.appointment_id,
                        'date_time': appt.date_time.isoformat(),
                        'notes': appt.notes,
                        'patient_name': f"{appt.patient.user.profile.first_name} {appt.patient.user.profile.last_name}",
                        'status': appt.status
                    })
                except:
                    continue
            return Response(result)
        
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can approve appointments')
        appt = self.get_object()
        if appt.doctor != user.doctor:
            raise ValidationError('Not your appointment')
        appt.notes = 'approved'
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can decline appointments')
        appt = self.get_object()
        if appt.doctor != user.doctor:
            raise ValidationError('Not your appointment')
        appt.status = Appointment.Status.CANCELED
        appt.notes = 'declined'
        appt.save()
        # free slot is optional; skipping for simplicity
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Patient cancels their own appointment."""
        user = request.user
        if not hasattr(user, 'patient'):
            raise ValidationError('Only patients can cancel appointments')
        appt = self.get_object()
        if appt.patient != user.patient:
            raise ValidationError('Not your appointment')
        if appt.status != Appointment.Status.SCHEDULED:
            raise ValidationError('Can only cancel scheduled appointments')
        appt.status = Appointment.Status.CANCELED
        appt.notes = (appt.notes or '') + ' | cancelled by patient'
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=False, methods=['post'])
    def book(self, request):
        """Patient books an appointment for an available slot."""
        user = request.user
        if not hasattr(user, 'patient'):
            raise ValidationError('Only patients can book appointments')
        slot_id = request.data.get('slot_id')
        if not slot_id:
            raise ValidationError('slot_id is required')
        from .models import Slot
        try:
            slot = Slot.objects.get(pk=slot_id, is_available=True)
        except Slot.DoesNotExist:
            raise ValidationError('Slot not available')
        appt = Appointment.objects.create(
            patient=user.patient,
            doctor=slot.doctor,
            date_time=slot.start_time,
            status=Appointment.Status.SCHEDULED,
            notes='pending',
        )
        slot.is_available = False
        slot.save(update_fields=['is_available'])
        return Response(self.get_serializer(appt).data, status=201)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Mark an appointment as paid (demo payment)."""
        appt = self.get_object()
        amount = request.data.get('amount')
        reference = request.data.get('reference', '')
        try:
            amt = float(amount) if amount is not None else 0
        except Exception:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        appt.payment_amount = amt
        appt.payment_reference = reference
        appt.payment_status = Appointment.PaymentStatus.PAID
        appt.paid_at = timezone.now()
        appt.save(update_fields=['payment_amount', 'payment_reference', 'payment_status', 'paid_at'])
        return Response(self.get_serializer(appt).data)

    @action(detail=False, methods=['post'])
    def request(self, request):
        """Patient requests an appointment selecting doctor and date_time, with optional symptoms."""
        user = request.user
        if not hasattr(user, 'patient'):
            raise ValidationError('Only patients can request appointments')
        doctor_id = request.data.get('doctor_id')
        date_time = request.data.get('date_time')
        symptoms = request.data.get('symptoms', '')
        if not doctor_id or not date_time:
            raise ValidationError('doctor_id and date_time are required')
        try:
            doctor = Doctor.objects.get(pk=doctor_id)
        except Doctor.DoesNotExist:
            raise ValidationError('Doctor not found')
        # parse ISO datetime
        from datetime import datetime
        try:
            when = datetime.fromisoformat(date_time)
        except Exception:
            raise ValidationError('Invalid date_time, expected ISO format')
        appt = Appointment.objects.create(
            patient=user.patient,
            doctor=doctor,
            date_time=when,
            status=Appointment.Status.SCHEDULED,
            notes=('pending' + (f" | {symptoms}" if symptoms else '')),
        )
        return Response(self.get_serializer(appt).data, status=201)

    @action(detail=False, methods=['get'])
    def my_patients(self, request):
        """Doctor gets list of all their patients with appointment counts."""
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can view their patients')
        
        from django.db.models import Count
        patients_data = Appointment.objects.filter(
            doctor=user.doctor
        ).values(
            'patient_id'
        ).annotate(
            appointment_count=Count('appointment_id')
        )
        
        # Get patient details for each patient_id
        result = []
        for patient_data in patients_data:
            try:
                patient = Patient.objects.get(pk=patient_data['patient_id'])
                result.append({
                    'patient_id': patient_data['patient_id'],
                    'appointment_count': patient_data['appointment_count'],
                    'patient_name': f"{patient.user.profile.first_name} {patient.user.profile.last_name}",
                    'patient_email': patient.user.email
                })
            except Patient.DoesNotExist:
                continue
        
        return Response(result)


class SlotViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]  # Allow public access to browse available slots
    serializer_class = SlotSerializer

    def get_queryset(self):
        from .models import Slot
        qs = Slot.objects.filter(is_available=True)
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs.order_by('start_time')

    @action(detail=False, methods=['post'])
    def seed(self, request):
        """Seed demo slots for the current doctor account (for testing)."""
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can seed slots')
        from .models import Slot
        from django.utils import timezone
        base = timezone.now()
        created = []
        for i in range(1, 6):
            start = base.replace(minute=0, second=0, microsecond=0) + timezone.timedelta(days=i, hours=1)
            end = start + timezone.timedelta(minutes=30)
            obj, _ = Slot.objects.get_or_create(doctor=user.doctor, start_time=start, end_time=end, defaults={'is_available': True})
            created.append(obj.slot_id)
        return Response({'seeded': created})

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """List all slots for current doctor (available or not)."""
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can view their slots')
        from .models import Slot
        qs = Slot.objects.filter(doctor=user.doctor).order_by('-start_time')
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle availability for a slot (doctor only)."""
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can update slots')
        from .models import Slot
        slot = Slot.objects.get(pk=pk)
        if slot.doctor != user.doctor:
            raise ValidationError('Not your slot')
        slot.is_available = not slot.is_available
        slot.save(update_fields=['is_available'])
        return Response(self.get_serializer(slot).data)

    @action(detail=False, methods=['post'])
    def create_simple(self, request):
        """Create a single slot for current doctor. Body: { start_time: ISO, duration_minutes: 30 }"""
        user = request.user
        if not hasattr(user, 'doctor'):
            raise ValidationError('Only doctors can create slots')
        from .models import Slot
        import datetime
        start_str = request.data.get('start_time')
        duration = int(request.data.get('duration_minutes', 30))
        if not start_str:
            raise ValidationError('start_time is required')
        try:
            start = datetime.datetime.fromisoformat(start_str)
        except Exception:
            raise ValidationError('Invalid start_time format, expected ISO string')
        end = start + datetime.timedelta(minutes=duration)
        slot, _ = Slot.objects.get_or_create(doctor=user.doctor, start_time=start, end_time=end, defaults={'is_available': True})
        return Response(self.get_serializer(slot).data, status=201)

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]


class MyProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def list(self, request):
        user = request.user
        data = UserSerializer(user).data
        if hasattr(user, 'patient'):
            data['patient_id'] = user.patient.patient_id
        if hasattr(user, 'doctor'):
            data['doctor_id'] = user.doctor.doctor_id
        return Response(data)

    @action(detail=False, methods=['patch', 'put'])
    def update_profile(self, request):
        user = request.user
        print(f"Received data: {request.data}")  # Debug print
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        print(f"Validation errors: {serializer.errors}")  # Debug print
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get', 'patch'])
    def privacy(self, request):
        """Get or update current user's privacy settings."""
        user = request.user
        settings_obj, _ = PrivacySettings.objects.get_or_create(user=user)
        if request.method.lower() == 'get':
            return Response(PrivacySettingsSerializer(settings_obj).data)
        serializer = PrivacySettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully'})

    @action(detail=False, methods=['get'])
    def security(self, request):
        sec, _ = AccountSecurity.objects.get_or_create(user=request.user)
        return Response(AccountSecuritySerializer(sec).data)

    @action(detail=False, methods=['post'])
    def totp_begin(self, request):
        """Begin TOTP setup: generate secret and return otpauth URL (no external deps)."""
        import base64, os, urllib.parse
        sec, _ = AccountSecurity.objects.get_or_create(user=request.user)
        if sec.is_totp_enabled and sec.totp_secret:
            return Response({'detail': 'TOTP already enabled'}, status=400)
        # 20 bytes random secret base32 (strip padding)
        secret = base64.b32encode(os.urandom(20)).decode('utf-8').replace('=', '')
        sec.totp_secret = secret
        sec.save(update_fields=['totp_secret'])
        issuer = 'MediFile'
        label = f"{issuer}:{request.user.email}"
        otpauth = (
            f"otpauth://totp/{urllib.parse.quote(label)}?secret={secret}"
            f"&issuer={urllib.parse.quote(issuer)}&algorithm=SHA1&digits=6&period=30"
        )
        return Response({'secret': secret, 'otpauth_url': otpauth})

    @action(detail=False, methods=['post'])
    def totp_confirm(self, request):
        """Confirm TOTP by verifying a 6-digit code, then enable TOTP and generate backup codes."""
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'detail': 'Code required'}, status=400)
        sec, _ = AccountSecurity.objects.get_or_create(user=request.user)
        if not sec.totp_secret:
            return Response({'detail': 'Setup not started'}, status=400)
        # Verify TOTP using local implementation
        import hmac, hashlib, struct, time, base64
        def _totp_now(secret: str, for_time: int | None = None, step: int = 30, digits: int = 6) -> str:
            if for_time is None:
                for_time = int(time.time())
            key = base64.b32decode(secret + ('=' * ((8 - len(secret) % 8) % 8)))
            counter = int(for_time // step)
            msg = struct.pack('>Q', counter)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            offset = h[-1] & 0x0F
            code_int = (struct.unpack('>I', h[offset:offset+4])[0] & 0x7fffffff) % (10 ** digits)
            return str(code_int).zfill(digits)
        now = int(time.time())
        valid = any(_totp_now(sec.totp_secret, now + drift) == code for drift in (-30, 0, 30))
        if not valid:
            return Response({'detail': 'Invalid code'}, status=400)
        # Enable and create backup codes
        from django.contrib.auth.hashers import make_password
        import secrets
        backup_codes = [secrets.token_hex(4) for _ in range(5)]
        sec.is_totp_enabled = True
        sec.backup_code_hashes = [make_password(c) for c in backup_codes]
        sec.save(update_fields=['is_totp_enabled', 'backup_code_hashes'])
        return Response({'backup_codes': backup_codes})

    @action(detail=False, methods=['post'])
    def totp_disable(self, request):
        sec, _ = AccountSecurity.objects.get_or_create(user=request.user)
        sec.is_totp_enabled = False
        sec.totp_secret = None
        sec.backup_code_hashes = []
        sec.save(update_fields=['is_totp_enabled', 'totp_secret', 'backup_code_hashes'])
        return Response({'detail': 'Two-factor authentication disabled'})


class MyMedicalHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            qs = MedicalHistory.objects.filter(patient=user.patient).order_by('-date_recorded')
            if not qs.exists():
                # Seed dummy records for demo
                demo = [
                    {"diagnosis": "Peanuts Allergies", "treatment": "Avoid peanuts", "doctor_id": None},
                    {"diagnosis": "Pollen Allergy", "treatment": "Antihistamines as needed", "doctor_id": None},
                    {"diagnosis": "Diabetes", "treatment": "Sample data", "doctor_id": None},
                ]
                from django.utils import timezone
                objs = [
                    MedicalHistory(
                        patient=user.patient,
                        diagnosis=it["diagnosis"],
                        treatment=it.get("treatment", ""),
                        date_recorded=timezone.now().date(),
                    ) for it in demo
                ]
                MedicalHistory.objects.bulk_create(objs, ignore_conflicts=True)
                qs = MedicalHistory.objects.filter(patient=user.patient).order_by('-date_recorded')
            return qs
        return MedicalHistory.objects.none()


class MyVitalsViewSet(viewsets.ModelViewSet):
    serializer_class = VitalSignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return VitalSign.objects.filter(patient=user.patient)
        return VitalSign.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)


class MyLabResultsViewSet(viewsets.ModelViewSet):
    serializer_class = LabResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return LabResult.objects.filter(patient=user.patient)
        return LabResult.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)


class MySymptomsViewSet(viewsets.ModelViewSet):
    serializer_class = SymptomEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return SymptomEntry.objects.filter(patient=user.patient)
        return SymptomEntry.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)


class MyDnaTestsViewSet(viewsets.ModelViewSet):
    serializer_class = DnaTestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return DnaTest.objects.filter(patient=user.patient)
        return DnaTest.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)


class MyMedicationsViewSet(viewsets.ModelViewSet):
    serializer_class = PatientMedicationRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'patient'):
            return PatientMedicationRecord.objects.filter(patient=user.patient)
        return PatientMedicationRecord.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)

# --------------------------
# Auth & Messaging
# --------------------------

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "patient"):
            return Conversation.objects.filter(patient=user.patient)
        if hasattr(user, "doctor"):
            return Conversation.objects.filter(doctor=user.doctor)
        return Conversation.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        doctor_id = request.data.get("doctor_id")
        patient_id = request.data.get("patient_id")

        if hasattr(user, "patient"):
            patient = user.patient
            if not doctor_id:
                raise ValidationError("doctor_id is required")
            doctor = Doctor.objects.get(pk=doctor_id)
        elif hasattr(user, "doctor"):
            doctor = user.doctor
            if not patient_id:
                raise ValidationError("patient_id is required")
            patient = Patient.objects.get(pk=patient_id)
        else:
            raise ValidationError("User must be a patient or a doctor")

        conv, _ = Conversation.objects.get_or_create(patient=patient, doctor=doctor)
        serializer = self.get_serializer(conv)
        return Response(serializer.data, status=201)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.select_related("conversation", "sender")
        conv_id = self.request.query_params.get("conversation")
        if conv_id:
            qs = qs.filter(conversation_id=conv_id)
        user = self.request.user
        if hasattr(user, "patient"):
            qs = qs.filter(conversation__patient=user.patient)
        elif hasattr(user, "doctor"):
            qs = qs.filter(conversation__doctor=user.doctor)
        else:
            qs = Message.objects.none()
        return qs

    def perform_create(self, serializer):
        conv = Conversation.objects.get(pk=self.request.data.get("conversation"))
        user = self.request.user
        if hasattr(user, "patient") and conv.patient != user.patient:
            raise ValidationError("Not a participant")
        if hasattr(user, "doctor") and conv.doctor != user.doctor:
            raise ValidationError("Not a participant")
        serializer.save(sender=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_patients_view(request):
    """Doctor gets list of all their patients with appointment counts."""
    user = request.user
    if not hasattr(user, 'doctor'):
        raise ValidationError('Only doctors can view their patients')
    
    from django.db.models import Count
    patients_data = Appointment.objects.filter(
        doctor=user.doctor
    ).values(
        'patient_id'
    ).annotate(
        appointment_count=Count('appointment_id')
    )
    
    # Get patient details for each patient_id
    result = []
    for patient_data in patients_data:
        try:
            patient = Patient.objects.get(pk=patient_data['patient_id'])
            result.append({
                'patient_id': patient_data['patient_id'],
                'appointment_count': patient_data['appointment_count'],
                'patient_name': f"{patient.user.profile.first_name} {patient.user.profile.last_name}",
                'patient_email': patient.user.email
            })
        except Patient.DoesNotExist:
            continue
    
    # If no patients found, try to get all patients for this doctor from appointments
    if not result:
        # Get all unique patients who have appointments with this doctor
        patient_ids = Appointment.objects.filter(
            doctor=user.doctor
        ).values_list('patient_id', flat=True).distinct()
        
        for patient_id in patient_ids:
            try:
                patient = Patient.objects.get(pk=patient_id)
                appointment_count = Appointment.objects.filter(
                    doctor=user.doctor, 
                    patient=patient
                ).count()
                
                result.append({
                    'patient_id': patient_id,
                    'appointment_count': appointment_count,
                    'patient_name': f"{patient.user.profile.first_name} {patient.user.profile.last_name}",
                    'patient_email': patient.user.email
                })
            except Patient.DoesNotExist:
                continue
    
    return Response(result)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user payment methods."""
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        # Mask the card number for display
        number = serializer.validated_data.get('encrypted_number', '')
        if number:
            masked = f"**** **** **** {number[-4:]}" if len(number) >= 4 else "****"
            serializer.save(
                user=self.request.user,
                masked_number=masked,
                encrypted_number=number  # In production, encrypt this
            )
        else:
            # Handle case where no number is provided (for bank/wallet)
            serializer.save(
                user=self.request.user,
                masked_number="****",
                encrypted_number=""  # Empty string for non-card payment methods
            )

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default."""
        payment_method = self.get_object()
        
        # Remove default from all other payment methods
        PaymentMethod.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        # Set this one as default
        payment_method.is_default = True
        payment_method.save()
        
        return Response({'message': 'Payment method set as default'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a payment method (soft delete)."""
        payment_method = self.get_object()
        payment_method.is_active = False
        payment_method.save()
        
        return Response({'message': 'Payment method deactivated'})


# --------------------------
# FAQ Views
# --------------------------

class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for FAQ - read-only for users."""
    queryset = FAQ.objects.filter(is_active=True)
    serializer_class = FAQSerializer
    permission_classes = [AllowAny]  # Allow public access to FAQs

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get FAQs by category."""
        category = request.query_params.get('category', 'general')
        faqs = FAQ.objects.filter(is_active=True, category=category)
        serializer = self.get_serializer(faqs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all available FAQ categories."""
        categories = FAQ.objects.filter(is_active=True).values_list('category', flat=True).distinct()
        return Response(list(categories))


class UserQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for user questions."""
    serializer_class = UserQuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserQuestion.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserQuestionSerializer
        return UserQuestionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_questions(self, request):
        """Get all questions asked by the current user."""
        questions = UserQuestion.objects.filter(user=request.user)
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)


class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'detail': 'Message is required'}, status=400)
        reply = SupportReply.objects.create(ticket=ticket, sender=request.user, message=message)
        return Response(SupportReplySerializer(reply).data, status=201)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = SupportTicket.Status.CLOSED
        ticket.save(update_fields=['status'])
        return Response(self.get_serializer(ticket).data)
