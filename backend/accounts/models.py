from django.db import models

# Create your models here.from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("user", "User"),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")
