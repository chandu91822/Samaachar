from datetime import date
from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Plan,
    Subscription,
    SubscribeRequest,
    ChangeRequest,
    PauseRequest,
    Complaint,
    Address,
    DeliveryAssignment,
    Bill,
    Payment
)

from .serializers import (
    PlanSerializer,
    SubscriptionSerializer,
    SubscribeRequestSerializer,
    ChangeRequestSerializer,
    PauseRequestSerializer,
    ComplaintSerializer,
    DeliveryRouteSerializer,
    BillSerializer,
    PaymentSerializer
)

# ---------------------------------------------------------
# ✅ PLANS
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def plans_list(request):
    plans = Plan.objects.filter(is_active=True).order_by("id")
    return Response(PlanSerializer(plans, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def plan_add(request):
    ser = PlanSerializer(data=request.data)
    print(ser)
    if ser.is_valid():
        ser.save()
        return Response({"message": "Plan added"}, status=201)
    return Response(ser.errors, status=400)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def plan_update(request, pk):
    try:
        plan = Plan.objects.get(id=pk)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)

    ser = PlanSerializer(plan, data=request.data, partial=True)
    if ser.is_valid():
        ser.save()
        return Response({"message": "Plan updated"})
    return Response(ser.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def plan_delete(request, pk):
    try:
        plan = Plan.objects.get(id=pk)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)

    plan.delete()
    return Response({"message": "Plan deleted"})


# ---------------------------------------------------------
# ✅ CUSTOMER — SUBSCRIBE REQUEST
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_subscriptions(request):
    subs = Subscription.objects.filter(customer=request.user)
    return Response(SubscriptionSerializer(subs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_subscribe(request):
    plan_id = request.data.get("plan_id")
    if not plan_id:
        return Response({"error": "plan_id is required"}, status=400)

    try:
        plan = Plan.objects.get(id=plan_id)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)

    # Create subscribe request
    SubscribeRequest.objects.create(
        customer=request.user,
        plan=plan,
        approved=None
    )

    return Response({"message": "Subscription request sent"}, status=201)


# ---------------------------------------------------------
# ✅ SUBSCRIPTION MANAGER — APPROVALS
# ---------------------------------------------------------

### ✅ Get all pending subscribe requests
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_subscribe(request):
    reqs = SubscribeRequest.objects.filter(approved=None).select_related("customer", "plan")
    return Response(SubscribeRequestSerializer(reqs, many=True).data)


### ✅ Approve subscribe request
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_approve_subscribe(request, pk):
    try:
        req = SubscribeRequest.objects.get(id=pk, approved=None)
    except SubscribeRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    req.approved = True
    req.save()

    # Create actual subscription
    Subscription.objects.create(
        customer=req.customer,
        plan=req.plan,
        status="active"
    )

    return Response({"message": "Subscription approved"}, status=200)


### ✅ Reject subscribe request
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_reject_subscribe(request, pk):
    try:
        req = SubscribeRequest.objects.get(id=pk, approved=None)
    except SubscribeRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    req.approved = False
    req.save()

    return Response({"message": "Subscription rejected"}, status=200)


# ---------------------------------------------------------
# ✅ CHANGE REQUESTS
# ---------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_change_request(request):
    plan_id = request.data.get("plan_id")
    action = request.data.get("action")
    effective_date = request.data.get("effective_date")

    try:
        plan = Plan.objects.get(id=plan_id)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)

    ChangeRequest.objects.create(
        customer=request.user,
        plan=plan,
        action=action,
        effective_date=effective_date,
        approved=None
    )

    return Response({"message": "Change request sent"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_change(request):
    reqs = ChangeRequest.objects.filter(approved=None).select_related("customer", "plan")
    return Response(ChangeRequestSerializer(reqs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_approve_change(request, pk):
    try:
        req = ChangeRequest.objects.get(id=pk, approved=None)
    except ChangeRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    req.approved = True
    req.save()

    return Response({"message": "Change request approved"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_reject_change(request, pk):
    try:
        req = ChangeRequest.objects.get(id=pk, approved=None)
    except ChangeRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    req.approved = False
    req.save()

    return Response({"message": "Change request rejected"}, status=200)


# ---------------------------------------------------------
# ✅ PAUSE REQUESTS
# ---------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_pause_request(request):
    start = request.data.get("start_date")
    end = request.data.get("end_date")
    reason = request.data.get("reason", "")

    PauseRequest.objects.create(
        customer=request.user,
        start_date=start,
        end_date=end,
        reason=reason,
        approved=None
    )

    return Response({"message": "Pause request sent"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_pause(request):
    reqs = PauseRequest.objects.filter(approved=None).select_related("customer")
    return Response(PauseRequestSerializer(reqs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_approve_pause(request, pk):
    try:
        req = PauseRequest.objects.get(id=pk, approved=None)
    except PauseRequest.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    req.approved = True
    req.save()

    return Response({"message": "Pause approved"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_reject_pause(request, pk):
    try:
        req = PauseRequest.objects.get(id=pk, approved=None)
    except PauseRequest.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    req.approved = False
    req.save()

    return Response({"message": "Pause rejected"}, status=200)


# ---------------------------------------------------------
# ✅ COMPLAINTS
# ---------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complaint_create(request):
    msg = request.data.get("message")
    if not msg:
        return Response({"error": "message required"}, status=400)

    c = Complaint.objects.create(
        customer=request.user,
        message=msg
    )
    return Response({"message": "Complaint submitted"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cse_list_complaints(request):
    qs = Complaint.objects.filter(status="open").select_related("customer")
    return Response(ComplaintSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cse_update_complaint_status(request, pk):
    try:
        comp = Complaint.objects.get(id=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=404)

    reply = request.data.get("reply", "")

    comp.last_reply = reply
    comp.status = "closed"
    comp.save()

    return Response({"message": "Complaint closed"}, status=200)


# ---------------------------------------------------------
# ✅ DELIVERY — Daily Route
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_today_summary(request):
    qs = DeliveryAssignment.objects.filter(
        delivery_person=request.user,
        date=date.today()
    )
    return Response(DeliveryRouteSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delivery_mark_delivered(request, pk):
    try:
        d = DeliveryAssignment.objects.get(id=pk, delivery_person=request.user)
    except DeliveryAssignment.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    d.status = "delivered"
    d.save()

    return Response({"message": "Marked delivered"}, status=200)


# ---------------------------------------------------------
# ✅ MANAGER — BILLS & STATS
# ---------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_generate_bills(request):
    subs = Subscription.objects.filter(status="active")

    for s in subs:
        Bill.objects.create(
            customer=s.customer,
            month=f"{date.today().year}-{date.today().month:02d}",
            total_amount=s.plan.price
        )

    return Response({"message": "Bills generated"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_stats(request):
    total_customers = User.objects.count()
    active_subs = Subscription.objects.filter(status="active").count()
    plans = Plan.objects.count()

    return Response({
        "customers": total_customers,
        "active_subscriptions": active_subs,
        "plans": plans
    })
