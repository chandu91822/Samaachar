from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import models
from .models import AccountProfile


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=AccountProfile.Roles.choices)
    house_number = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        # Require house_number for customers
        if data.get("role") == "customer" and not data.get("house_number"):
            raise serializers.ValidationError({"house_number": "House number is required for customers"})
        return data

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        house_number = validated_data.pop("house_number", "")

        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
        )
        user.set_password(validated_data["password"])
        user.save()

        AccountProfile.objects.create(user=user, role=role)
        
        # Create address if house_number is provided (for customers)
        if house_number and role == "customer":
            from api.models import Address
            # Get the next sequence number
            max_seq = Address.objects.aggregate(models.Max('sequence_hint'))['sequence_hint__max'] or 0
            Address.objects.create(
                customer=user,
                house_number=house_number,
                line=f"House #{house_number}",
                sequence_hint=max_seq + 1
            )
        
        # Create delivery stats if role is delivery
        if role == "delivery":
            from api.models import DeliveryBoyStats
            DeliveryBoyStats.objects.create(delivery_person=user)
            
        # For CSE and SM roles, we don't need any additional setup

        return user
