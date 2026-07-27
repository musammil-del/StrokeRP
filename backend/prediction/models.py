from django.db import models
from accounts.models import User


class StrokeDataset(models.Model):
    STROKE_TYPE_CHOICES = [
        ("Ischemic", "Ischemic"),
        ("Hemorrhagic", "Hemorrhagic"),
        ("No_Stroke", "No Stroke"),
    ]

    patient_id = models.CharField(max_length=20, unique=True)

    weakness_half_body = models.BooleanField()
    speech_difficulty = models.BooleanField()
    blurred_vision = models.BooleanField()
    sudden_headache = models.BooleanField()
    dizziness_vertigo = models.BooleanField()

    blood_sugar = models.DecimalField(max_digits=10, decimal_places=9)
    cholesterol = models.DecimalField(max_digits=10, decimal_places=9)
    ekg_result = models.BooleanField()
    systolic_bp = models.DecimalField(max_digits=10, decimal_places=9)
    diastolic_bp = models.DecimalField(max_digits=10, decimal_places=9)
    bmi = models.DecimalField(max_digits=10, decimal_places=9)

    has_diabetes = models.BooleanField()
    has_hypertension = models.BooleanField()
    has_dyslipidemia = models.BooleanField(default=False)

    stroke_type = models.CharField(max_length=20, choices=STROKE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_id} - {self.stroke_type}"


class StrokePrediction(models.Model):
    STROKE_TYPE_CHOICES = [
        ("Ischemic", "Ischemic"),
        ("Hemorrhagic", "Hemorrhagic"),
        ("No_Stroke", "No Stroke"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    patient_id = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    weakness_half_body = models.BooleanField()
    speech_difficulty = models.BooleanField()
    blurred_vision = models.BooleanField()
    sudden_headache = models.BooleanField()
    dizziness_vertigo = models.BooleanField()

    blood_sugar = models.DecimalField(max_digits=10, decimal_places=9)
    cholesterol = models.DecimalField(max_digits=10, decimal_places=9)
    ekg_result = models.BooleanField()
    systolic_bp = models.DecimalField(max_digits=10, decimal_places=9)
    diastolic_bp = models.DecimalField(max_digits=10, decimal_places=9)
    bmi = models.DecimalField(max_digits=10, decimal_places=9)

    has_diabetes = models.BooleanField()
    has_hypertension = models.BooleanField()
    has_dyslipidemia = models.BooleanField(default=False)

    predicted_stroke_type = models.CharField(max_length=20, choices=STROKE_TYPE_CHOICES)
    confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_id or 'Patient'} - {self.predicted_stroke_type}"