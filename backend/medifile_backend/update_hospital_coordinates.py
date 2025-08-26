#!/usr/bin/env python
"""
Update existing hospitals with coordinates.
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')
django.setup()

from core.models import Hospital

def update_hospital_coordinates():
    """Update existing hospitals with coordinates."""
    
    hospital_coordinates = {
        'Johannesburg General Hospital': (-26.2041, 28.0473),
        'Cape Town Medical Center': (-33.9249, 18.4241),
        'Durban Regional Hospital': (-29.8587, 31.0218),
        'Pretoria Central Hospital': (-25.7479, 28.2293),
        'Port Elizabeth Medical Complex': (-33.7139, 25.5207),
        'Bloemfontein Health Center': (-29.0852, 26.1596),
        'Nelspruit Regional Hospital': (-25.4753, 30.9694),
        'Polokwane Medical Institute': (-23.9045, 29.4698),
    }
    
    updated_count = 0
    for hospital_name, (lat, lng) in hospital_coordinates.items():
        try:
            hospital = Hospital.objects.get(name=hospital_name)
            hospital.latitude = lat
            hospital.longitude = lng
            hospital.save()
            updated_count += 1
            print(f"✅ Updated coordinates for: {hospital.name}")
        except Hospital.DoesNotExist:
            print(f"❌ Hospital not found: {hospital_name}")
    
    print(f"\n🎉 Update complete! Updated {updated_count} hospitals with coordinates.")

if __name__ == '__main__':
    update_hospital_coordinates()
