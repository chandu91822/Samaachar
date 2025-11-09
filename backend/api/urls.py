from django.urls import path
from . import views

urlpatterns = [
    # Plans
    path("plans/", views.plans_list),
    path("plans/add/", views.plan_add),
    path("plans/update/<int:id>/", views.plan_update),
    path("plans/delete/<int:id>/", views.plan_delete),

    # Customer
    path("customer/subscriptions/", views.customer_subscriptions),
    path("customer/subscribe/", views.customer_subscribe_request),
    path("customer/subscribe-requests/", views.customer_subscribe_requests),
    path("customer/change-request/", views.customer_change_request),
    path("customer/pause-request/", views.customer_pause_request),
    path("customer/pause-requests/", views.customer_pause_requests),
    path("customer/bills/current-month/", views.customer_current_bill),
    path("payments/", views.payment_create),

    # Complaints
    path("customer/complaints/", views.complaint_create),
    path("customer/my-complaints/", views.customer_complaints),
    path("cse/complaints/", views.cse_list_complaints),
    path("cse/complaints/<int:pk>/", views.cse_update_complaint_status),
    path("cse/complaints/<int:pk>/reply/", views.cse_reply_complaint),

    # Subscription Manager approvals
    path("sm/requests/subscribe/", views.sm_requests_subscribe),
    path("sm/requests/change/", views.sm_requests_change),
    path("sm/requests/pause/", views.sm_requests_pause),
    path("sm/requests/<str:req_type>/<int:pk>/<str:action>/", views.sm_request_action),

    # Manager
    path("manager/stats/", views.manager_stats),
    path("manager/generate-bills/", views.manager_generate_bills),
    path("manager/send-reminders/", views.manager_send_reminders),
    path("manager/compute-commission/", views.manager_compute_commission),
    path("manager/customers/", views.manager_all_customers),
    path("manager/subscriptions/", views.manager_all_subscriptions),
    path("manager/deliveries/", views.manager_all_deliveries),
    path("manager/commission-report/", views.manager_commission_report),

    # Delivery
    path("delivery/today/summary/", views.delivery_today_summary),
    path("delivery/today/route/", views.delivery_today_route),
    path("delivery/mark/<int:pk>/", views.delivery_mark_delivered),
]
