
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import (
    GenerationRecord,
    MeterReading,
    MonthlySolarRecord,
    HistoricalBillEntry,
    MonthlyElectricityIncome,
)

from .serializers import (
    GenerationRecordSerializer,
    MeterReadingSerializer,
    MonthlySolarRecordSerializer,
    HistoricalBillEntrySerializer,
    MonthlyElectricityIncomeSerializer,
)
from decimal import Decimal

from django.db.models import Sum

from rest_framework.decorators import action
from rest_framework.response import Response

from sites.models import Site

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


    # ------------------------------------------------------
    # SITE-WISE FINANCIAL SUMMARY
    # ------------------------------------------------------


    # ------------------------------------------------------
    # SITE-WISE FINANCIAL SUMMARY
    # ------------------------------------------------------

    @action(
        detail=False,
        methods=["get"],
        url_path="site-financial-summary",
    )
    def site_financial_summary(self, request):

        # --------------------------------------------------
        # 1. HISTORICAL ANNUAL BILL VALUES
        # --------------------------------------------------

        historical_totals = (
            HistoricalBillEntry.objects
            .values("site_id")
            .annotate(
                historical_bill_value=Sum("bill_value")
            )
        )

        historical_map = {
            item["site_id"]: (
                item["historical_bill_value"] or Decimal("0.00")
            )
            for item in historical_totals
        }

        # --------------------------------------------------
        # 2. SOLARHUB MONTHLY BILL VALUES
        # --------------------------------------------------

        monthly_totals = (
            MonthlySolarRecord.objects
            .values("site_id")
            .annotate(
                monthly_bill_value=Sum("total_bill")
            )
        )

        monthly_map = {
            item["site_id"]: (
                item["monthly_bill_value"] or Decimal("0.00")
            )
            for item in monthly_totals
        }

        # --------------------------------------------------
        # 3. SITE-WISE FINANCIAL PERFORMANCE
        # --------------------------------------------------

        sites = Site.objects.all().order_by("name")

        site_results = []

        total_investment = Decimal("0.00")
        total_historical_bill = Decimal("0.00")
        total_monthly_bill = Decimal("0.00")
        total_cumulative_bill = Decimal("0.00")

        for site in sites:

            investment = (
                site.project_investment or Decimal("0.00")
            )

            historical_bill = historical_map.get(
                site.id,
                Decimal("0.00")
            )

            monthly_bill = monthly_map.get(
                site.id,
                Decimal("0.00")
            )

            # Historical + SolarHub monthly bill
            cumulative_bill = historical_bill + monthly_bill

            # Investment comparison
            if investment > 0:
                percentage = (
                    cumulative_bill / investment
                ) * Decimal("100")
            else:
                percentage = None

            total_investment += investment
            total_historical_bill += historical_bill
            total_monthly_bill += monthly_bill
            total_cumulative_bill += cumulative_bill

            site_results.append({
                "site_id": site.id,
                "site_name": site.name,

                "project_investment": str(investment),

                "historical_bill_value": str(
                    historical_bill
                ),

                "monthly_bill_value": str(
                    monthly_bill
                ),

                "cumulative_bill_value": str(
                    cumulative_bill
                ),

                "investment_percentage": (
                    round(float(percentage), 2)
                    if percentage is not None
                    else None
                ),
            })

        # --------------------------------------------------
        # 4. OVERALL FINANCIAL PERFORMANCE
        # --------------------------------------------------

        if total_investment > 0:
            overall_percentage = (
                total_cumulative_bill / total_investment
            ) * Decimal("100")
        else:
            overall_percentage = None

        return Response({

            "total_sites": len(site_results),

            "total_investment": str(
                total_investment
            ),

            "total_historical_bill": str(
                total_historical_bill
            ),

            "total_monthly_bill": str(
                total_monthly_bill
            ),

            "total_cumulative_bill": str(
                total_cumulative_bill
            ),

            "overall_percentage": (
                round(float(overall_percentage), 2)
                if overall_percentage is not None
                else None
            ),

            "sites": site_results,
        })



##################################################

class HistoricalBillEntryViewSet(viewsets.ModelViewSet):

    serializer_class = HistoricalBillEntrySerializer
    permission_classes = [IsAuthenticated]

    queryset = HistoricalBillEntry.objects.select_related(
        "site",
        "entered_by"
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()

        site_id = self.request.query_params.get("site")
        year = self.request.query_params.get("year")

        if site_id:
            queryset = queryset.filter(site_id=site_id)

        if year:
            queryset = queryset.filter(year=year)

        return queryset.order_by("site__name", "-year")

    def perform_create(self, serializer):
        serializer.save(entered_by=self.request.user)



#######################################################


# ==========================================================
# MONTHLY ELECTRICITY INCOME API
# ==========================================================

class MonthlyElectricityIncomeViewSet(viewsets.ModelViewSet):

    serializer_class = MonthlyElectricityIncomeSerializer

    permission_classes = [IsAuthenticated]

    queryset = MonthlyElectricityIncome.objects.select_related(
        "site",
        "entered_by",
    ).all()

    # ------------------------------------------------------
    # FILTER INCOME RECORDS
    # ------------------------------------------------------

    def get_queryset(self):

        queryset = super().get_queryset()

        site_id = self.request.query_params.get("site")
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")

        if site_id:
            queryset = queryset.filter(site_id=site_id)

        if year:
            queryset = queryset.filter(year=year)

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
