from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils.timezone import now

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth.models import User

from .permissions import IsSubscriptionManager, IsManager

from .models import (
    Plan,
    Subscription,
    Address,
    DeliveryAssignment,
    Bill,
    Payment,
    Complaint,
    SubscribeRequest,
    ChangeRequest,
    PauseRequest,
)

from .serializers import (
    PlanSerializer,
    SubscriptionSerializer,
    ComplaintSerializer,
    SubscribeRequestSerializer,
    ChangeRequestSerializer,
    PauseRequestSerializer,
    BillSerializer,
    PaymentSerializer,
    DeliveryRouteSerializer,
)

# ---------------------------------------------------------
# PUBLIC PLANS
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def plans_list(request):
    qs = Plan.objects.filter(is_active=True).order_by("id")
    return Response(PlanSerializer(qs, many=True).data)

@api_view(["POST"])
@permission_classes([AllowAny])
def plan_add(request):
    ser = PlanSerializer(data=request.data)
    if ser.is_valid():
        ser.save()
        return Response({"message": "Plan added"}, status=201)
    return Response(ser.errors, status=400)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def plan_update(request, id):
    try:
        plan = Plan.objects.get(id=id)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)
    ser = PlanSerializer(plan, data=request.data, partial=True)
    if ser.is_valid():
        ser.save()
        return Response({"message": "Plan updated"})
    return Response(ser.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def plan_delete(request, id):
    try:
        plan = Plan.objects.get(id=id)
    except Plan.DoesNotExist:
        return Response({"error": "Plan not found"}, status=404)
    plan.delete()
    return Response({"message": "Plan deleted"})

# ---------------------------------------------------------
# CUSTOMER
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_subscriptions(request):
    qs = Subscription.objects.filter(customer=request.user).order_by("-id")
    return Response(SubscriptionSerializer(qs, many=True).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_subscribe_request(request):
    plan_id = request.data.get("plan_id")
    if not plan_id:
        return Response({"error": "plan_id required"}, status=400)

    if not Plan.objects.filter(id=plan_id, is_active=True).exists():
        return Response({"error": "Plan not found/active"}, status=404)

    if Subscription.objects.filter(customer=request.user, plan_id=plan_id, status="active").exists():
        return Response({"message": "Already subscribed"}, status=200)

    SubscribeRequest.objects.create(customer=request.user, plan_id=plan_id)
    return Response({"message": "Subscription request created"}, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_change_request(request):
    plan_id = request.data.get("plan_id")
    action = request.data.get("action")

    if action not in ("add", "remove"):
        return Response({"error": "action must be add/remove"}, status=400)

    if not Plan.objects.filter(id=plan_id).exists():
        return Response({"error": "Plan not found"}, status=404)

    eff = date.today() + timedelta(days=7)
    ChangeRequest.objects.create(
        customer=request.user,
        plan_id=plan_id,
        action=action,
        effective_date=eff
    )
    return Response({"message": "Change request created"}, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_pause_request(request):
    try:
        start = request.data["start_date"]
        end = request.data["end_date"]
    except KeyError:
        return Response({"error": "start_date & end_date required"}, status=400)

    reason = request.data.get("reason", "")
    PauseRequest.objects.create(
        customer=request.user,
        start_date=start,
        end_date=end,
        reason=reason,
    )
    return Response({"message": "Pause request created"}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_current_bill(request):
    month = date.today().strftime("%Y-%m")
    bill = Bill.objects.filter(customer=request.user, month=month).first()
    return Response(BillSerializer(bill).data if bill else {})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_create(request):
    try:
        bill_id = int(request.data["bill_id"])
        amount = Decimal(str(request.data["amount"]))
        mode = request.data["mode"]
    except:
        return Response({"error": "bill_id, amount, mode required"}, status=400)

    if mode not in ("cash", "cheque"):
        return Response({"error": "invalid mode"}, status=400)

    try:
        bill = Bill.objects.get(id=bill_id, customer=request.user)
    except Bill.DoesNotExist:
        return Response({"error": "Bill not found"}, status=404)

    receipt = f"RCPT{int(now().timestamp())}"

    Payment.objects.create(
        bill=bill,
        amount=amount,
        mode=mode,
        cheque_no=request.data.get("cheque_no", ""),
        receipt_no=receipt,
    )

    total_paid = bill.payments.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    if total_paid >= bill.total_amount:
        bill.is_paid = True
        bill.save()

    return Response({"message": "Payment recorded"}, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complaint_create(request):
    msg = request.data.get("message", "").strip()
    if not msg:
        return Response({"error": "message required"}, status=400)
    c = Complaint.objects.create(customer=request.user, message=msg)
    return Response({"message": "Complaint submitted", "id": c.id})

# ---------------------------------------------------------
# CSE
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cse_list_complaints(request):
    qs = Complaint.objects.all().order_by("-created_at")
    return Response(ComplaintSerializer(qs, many=True).data)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def cse_update_complaint_status(request, pk):
    try:
        c = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    status_value = request.data.get("status")
    if status_value not in ("open", "in_progress", "closed"):
        return Response({"error": "invalid status"}, status=400)
    c.status = status_value
    c.save()
    return Response({"message": "Status updated"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cse_reply_complaint(request, pk):
    try:
        c = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    reply = request.data.get("reply", "").strip()
    if not reply:
        return Response({"error": "reply required"}, status=400)
    c.last_reply = reply
    if c.status == "open":
        c.status = "in_progress"
    c.save()
    return Response({"message": "Reply sent"})

# ---------------------------------------------------------
# SUBSCRIPTION MANAGER
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_subscribe(request):
    qs = SubscribeRequest.objects.filter(approved__isnull=True)
    return Response(SubscribeRequestSerializer(qs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_change(request):
    qs = ChangeRequest.objects.filter(approved__isnull=True)
    return Response(ChangeRequestSerializer(qs, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_pause(request):
    qs = PauseRequest.objects.filter(approved__isnull=True)
    return Response(PauseRequestSerializer(qs, many=True).data)

def _approve_subscribe(req):
    Subscription.objects.get_or_create(
        customer=req.customer, plan=req.plan, defaults={"status": "active"}
    )
    req.approved = True
    req.save()

def _apply_change(req):
    if req.action == "add":
        Subscription.objects.get_or_create(
            customer=req.customer, plan=req.plan, defaults={"status": "active"}
        )
    else:
        Subscription.objects.filter(
            customer=req.customer, plan=req.plan, status__in=["active", "paused"]
        ).update(status="stopped", end_date=date.today())
    req.approved = True
    req.save()

def _approve_pause(req):
    Subscription.objects.filter(customer=req.customer, status="active").update(status="paused")
    req.approved = True
    req.save()

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sm_request_action(request, req_type, pk, action):
    Model = {"subscribe": SubscribeRequest, "change": ChangeRequest, "pause": PauseRequest}.get(req_type)
    if not Model:
        return Response({"error": "invalid req_type"}, status=400)

    try:
        req = Model.objects.get(pk=pk, approved__isnull=True)
    except Model.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    if action == "approve":
        if req_type == "subscribe":
            _approve_subscribe(req)
        elif req_type == "change":
            _apply_change(req)
        else:
            _approve_pause(req)
    elif action == "reject":
        req.approved = False
        req.save()
    else:
        return Response({"error": "invalid action"}, status=400)

    return Response({"message": "Done"})

# ---------------------------------------------------------
# MANAGER
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_stats(request):
    customers = User.objects.filter(profile__role="customer").count()
    subs = Subscription.objects.filter(status="active").count()
    delivery_people = User.objects.filter(profile__role="delivery").count()
    dues = Bill.objects.filter(is_paid=False).aggregate(s=Sum("total_amount"))["s"] or Decimal("0")
    return Response({
        "customers": customers,
        "subscriptions": subs,
        "delivery_persons": delivery_people,
        "dues": float(dues),
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_generate_bills(request):
    month = date.today().strftime("%Y-%m")
    cust_ids = User.objects.filter(profile__role="customer").values_list("id", flat=True)

    for uid in cust_ids:
        total = sum(
            Subscription.objects.filter(customer_id=uid, status="active")
            .values_list("plan__price", flat=True)
        )
        Bill.objects.update_or_create(
            customer_id=uid, month=month,
            defaults={"total_amount": Decimal(total or 0), "is_paid": False},
        )
    return Response({"message": "Bills generated"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_send_reminders(request):
    today = date.today()
    for b in Bill.objects.filter(is_paid=False):
        y, m = map(int, b.month.split("-"))
        months_due = (today.year - y) * 12 + (today.month - m)

        if months_due >= 2:
            Subscription.objects.filter(customer=b.customer, status="active").update(
                status="stopped", end_date=today
            )
    return Response({"message": "Reminders processed"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_compute_commission(request):
    month_prefix = date.today().strftime("%Y-%m")
    result = {}

    delivery_users = User.objects.filter(profile__role="delivery")
    for user in delivery_users:
        total_value = DeliveryAssignment.objects.filter(
            delivery_person=user,
            date__startswith=month_prefix,
            status="delivered",
        ).aggregate(s=Sum("value"))["s"] or Decimal("0")

        result[user.username] = float(Decimal(total_value) * Decimal("0.025"))

    return Response(result)

# ---------------------------------------------------------
# DELIVERY
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_today_summary(request):
    today = date.today()
    qs = DeliveryAssignment.objects.filter(delivery_person=request.user, date=today)
    total_deliveries = qs.count()
    publications = sum(len(x.publications) for x in qs)
    total_value = qs.aggregate(s=Sum("value"))["s"] or Decimal("0")
    commission = Decimal(total_value) * Decimal("0.025")

    return Response({
        "total_deliveries": total_deliveries,
        "publications": publications,
        "commission": float(commission),
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_today_route(request):
    today = date.today()
    qs = DeliveryAssignment.objects.filter(
        delivery_person=request.user, date=today
    ).select_related("address").order_by("address__sequence_hint", "address__line", "id")

    data = []
    for x in qs:
        data.append({
            "id": x.id,
            "address": x.address.line,
            "publications": x.publications,
            "status": x.status,
        })
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delivery_mark_delivered(request, pk):
    try:
        item = DeliveryAssignment.objects.get(pk=pk, delivery_person=request.user)
    except DeliveryAssignment.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    item.status = "delivered"
    item.save()
    return Response({"message": "Marked delivered"})
