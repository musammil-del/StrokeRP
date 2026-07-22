from django.contrib import admin
from django.urls import path
from prediction.views import (
    predict_stroke,
    api_login,
    api_logout,
    api_register,
    dashboard_stats,
    api_users,
    api_dataset,
    api_model_comparison
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', api_login, name='api_login'),
    path('api/logout/', api_logout, name='api_logout'),
    path('api/register/', api_register, name='api_register'),
    path('api/predict/', predict_stroke, name='predict_stroke'),
    path('api/dashboard-stats/', dashboard_stats, name='dashboard_stats'),
    path('api/users/', api_users, name='api_users'),
    path('api/dataset/', api_dataset, name='api_dataset'),
    path('api/model-comparison/', api_model_comparison, name='api_model_comparison'),
]

# Customize Django Admin site headers
admin.site.site_header = "การจัดการ SRP"
admin.site.site_title = "ระบบจัดการ SRP"
admin.site.index_title = "ยินดีต้อนรับสู่ระบบจัดการ SRP"
