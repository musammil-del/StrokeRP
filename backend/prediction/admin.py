from django.contrib import admin
from .models import StrokeDataset, StrokePrediction

@admin.register(StrokePrediction)
class StrokePredictionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_id', 'user', 'predicted_stroke_type', 'confidence', 'created_at')
    search_fields = ('patient_id', 'user__username', 'predicted_stroke_type')
    list_filter = ('predicted_stroke_type', 'created_at')

@admin.register(StrokeDataset)
class StrokeDatasetAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_id', 'stroke_type', 'created_at')
    search_fields = ('patient_id', 'stroke_type')
    list_filter = ('stroke_type',)