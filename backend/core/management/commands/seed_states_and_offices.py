import json
from django.core.management.base import BaseCommand
from core.models import State, PostalOffice


class Command(BaseCommand):
    help = "Seed database with Algerian states and postal offices"

    def handle(self, *args, **options):
        states_file = "core/data/algeria.json"
        offices_file = "core/data/wilaya_post_offices.json"

        self.stdout.write("Loading states from JSON...")
        with open(states_file, encoding="utf-8") as f:
            data = json.load(f)

        created_states = 0
        for feature in data["features"]:
            props = feature["properties"]
            geometry = feature.get("geometry")

            state, created = State.objects.get_or_create(
                gid_1=props["GID_1"],
                defaults={
                    "name": props.get("NAME_1"),
                    "varname": props.get("VARNAME_1"),
                    "nl_name": props.get("NL_NAME_1"),
                    "code": props.get("CC_1"),
                    "iso": props.get("ISO_1"),
                    "country": props.get("COUNTRY"),
                    "geometry": geometry,
                },
            )
            if created:
                created_states += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Created {created_states} states."))

        # --------------------------
        # Seed Postal Offices
        # --------------------------
        self.stdout.write("Loading postal offices...")
        with open(offices_file, encoding="utf-8") as f:
            offices_data = json.load(f)

        created_offices = 0
        for state_code, offices in offices_data.items():
            # find State by CC_1 (code)
            state = State.objects.filter(code=str(state_code)).first()
            if not state:
                self.stdout.write(
                    self.style.WARNING(f"⚠️ No state found for code {state_code}")
                )
                continue

            for office_name in offices:
                PostalOffice.objects.get_or_create(
                    name=office_name.strip(), state=state
                )
                created_offices += 1

        self.stdout.write(
            self.style.SUCCESS(f"✅ Created {created_offices} postal offices.")
        )
        self.stdout.write(self.style.SUCCESS("🎉 Seeding completed successfully!"))
