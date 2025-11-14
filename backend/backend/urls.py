from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ Authentication routes (Register + Login)
   path("accounts/", include("accounts.urls")),


    # ✅ Newspaper Automation API
    path("api/", include("api.urls")),
   

]
