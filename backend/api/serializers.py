from rest_framework import serializers
from .models import (
    Plan,
    Subscription,
    Complaint,
    SubscribeRequest,
    ChangeRequest,
    PauseRequest,
    Bill,
    Payment,
    DeliveryAssignment,
)


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_title = serializers.CharField(source="plan.title", read_only=True)

    class Meta:
        model = Subscription
        fields = ["id", "plan", "plan_title", "status"]


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = Complaint
        fields = "__all__"


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class SubscribeRequestSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    plan_title = serializers.CharField(source="plan.title", read_only=True)

    class Meta:
        model = SubscribeRequest
        fields = "__all__"


class ChangeRequestSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)
    plan_title = serializers.CharField(source="plan.title", read_only=True)

    class Meta:
        model = ChangeRequest
        fields = "__all__"


class PauseRequestSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = PauseRequest
        fields = "__all__"


class DeliveryRouteSerializer(serializers.ModelSerializer):
    address_line = serializers.CharField(source="address.line", read_only=True)

    class Meta:
        model = DeliveryAssignment
        fields = ["id", "publications", "status", "address_line"]
