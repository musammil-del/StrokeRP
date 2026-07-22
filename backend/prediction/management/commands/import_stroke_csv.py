import csv

from django.core.management.base import BaseCommand, CommandError

from prediction.models import StrokeDataset


class Command(BaseCommand):
    help = "Import stroke data from a CSV file into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            type=str,
            help="Path to the CSV file to import",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]

        try:
            f = open(csv_path, "r", encoding="utf-8-sig")
        except FileNotFoundError:
            raise CommandError(f"File not found: {csv_path}")

        reader = csv.DictReader(f)
        objects = []

        for row in reader:
            objects.append(
                StrokeDataset(
                    patient_id=row["Patient_ID"],
                    weakness_half_body=row["Weakness_Half_Body"],
                    speech_difficulty=row["Speech_Difficulty"],
                    blurred_vision=row["Blurred_Vision"],
                    sudden_headache=row["Sudden_Headache"],
                    dizziness_vertigo=row["Dizziness_Vertigo"],
                    blood_sugar=row["Blood_Sugar"],
                    cholesterol=row["Cholesterol"],
                    ekg_result=row["EKG_Result"],
                    systolic_bp=row["Systolic_BP"],
                    diastolic_bp=row["Diastolic_BP"],
                    bmi=row["BMI"],
                    has_diabetes=row["Has_Diabetes"],
                    has_hypertension=row["Has_Hypertension"],
                    stroke_type=row["Stroke_Type"],
                )
            )

        f.close()

        StrokeDataset.objects.bulk_create(objects)

        self.stdout.write(
            self.style.SUCCESS(f"Imported {len(objects)} rows into StrokeDataset.")
        )