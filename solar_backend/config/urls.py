from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("authentication.urls")),
    path("api/", include("sites.urls")),
    path("api/", include("generation.urls")),
    path("api/", include("maintenance.urls")),
]
