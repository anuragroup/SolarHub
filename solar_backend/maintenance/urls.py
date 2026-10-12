
from rest_framework.routers import DefaultRouter
from .views import MaintenanceScheduleViewSet, BreakdownViewSet

router = DefaultRouter()
router.register(
    r"maintenance-schedules",
    MaintenanceScheduleViewSet,
    basename="maintenance-schedule",
)
router.register(
    r"breakdowns",
    BreakdownViewSet,
    basename="breakdown",
)

urlpatterns = router.urls
