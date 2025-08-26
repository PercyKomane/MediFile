#!/usr/bin/env python
"""
Seed script to populate hospitals with sample data.
Run with: python manage.py shell < seed_hospitals.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')
django.setup()

from core.models import Hospital

def seed_hospitals():
    """Create sample hospitals."""
    
    hospitals_data = [
        {
            'name': 'Johannesburg General Hospital',
            'address': '123 Hospital Street, Johannesburg, Gauteng 2000',
            'contact_number': '+27 11 555 0123',
            'latitude': -26.2041,
            'longitude': 28.0473,
        },
        {
            'name': 'Cape Town Medical Center',
            'address': '456 Health Avenue, Cape Town, Western Cape 8001',
            'contact_number': '+27 21 555 0456',
            'latitude': -33.9249,
            'longitude': 18.4241,
        },
        {
            'name': 'Durban Regional Hospital',
            'address': '789 Medical Drive, Durban, KwaZulu-Natal 4001',
            'contact_number': '+27 31 555 0789',
            'latitude': -29.8587,
            'longitude': 31.0218,
        },
        {
            'name': 'Pretoria Central Hospital',
            'address': '321 Care Boulevard, Pretoria, Gauteng 0001',
            'contact_number': '+27 12 555 0321',
            'latitude': -25.7479,
            'longitude': 28.2293,
        },
        {
            'name': 'Port Elizabeth Medical Complex',
            'address': '654 Wellness Road, Port Elizabeth, Eastern Cape 6001',
            'contact_number': '+27 41 555 0654',
            'latitude': -33.7139,
            'longitude': 25.5207,
        },
        {
            'name': 'Bloemfontein Health Center',
            'address': '987 Healing Street, Bloemfontein, Free State 9301',
            'contact_number': '+27 51 555 0987',
            'latitude': -29.0852,
            'longitude': 26.1596,
        },
        {
            'name': 'Nelspruit Regional Hospital',
            'address': '147 Recovery Lane, Nelspruit, Mpumalanga 1200',
            'contact_number': '+27 13 555 0147',
            'latitude': -25.4753,
            'longitude': 30.9694,
        },
        {
            'name': 'Polokwane Medical Institute',
            'address': '258 Treatment Way, Polokwane, Limpopo 0700',
            'contact_number': '+27 15 555 0258',
            'latitude': -23.9045,
            'longitude': 29.4698,
        },
    ]
    
    created_count = 0
    for hospital_data in hospitals_data:
        hospital, created = Hospital.objects.get_or_create(
            name=hospital_data['name'],
            defaults={
                'address': hospital_data['address'],
                'contact_number': hospital_data['contact_number'],
                'latitude': hospital_data['latitude'],
                'longitude': hospital_data['longitude'],
            }
        )
        if created:
            created_count += 1
            print(f"✅ Created hospital: {hospital.name}")
        else:
            print(f"⏭️  Hospital already exists: {hospital.name}")
    
    print(f"\n🎉 Seeding complete! Created {created_count} new hospitals.")
    print(f"📊 Total hospitals in database: {Hospital.objects.count()}")

if __name__ == '__main__':
    seed_hospitals()
