from datetime import date
from django.contrib.auth.models import User
from django.db.models import Sum, Max
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
    DeliveryBoyStats,
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

    # Check if already subscribed to this plan
    existing_sub = Subscription.objects.filter(customer=request.user, plan=plan, status="active").first()
    if existing_sub:
        return Response({"error": "Already subscribed to this plan"}, status=400)

    # Check if pending request exists
    pending_req = SubscribeRequest.objects.filter(customer=request.user, plan=plan, approved=None).first()
    if pending_req:
        return Response({"error": "Subscription request already pending"}, status=400)

    # Create subscribe request
    SubscribeRequest.objects.create(
        customer=request.user,
        plan=plan,
        approved=None
    )

    return Response({"message": "Subscription request sent"}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_subscribe_requests(request):
    reqs = SubscribeRequest.objects.filter(customer=request.user).select_related("plan").order_by("-created_at")
    return Response(SubscribeRequestSerializer(reqs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_pause_requests(request):
    reqs = PauseRequest.objects.filter(customer=request.user).order_by("-created_at")
    return Response(PauseRequestSerializer(reqs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_my_complaints(request):
    comps = Complaint.objects.filter(customer=request.user).order_by("-created_at")
    return Response(ComplaintSerializer(comps, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_bills_current_month(request):
    current_month = f"{date.today().year}-{date.today().month:02d}"
    try:
        bill = Bill.objects.get(customer=request.user, month=current_month)
        return Response(BillSerializer(bill).data)
    except Bill.DoesNotExist:
        return Response({}, status=200)


# ---------------------------------------------------------
# ✅ SUBSCRIPTION MANAGER — APPROVALS
# ---------------------------------------------------------

### ✅ Get all pending subscribe requests
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sm_requests_subscribe(request):
    # Get all pending requests (approved is None)
    reqs = SubscribeRequest.objects.filter(approved__isnull=True).select_related("customer", "plan").order_by("-created_at")
    serializer = SubscribeRequestSerializer(reqs, many=True)
    return Response(serializer.data)


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

    # Check if subscription already exists
    existing_sub = Subscription.objects.filter(
        customer=req.customer,
        plan=req.plan,
        status="active"
    ).first()

    if not existing_sub:
        # Create actual subscription
        Subscription.objects.create(
            customer=req.customer,
            plan=req.plan,
            status="active"
        )
        
        # Ensure customer has an address (create if doesn't exist)
        if not Address.objects.filter(customer=req.customer).exists():
            max_seq = Address.objects.aggregate(Max('sequence_hint'))['sequence_hint__max'] or 0
            Address.objects.create(
                customer=req.customer,
                house_number=f"Auto-{req.customer.id}",
                line=f"Address for {req.customer.username}",
                sequence_hint=max_seq + 1
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
    # Show all complaints so CSE can see full history
    qs = Complaint.objects.all().select_related("customer").order_by("-created_at")
    return Response(ComplaintSerializer(qs, many=True).data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def cse_update_complaint_status(request, pk):
    try:
        comp = Complaint.objects.get(id=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=404)

    status = request.data.get("status")
    if status:
        comp.status = status
        comp.save()

    return Response({"message": "Status updated"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cse_reply_complaint(request, pk):
    try:
        comp = Complaint.objects.get(id=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=404)

    reply = request.data.get("reply", "")
    if not reply:
        return Response({"error": "Reply message is required"}, status=400)

    comp.last_reply = reply
    comp.status = "closed"
    comp.save()

    return Response({"message": "Reply sent"}, status=200)


# ---------------------------------------------------------
# ✅ DELIVERY — Daily Route
# ---------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_today_summary(request):
    # Get all active subscriptions (not paused)
    active_subs = Subscription.objects.filter(status="active").select_related("customer", "plan")
    
    # Get all addresses for active customers, ordered by house number
    customer_ids = [sub.customer.id for sub in active_subs]
    addresses = Address.objects.filter(
        customer_id__in=customer_ids
    ).order_by("house_number")
    
    # Create delivery assignments for today if they don't exist
    today = date.today()
    assignments = []
    
    for addr in addresses:
        # Get customer's subscription to get bill value
        customer_sub = active_subs.filter(customer=addr.customer).first()
        if not customer_sub:
            continue
            
        # Get current month bill value
        current_month = f"{date.today().year}-{date.today().month:02d}"
        try:
            bill = Bill.objects.get(customer=addr.customer, month=current_month)
            bill_value = bill.total_amount
        except Bill.DoesNotExist:
            bill_value = customer_sub.plan.price if customer_sub else 0
        
        # Check if assignment already exists
        assignment, created = DeliveryAssignment.objects.get_or_create(
            delivery_person=request.user,
            customer=addr.customer,
            address=addr,
            date=today,
            defaults={
                "status": "pending",
                "publications": [],
                "value": bill_value
            }
        )
        
        # Update value if assignment already existed
        if not created and assignment.value == 0:
            assignment.value = bill_value
            assignment.save()
            
        assignments.append(assignment)
    
    # Sort assignments by house number (paused subscriptions are already excluded)
    def get_house_key(assignment):
        # Extract numbers from the beginning of the string
        import re
        house_num = str(assignment.address.house_number).strip()
        
        # Try to extract leading numbers
        match = re.match(r'^(\d+)', house_num)
        if match:
            # If house number starts with digits, use them for sorting
            return (0, int(match.group(1)), house_num)  # (is_number, numeric_value, original_string)
        
        # For non-numeric house numbers, sort them alphabetically after numbers
        return (1, 0, house_num)
    
    # Sort using our custom key function
    sorted_assignments = sorted(assignments, key=get_house_key)
    return Response(DeliveryRouteSerializer(sorted_assignments, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delivery_mark_delivered(request, pk):
    from django.utils import timezone
    
    try:
        d = DeliveryAssignment.objects.get(id=pk, delivery_person=request.user)
    except DeliveryAssignment.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    
    if d.status == "delivered":
        return Response({"error": "Already delivered"}, status=400)

    # Calculate commission (2.5% of bill value)
    # Get the customer's current month bill to calculate commission
    current_month = f"{date.today().year}-{date.today().month:02d}"
    try:
        bill = Bill.objects.get(customer=d.customer, month=current_month)
        bill_value = bill.total_amount
    except Bill.DoesNotExist:
        bill_value = d.value if d.value > 0 else 0
    
    from decimal import Decimal
    commission_rate = Decimal('0.025')  # Use Decimal for consistent type
    commission = bill_value * commission_rate
    d.value = bill_value  # Update assignment value with bill amount
    
    d.status = "delivered"
    d.commission = commission
    d.delivered_at = timezone.now()
    d.save()

    # Update delivery boy stats
    try:
        stats, created = DeliveryBoyStats.objects.get_or_create(
            delivery_person=request.user,
            defaults={"total_deliveries": 0, "total_commission": 0}
        )
        stats.total_deliveries += 1
        stats.total_commission = (Decimal(str(stats.total_commission or 0)) + commission).quantize(Decimal('0.01'))
        stats.save()

        # Update current month stats if the fields exist
        current_month = date.today().strftime('%Y-%m')
        if hasattr(stats, 'current_month_deliveries'):
            stats.current_month_deliveries += 1
        if hasattr(stats, 'current_month_commissions'):
            stats.current_month_commissions = float(getattr(stats, 'current_month_commissions', 0)) + float(commission)
        if hasattr(stats, 'last_activity'):
            from django.utils import timezone
            stats.last_activity = timezone.now()
        stats.save()

        return Response({
            "status": "success",
            "message": "Successfully marked as delivered",
            "data": {
                "delivery_id": d.id,
                "commission": float(commission),
                "total_deliveries": stats.total_deliveries,
                "total_commission": float(stats.total_commission) if stats.total_commission is not None else 0.0
            }
        }, status=200)
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Failed to update delivery status: {str(e)}"
        }, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_boy_stats(request):
    try:
        stats = DeliveryBoyStats.objects.get(delivery_person=request.user)
        return Response({
            "total_deliveries": stats.total_deliveries,
            "total_commission": float(stats.total_commission)
        })
    except DeliveryBoyStats.DoesNotExist:
        return Response({
            "total_deliveries": 0,
            "total_commission": 0
        })


# ---------------------------------------------------------
# ✅ MANAGER — BILLS & STATS
# ---------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_generate_bills(request):
    subs = Subscription.objects.filter(status="active")
    current_month = f"{date.today().year}-{date.today().month:02d}"
    count = 0

    for s in subs:
        # Check if bill already exists for this month
        existing_bill = Bill.objects.filter(customer=s.customer, month=current_month).first()
        if not existing_bill:
            Bill.objects.create(
                customer=s.customer,
                month=current_month,
                total_amount=s.plan.price
            )
            count += 1

    return Response({"message": f"Generated {count} new bills for {current_month}"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_stats(request):
    total_customers = User.objects.count()
    active_subs = Subscription.objects.filter(status="active").count()
    plans = Plan.objects.count()
    delivery_persons = User.objects.filter(groups__name='Delivery').count()
    
    # Calculate outstanding dues (sum of all unpaid bills)
    outstanding_dues = Bill.objects.filter(is_paid=False).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

    return Response({
        "customers": total_customers,
        "subscriptions": active_subs,
        "plans": plans,
        "delivery_persons": delivery_persons,
        "dues": float(outstanding_dues)  # Convert Decimal to float for JSON serialization
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_customers(request):
    """
    Get a list of all customers with their basic information and addresses
    """
    from accounts.models import AccountProfile
    
    # Get all customer profiles
    customer_profiles = AccountProfile.objects.filter(role='customer').select_related('user')
    
    # Prepare response data
    result = []
    for profile in customer_profiles:
        user = profile.user
        # Get user's address if exists
        address = Address.objects.filter(customer=user).first()
        
        result.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'date_joined': user.date_joined,
            'phone': profile.phone or '',
            'address': f"{address.house_number if address else ''} {address.line if address else ''}".strip() or 'No address'
        })
        
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_subscriptions(request):
    """
    Get a list of all subscriptions with related information
    """
    subscriptions = Subscription.objects.select_related('customer', 'plan').all()
    
    result = []
    for sub in subscriptions:
        result.append({
            'id': sub.id,
            'customer_id': sub.customer.id,
            'customer_name': f"{sub.customer.first_name or ''} {sub.customer.last_name or sub.customer.username}".strip(),
            'plan_id': sub.plan.id,
            'plan_title': sub.plan.title,
            'status': sub.status,
            'start_date': sub.start_date,
            'end_date': sub.end_date,
            'is_paused': sub.status == 'paused',
            'paused_until': None  # Not available in the current model
        })
    
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_list_bills(request):
    bills = Bill.objects.all().select_related("customer").order_by("-created_at")
    return Response(BillSerializer(bills, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manager_mark_bill_paid(request, pk):
    try:
        bill = Bill.objects.get(pk=pk)
        bill.is_paid = True
        bill.paid_date = date.today()
        bill.save()
        return Response({"message": "Bill marked as paid"})
    except Bill.DoesNotExist:
        return Response({"error": "Bill not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_commission_report(request):
    """
    Generate a commission report for delivery personnel.
    Returns a summary of deliveries and commissions for each delivery person.
    """
    try:
        # Get all delivery personnel with their stats
        delivery_stats = DeliveryBoyStats.objects.select_related('user').all()
        
        # Prepare the report data
        report_data = []
        for stat in delivery_stats:
            report_data.append({
                'delivery_person': stat.user.username,
                'total_deliveries': stat.total_deliveries,
                'total_commissions': stat.total_commission,
                'current_month_deliveries': stat.current_month_deliveries,
                'current_month_commissions': stat.current_month_commissions,
                'last_activity': stat.last_activity
            })
        
        return Response({
            'status': 'success',
            'report_date': date.today(),
            'data': report_data
        })
        
    except Exception as e:
        return Response(
            {'status': 'error', 'message': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
