from django.core.management.base import BaseCommand
from core.models import Hospital


class Command(BaseCommand):
    help = "Seed hospitals (idempotent)"

    def handle(self, *args, **options):
        hospitals_data = [
            {
                "name": "Johannesburg General Hospital",
                "address": "123 Hospital Street, Johannesburg, Gauteng 2000",
                "contact_number": "+27 11 555 0123",
                "latitude": -26.2041,
                "longitude": 28.0473,
            },
            {
                "name": "Cape Town Medical Center",
                "address": "456 Health Avenue, Cape Town, Western Cape 8001",
                "contact_number": "+27 21 555 0456",
                "latitude": -33.9249,
                "longitude": 18.4241,
            },
            {
                "name": "Durban Regional Hospital",
                "address": "789 Medical Drive, Durban, KwaZulu-Natal 4001",
                "contact_number": "+27 31 555 0789",
                "latitude": -29.8587,
                "longitude": 31.0218,
            },
            {
                "name": "Pretoria Central Hospital",
                "address": "321 Care Boulevard, Pretoria, Gauteng 0001",
                "contact_number": "+27 12 555 0321",
                "latitude": -25.7479,
                "longitude": 28.2293,
            },
            {
                "name": "Port Elizabeth Medical Complex",
                "address": "654 Wellness Road, Port Elizabeth, Eastern Cape 6001",
                "contact_number": "+27 41 555 0654",
                "latitude": -33.7139,
                "longitude": 25.5207,
            },
            {
                "name": "Bloemfontein Health Center",
                "address": "987 Healing Street, Bloemfontein, Free State 9301",
                "contact_number": "+27 51 555 0987",
                "latitude": -29.0852,
                "longitude": 26.1596,
            },
            {
                "name": "Nelspruit Regional Hospital",
                "address": "22 Kruger Park Rd, Mbombela, Mpumalanga 1200",
                "contact_number": "+27 13 555 0222",
                "latitude": -25.4658,
                "longitude": 30.9853,
            },
            {
                "name": "Polokwane Provincial Hospital",
                "address": "77 Health Way, Polokwane, Limpopo 0700",
                "contact_number": "+27 15 555 0777",
                "latitude": -23.9050,
                "longitude": 29.4689,
            },
            {
                "name": "Kimberley Medi-Clinic",
                "address": "12 Diamond Ave, Kimberley, Northern Cape 8300",
                "contact_number": "+27 53 555 0012",
                "latitude": -28.7380,
                "longitude": 24.7639,
            },
            {
                "name": "Pietermaritzburg City Hospital",
                "address": "9 Chief Albert Luthuli Rd, Pietermaritzburg, KZN 3201",
                "contact_number": "+27 33 555 0009",
                "latitude": -29.6006,
                "longitude": 30.3794,
            },
        ]

        created = 0
        updated = 0
        for data in hospitals_data:
            obj, was_created = Hospital.objects.update_or_create(
                name=data["name"],
                defaults={
                    "address": data["address"],
                    "contact_number": data["contact_number"],
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Hospitals seeded. Created: {created}, Updated: {updated}"))


