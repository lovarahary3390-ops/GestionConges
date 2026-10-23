
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "message": "API Gestion des Congés",
        "status": "online",
        "admin": "/admin/",
        "api": "/api/",
    })


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/", include("employees.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("leaves.urls")),
    path("api/", include("approvals.urls")),
    path("api/", include("notifications.urls")),
]
