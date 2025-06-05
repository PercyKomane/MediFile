from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    UserViewSet, UserProfileViewSet, PatientViewSet,
    DoctorViewSet, HospitalViewSet, AppointmentViewSet, PrescriptionViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'hospitals', HospitalViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'prescriptions', PrescriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
