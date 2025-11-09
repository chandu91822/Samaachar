from django.urls import path
from . import views

urlpatterns = [
    # ---------------- Plans ----------------
    path("plans/", views.plans_list),
    path("plans/add/", views.plan_add),
    path("plans/update/<int:pk>/", views.plan_update),
    path("plans/delete/<int:pk>/", views.plan_delete),

    # ---------------- Customer ----------------
    path("customer/subscriptions/", views.customer_subscriptions),
    path("customer/subscribe/", views.customer_subscribe),
    path("customer/subscribe-requests/", views.customer_subscribe_requests),
    path("customer/change-request/", views.customer_change_request),
    path("customer/pause-request/", views.customer_pause_request),
    path("customer/pause-requests/", views.customer_pause_requests),
    path("customer/my-complaints/", views.customer_my_complaints),
    path("customer/bills/current-month/", views.customer_bills_current_month),

    # Complaints
    path("customer/complaints/", views.complaint_create),

    # ---------------- CSE Complaints ----------------
    path("cse/complaints/", views.cse_list_complaints),
    path("cse/complaints/<int:pk>/", views.cse_update_complaint_status),
    path("cse/complaints/<int:pk>/reply/", views.cse_reply_complaint),

    # ---------------- Subscription Manager ----------------
    path("sm/requests/subscribe/", views.sm_requests_subscribe),
    path("sm/requests/subscribe/<int:pk>/approve/", views.sm_approve_subscribe),
    path("sm/requests/subscribe/<int:pk>/reject/", views.sm_reject_subscribe),

    path("sm/requests/change/", views.sm_requests_change),
    path("sm/requests/change/<int:pk>/approve/", views.sm_approve_change),
    path("sm/requests/change/<int:pk>/reject/", views.sm_reject_change),

    path("sm/requests/pause/", views.sm_requests_pause),
    path("sm/requests/pause/<int:pk>/approve/", views.sm_approve_pause),
    path("sm/requests/pause/<int:pk>/reject/", views.sm_reject_pause),

    # ---------------- Manager ----------------
    path("manager/generate-bills/", views.manager_generate_bills),
    path("manager/stats/", views.manager_stats),
    path("manager/customers/", views.manager_customers),
    path("manager/subscriptions/", views.manager_subscriptions),
    path("manager/bills/", views.manager_list_bills),
    path("manager/bills/<int:pk>/mark-paid/", views.manager_mark_bill_paid),
    path("manager/commission-report/", views.manager_commission_report),

    # ---------------- Delivery ----------------
    path("delivery/today/summary/", views.delivery_today_summary),
    path("delivery/mark/<int:pk>/", views.delivery_mark_delivered),
    path("delivery/stats/", views.delivery_boy_stats),
]
