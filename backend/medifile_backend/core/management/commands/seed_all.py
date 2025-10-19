from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Run all seeders (hospitals, doctors, medicines, faqs)"

    def add_arguments(self, parser):
        parser.add_argument('--hospital', type=str, default=None, help='Optional hospital name to assign to seeded doctors')

    def handle(self, *args, **options):
        hospital_name = options.get('hospital')

        self.stdout.write(self.style.WARNING("Seeding hospitals..."))
        call_command('seed_hospitals')

        self.stdout.write(self.style.WARNING("Seeding doctors..."))
        if hospital_name:
            call_command('seed_doctors', hospital=hospital_name)
        else:
            call_command('seed_doctors')

        self.stdout.write(self.style.WARNING("Seeding medicines..."))
        call_command('seed_medicines')

        self.stdout.write(self.style.WARNING("Seeding FAQs..."))
        call_command('seed_faqs')

        self.stdout.write(self.style.SUCCESS("All seeders completed."))


