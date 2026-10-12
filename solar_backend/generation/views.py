from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import GenerationRecord, MeterReading
from .serializers import (
    GenerationRecordSerializer,
    MeterReadingSerializer,
)


class GenerationRecordViewSet(viewsets.ModelViewSet):
    queryset = GenerationRecord.objects.select_related("site").all()
    serializer_class = GenerationRecordSerializer
    permission_classes = [IsAuthenticated]


class MeterReadingViewSet(viewsets.ModelViewSet):
    queryset = MeterReading.objects.select_related(
        "site",
        "logged_by",
    ).all()

    serializer_class = MeterReadingSerializer
    permission_classes = [IsAuthenticated]