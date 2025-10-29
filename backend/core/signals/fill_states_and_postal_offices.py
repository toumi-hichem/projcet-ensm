import json
import os
import logging
from django.db import transaction
from django.conf import settings
from core.models import State, PostalOffice

logger = logging.getLogger(__name__)


def seed_algeria_data():
    """
    Seed Algerian states and postal offices automatically on startup.
    Runs only once — skips if data already exists.
    """

    # Skip if States already exist
    if State.objects.exists():
        logger.info("🌍 Algeria seed already loaded — skipping.")
        return

    base_dir = settings.BASE_DIR
    states_file = os.path.join(base_dir, "core", "data", "algeria.json")
    offices_file = os.path.join(base_dir, "core", "data", "wilaya_post_offices.json")

    if not os.path.exists(states_file) or not os.path.exists(offices_file):
        logger.warning("⚠️ Algeria data files missing — skipping seed.")
        return

    logger.info("📦 Seeding Algerian states and postal offices...")

    with open(states_file, encoding="utf-8") as f:
        data = json.load(f)

    created_states = 0
    with transaction.atomic():
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

    logger.info(f"✅ Created {created_states} states.")

    with open(offices_file, encoding="utf-8") as f:
        offices_data = json.load(f)

    created_offices = 0
    with transaction.atomic():
        for state_code, offices in offices_data.items():
            state = State.objects.filter(code=str(state_code)).first()
            if not state:
                logger.warning(f"⚠️ No state found for code {state_code}")
                continue

            for office_name in offices:
                PostalOffice.objects.get_or_create(
                    name=office_name.strip(), state=state
                )
                created_offices += 1

    logger.info(f"✅ Created {created_offices} postal offices.")
    logger.info("🎉 Seeding completed successfully!")
