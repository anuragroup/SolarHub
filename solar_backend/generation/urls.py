from rest_framework.routers import DefaultRouter

from .views import (
    GenerationRecordViewSet,
    MeterReadingViewSet,
    MonthlySolarRecordViewSet,
)


router = DefaultRouter()

router.register(
    r"generation",
    GenerationRecordViewSet,
    basename="generation",
)

router.register(
    r"meter-readings",
    MeterReadingViewSet,
    basename="meter-reading",
)

# Monthly Solar Records
router.register(
    r"monthly-solar-records",
    MonthlySolarRecordViewSet,
    basename="monthly-solar-record",
)

urlpatterns = router.urls