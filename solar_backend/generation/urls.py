from rest_framework.routers import DefaultRouter

from .views import (
    GenerationRecordViewSet,
    MeterReadingViewSet,
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

urlpatterns = router.urls