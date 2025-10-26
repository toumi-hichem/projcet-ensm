# core/management/commands/rebuild_dashboard_history.py
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
import requests
import time
from dateutil.relativedelta import relativedelta


class Command(BaseCommand):
    help = "Rebuild dashboard history snapshots by POSTing to /refresh/ monthly between two dates."

    def add_arguments(self, parser):
        parser.add_argument("--start", required=True, help="Start date (YYYY-MM-DD)")
        parser.add_argument("--end", required=True, help="End date (YYYY-MM-DD)")
        parser.add_argument(
            "--url",
            required=True,
            help="POST URL (e.g. http://localhost:8000/refresh/)",
        )
        parser.add_argument(
            "--sleep", type=int, default=3, help="Delay (seconds) between requests"
        )

    def handle(self, *args, **options):
        start_date = datetime.strptime(options["start"], "%Y-%m-%d")
        end_date = datetime.strptime(options["end"], "%Y-%m-%d")
        url = options["url"]
        sleep_time = options["sleep"]

        current = start_date
        total_snapshots = 0

        while current <= end_date:
            month_start = current.replace(day=1)
            month_end = (current + relativedelta(day=31)).replace(
                hour=23, minute=59, second=59
            )
            snapshot_date = month_end if month_end <= end_date else end_date

            self.stdout.write(
                self.style.NOTICE(
                    f"→ Posting snapshot for: {snapshot_date:%Y-%m-%d %H:%M:%S}"
                )
            )

            payload = {
                "start_date": month_start.strftime("%Y-%m-%dT00:00:00"),
                "end_date": snapshot_date.strftime("%Y-%m-%dT23:59:59"),
            }

            success = False
            attempts = 0

            # Retry logic
            while not success and attempts < 5:
                try:
                    resp = requests.post(url, json=payload, timeout=60)
                    resp.raise_for_status()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ Snapshot saved for {snapshot_date:%Y-%m-%d}"
                        )
                    )
                    total_snapshots += 1
                    success = True
                except requests.exceptions.RequestException as e:
                    attempts += 1
                    self.stdout.write(self.style.WARNING(f"⚠️ Attempt {attempts}: {e}"))
                    if attempts < 5:
                        self.stdout.write(f"⏳ Retrying in {sleep_time}s...")
                        time.sleep(sleep_time)
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f"❌ Failed after 5 attempts for {snapshot_date:%Y-%m-%d}"
                            )
                        )

            # small delay between successful snapshots
            if success:
                time.sleep(sleep_time)

            # Move to next month
            current += relativedelta(months=1)

        self.stdout.write(
            self.style.SUCCESS(f"\n🎉 Completed! Total snapshots: {total_snapshots}")
        )
