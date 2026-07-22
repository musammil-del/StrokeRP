import os
import joblib
import pandas as pd

from django.conf import settings
from django.core.management.base import BaseCommand
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    mean_squared_error,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

from prediction.models import StrokeDataset


class Command(BaseCommand):
    help = "Train Decision Tree, Random Forest, and XGBoost models"

    def handle(self, *args, **options):
        rows = StrokeDataset.objects.all().values(
            "weakness_half_body",
            "speech_difficulty",
            "blurred_vision",
            "sudden_headache",
            "dizziness_vertigo",
            "blood_sugar",
            "cholesterol",
            "ekg_result",
            "systolic_bp",
            "diastolic_bp",
            "bmi",
            "has_diabetes",
            "has_hypertension",
            "stroke_type",
        )

        df = pd.DataFrame(list(rows))

        if df.empty:
            self.stdout.write(self.style.ERROR("No dataset found. Import CSV first."))
            return

        # Convert Decimal/Object columns to float for compatability with models (especially XGBoost)
        float_cols = ["blood_sugar", "cholesterol", "systolic_bp", "diastolic_bp", "bmi"]
        for col in float_cols:
            if col in df.columns:
                df[col] = df[col].astype(float)

        # Convert Boolean/Object columns to int
        bool_cols = [
            "weakness_half_body", "speech_difficulty", "blurred_vision",
            "sudden_headache", "dizziness_vertigo", "ekg_result",
            "has_diabetes", "has_hypertension"
        ]
        for col in bool_cols:
            if col in df.columns:
                df[col] = df[col].astype(int)

        x = df.drop(columns=["stroke_type"])
        y = df["stroke_type"]

        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)

        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y_encoded,
            test_size=0.2,
            random_state=42,
            stratify=y_encoded,
        )

        models = {
            "decision_tree": DecisionTreeClassifier(criterion="entropy", random_state=42),
            "random_forest": RandomForestClassifier(n_estimators=200, random_state=42),
            "xgboost": XGBClassifier(random_state=42, eval_metric="mlogloss"),
        }

        output_dir = os.path.join(settings.BASE_DIR, "prediction", "ml_models")
        os.makedirs(output_dir, exist_ok=True)

        for name, model in models.items():
            model.fit(x_train, y_train)
            y_pred = model.predict(x_test)

            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average="weighted")
            recall = recall_score(y_test, y_pred, average="weighted")
            f1 = f1_score(y_test, y_pred, average="weighted")
            rmse = mean_squared_error(y_test, y_pred) ** 0.5

            self.stdout.write(self.style.SUCCESS(f"\n{name}"))
            self.stdout.write(f"Accuracy  : {accuracy:.4f}")
            self.stdout.write(f"Precision : {precision:.4f}")
            self.stdout.write(f"Recall    : {recall:.4f}")
            self.stdout.write(f"F1-score  : {f1:.4f}")
            self.stdout.write(f"RMSE      : {rmse:.4f}")

            self.stdout.write("\nClassification report:")
            self.stdout.write(
                classification_report(
                    y_test,
                    y_pred,
                    target_names=label_encoder.classes_,
                )
            )

            model_path = os.path.join(output_dir, f"{name}.joblib")
            joblib.dump(
                {
                    "model": model,
                    "label_encoder": label_encoder,
                    "features": list(x.columns),
                    "metrics": {
                        "accuracy": accuracy,
                        "precision": precision,
                        "recall": recall,
                        "f1_score": f1,
                        "rmse": rmse,
                    },
                },
                model_path,
            )

        self.stdout.write(self.style.SUCCESS("\nAll models trained and saved."))