from django.contrib import admin
from .models import StrokeDataset, StrokePrediction

admin.site.register(StrokeDataset)
admin.site.register(StrokePrediction)