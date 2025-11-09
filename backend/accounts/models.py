from django.db import models
from django.contrib.auth.models import User


class AccountProfile(models.Model):
    class Roles(models.TextChoices):
        MANAGER = "manager", "Manager"
        CUSTOMER = "customer", "Customer"
        DELIVERY = "delivery", "Delivery Person"
        CSE = "cse", "Customer Service Executive"
        SM = "sm", "Subscription Manager"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Roles.choices)
    address = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
