from rest_framework.routers import DefaultRouter

from .views import (
    GenerationRecordViewSet,
    MeterReadingViewSet,
    MonthlySolarRecordViewSet,
    HistoricalBillEntryViewSet,
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

router.register(
    r"historical-bill-entries",
    HistoricalBillEntryViewSet,
    basename="historical-bill-entry"
)


urlpatterns = router.urls