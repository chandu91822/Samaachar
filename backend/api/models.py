from django.db import models
from django.contrib.auth.models import User
from datetime import date


class Plan(models.Model):
    title = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Subscription(models.Model):
    STATUS = (
        ("active", "Active"),
        ("paused", "Paused"),
        ("stopped", "Stopped"),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS, default="active")
    start_date = models.DateField(default=date.today)
    end_date = models.DateField(null=True, blank=True)


class Address(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    line = models.CharField(max_length=200)
    sequence_hint = models.IntegerField(default=0)  # controls delivery order


class DeliveryAssignment(models.Model):
    delivery_person = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assigned_deliveries"
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="customer_deliveries"
    )

    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    date = models.DateField(default=date.today)
    publications = models.JSONField(default=list)
    status = models.CharField(max_length=20, default="pending")
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)


class Bill(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.CharField(max_length=7)  # "2025-11"
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Payment(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="payments")
    mode = models.CharField(max_length=10)  # cash / cheque
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    cheque_no = models.CharField(max_length=50, blank=True)
    receipt_no = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Complaint(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    status = models.CharField(max_length=20, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    last_reply = models.TextField(blank=True)


class SubscribeRequest(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    approved = models.BooleanField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ChangeRequest(models.Model):
    ACTIONS = (("add", "Add"), ("remove", "Remove"))
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTIONS)
    effective_date = models.DateField()
    approved = models.BooleanField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class PauseRequest(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    approved = models.BooleanField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

