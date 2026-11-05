
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import (
    GenerationRecord,
    MeterReading,
    MonthlySolarRecord,
)

from .serializers import (
    GenerationRecordSerializer,
    MeterReadingSerializer,
    MonthlySolarRecordSerializer,
)


# ==========================================================
# DAILY GENERATION API
# ==========================================================

class GenerationRecordViewSet(viewsets.ModelViewSet):

    queryset = GenerationRecord.objects.select_related(
        "site"
    ).all()

    serializer_class = GenerationRecordSerializer

    permission_classes = [IsAuthenticated]


# ==========================================================
# METER READING API
# ==========================================================

class MeterReadingViewSet(viewsets.ModelViewSet):

    queryset = MeterReading.objects.select_related(
        "site",
        "logged_by",
    ).all()

    serializer_class = MeterReadingSerializer

    permission_classes = [IsAuthenticated]


# ==========================================================
# MONTHLY SOLAR RECORD API
# ==========================================================

class MonthlySolarRecordViewSet(viewsets.ModelViewSet):

    serializer_class = MonthlySolarRecordSerializer

    permission_classes = [IsAuthenticated]

    queryset = MonthlySolarRecord.objects.select_related(
        "site",
        "entered_by",
    ).all()

    # ------------------------------------------------------
    # FILTER MONTHLY RECORDS
    # ------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        # Filter by site
        site_id = self.request.query_params.get("site")

        if site_id:
            queryset = queryset.filter(site_id=site_id)

        # Filter by year
        year = self.request.query_params.get("year")

        if year:
            queryset = queryset.filter(year=year)

        # Filter by month
        month = self.request.query_params.get("month")

        if month:
            queryset = queryset.filter(month=month)

        return queryset

    # ------------------------------------------------------
    # SAVE LOGGED-IN USER
    # ------------------------------------------------------

    def perform_create(self, serializer):

        serializer.save(
            entered_by=self.request.user
        )
