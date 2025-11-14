from django.contrib import admin
from .models import (
    Plan, Subscription, Address, DeliveryAssignment,
    DeliveryBoyStats, Bill, Payment, Complaint,
    SubscribeRequest, ChangeRequest, PauseRequest
)

# ------------------ SIMPLE REGISTRATION ------------------

admin.site.register(Plan)
admin.site.register(Subscription)
admin.site.register(Address)
admin.site.register(DeliveryAssignment)
admin.site.register(DeliveryBoyStats)
admin.site.register(Bill)
admin.site.register(Payment)
admin.site.register(Complaint)
admin.site.register(SubscribeRequest)
admin.site.register(ChangeRequest)
admin.site.register(PauseRequest)



