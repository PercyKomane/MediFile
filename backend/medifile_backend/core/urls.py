from rest_framework.routers import DefaultRouter
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, UserProfileViewSet, PatientViewSet,
    DoctorViewSet, HospitalViewSet, AppointmentViewSet, PrescriptionViewSet,
    RegisterView, ConversationViewSet, MessageViewSet,
    MyProfileViewSet, MyMedicalHistoryViewSet, SlotViewSet, my_patients_view,
    MedicineViewSet, CartViewSet, OrderViewSet, PaymentMethodViewSet,
    FAQViewSet, UserQuestionViewSet, AmbulanceRequestViewSet, SupportTicketViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'hospitals', HospitalViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'slots', SlotViewSet, basename='slots')
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'me', MyProfileViewSet, basename='me')
router.register(r'me/medical-history', MyMedicalHistoryViewSet, basename='my-medical-history')
router.register(r'medicines', MedicineViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'faqs', FAQViewSet, basename='faqs')
router.register(r'user-questions', UserQuestionViewSet, basename='user-questions')
router.register(r'ambulance-requests', AmbulanceRequestViewSet, basename='ambulance-requests')
router.register(r'support-tickets', SupportTicketViewSet, basename='support-tickets')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('appointments/my-patients/', my_patients_view, name='my_patients'),
    path('', include(router.urls)),
]
