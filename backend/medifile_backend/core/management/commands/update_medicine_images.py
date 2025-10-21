import json
import os
from typing import Dict, Any

from django.core.management.base import BaseCommand, CommandError
from core.models import Medicine


class Command(BaseCommand):
    help = "Update Medicine.image_url values from a JSON mapping file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file_path",
            default=os.path.join(os.path.dirname(__file__), "../../fixtures/medicine_images.json"),
            help="Path to JSON file mapping medicine names to image URLs",
        )

    def handle(self, *args, **options):
        file_path: str = options["file_path"]

        if not os.path.exists(file_path):
            raise CommandError(f"File not found: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data: Dict[str, Any] = json.load(f)
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON in {file_path}: {e}")

        if not isinstance(data, dict):
            raise CommandError("JSON must be an object mapping medicine names to URLs")

        updated = 0
        missing = []

        for name, url in data.items():
            if not isinstance(url, str) or not url:
                continue
            try:
                obj = Medicine.objects.get(name=name)
            except Medicine.DoesNotExist:
                missing.append(name)
                continue

            # Only update if changed
            if obj.image_url != url:
                obj.image_url = url
                obj.save(update_fields=["image_url"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated image_url for {updated} medicines."))
        if missing:
            self.stdout.write(self.style.WARNING(f"No Medicine found for: {', '.join(missing)}"))


