
from decimal import Decimal

from rest_framework import serializers

from .models import (
    GenerationRecord,
    MeterReading,
    MonthlySolarRecord,
)


# ==========================================================
# DAILY GENERATION SERIALIZER
# ==========================================================

class GenerationRecordSerializer(serializers.ModelSerializer):

    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )

    performance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = GenerationRecord

        fields = [
            "id",
            "site",
            "site_name",
            "generation_date",
            "generation_kwh",
            "expected_generation_kwh",
            "performance_percentage",
            "peak_power_kw",
            "source",
            "sync_status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "site_name",
            "performance_percentage",
            "created_at",
            "updated_at",
        ]

    def get_performance_percentage(self, obj):

        if (
            obj.expected_generation_kwh is None
            or obj.expected_generation_kwh == 0
        ):
            return None

        percentage = (
            obj.generation_kwh
            / obj.expected_generation_kwh
        ) * 100

        return round(float(percentage), 2)


# ==========================================================
# METER READING SERIALIZER
# ==========================================================

class MeterReadingSerializer(serializers.ModelSerializer):

    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )

    logged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MeterReading

        fields = [
            "id",
            "site",
            "site_name",
            "reading_date",
            "meter_serial_number",
            "import_reading_kwh",
            "export_reading_kwh",
            "source",
            "logged_by",
            "logged_by_name",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "site_name",
            "logged_by_name",
            "created_at",
            "updated_at",
        ]

    def get_logged_by_name(self, obj):

        if not obj.logged_by:
            return None

        return (
            obj.logged_by.get_full_name()
            or obj.logged_by.username
        )


# ==========================================================
# MONTHLY SOLAR RECORD SERIALIZER
# ==========================================================

class MonthlySolarRecordSerializer(serializers.ModelSerializer):

    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )

    site_asset_code = serializers.CharField(
        source="site.asset_code",
        read_only=True,
    )

    entered_by_name = serializers.SerializerMethodField()

    performance_percentage = serializers.FloatField(
        read_only=True,
        allow_null=True,
    )

    # ------------------------------------------------------
    # CALCULATED BILL FIELDS
    # ------------------------------------------------------

    bill_value = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    total_bill = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:

        model = MonthlySolarRecord

        fields = [
            "id",

            # Site and period
            "site",
            "site_name",
            "site_asset_code",
            "year",
            "month",

            # Entry source
            "entry_mode",

            # Generation
            "expected_generation_kwh",
            "actual_generation_kwh",

            # Monthly Import / Export
            "actual_import_units",
            "actual_export_units",

            # Import rate
            "import_rate",

            # Bill calculation
            "bill_value",
            "balance_bill",
            "total_bill",

            # Performance
            "performance_percentage",

            # Legacy fields - historical data only
            "import_opening_kwh",
            "import_closing_kwh",
            "export_opening_kwh",
            "export_closing_kwh",
            "export_rate",
            "bill_without_solar",
            "bill_with_solar",

            # Other
            "remarks",
            "entered_by",
            "entered_by_name",

            # Audit
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "site_name",
            "site_asset_code",

            # Expected generation comes from Site Master
            "expected_generation_kwh",

            # Automatically calculated
            "bill_value",
            "total_bill",
            "performance_percentage",

            # Legacy fields are retained for historical data
            "import_opening_kwh",
            "import_closing_kwh",
            "export_opening_kwh",
            "export_closing_kwh",
            "export_rate",
            "bill_without_solar",
            "bill_with_solar",

            "entered_by",
            "entered_by_name",
            "created_at",
            "updated_at",
        ]

    # ======================================================
    # ENTERED BY NAME
    # ======================================================

    def get_entered_by_name(self, obj):

        if not obj.entered_by:
            return None

        return (
            obj.entered_by.get_full_name()
            or obj.entered_by.username
        )

    # ======================================================
    # VALIDATION
    # ======================================================

    def validate(self, attrs):

        instance = self.instance

        def get_value(field):

            if field in attrs:
                return attrs[field]

            if instance:
                return getattr(instance, field)

            return None

        # --------------------------------------------------
        # Validate non-negative monthly inputs
        # --------------------------------------------------

        numeric_fields = [
            "actual_generation_kwh",
            "actual_import_units",
            "actual_export_units",
            "import_rate",
            "balance_bill",
        ]

        for field in numeric_fields:

            value = get_value(field)

            if value is not None and value < Decimal("0"):
                raise serializers.ValidationError({
                    field: "This value cannot be negative."
                })

        # --------------------------------------------------
        # Validate year
        # --------------------------------------------------

        year = get_value("year")

        if year is not None and year < 2000:
            raise serializers.ValidationError({
                "year": "Please enter a valid year."
            })

        # --------------------------------------------------
        # Validate month
        # --------------------------------------------------

        month = get_value("month")

        if month is not None and not 1 <= month <= 12:
            raise serializers.ValidationError({
                "month": "Month must be between 1 and 12."
            })

        return attrs

    # ======================================================
    # CREATE MONTHLY RECORD
    # ======================================================

    def create(self, validated_data):

        site = validated_data["site"]

        # Automatically retrieve Expected Generation
        # from Site Master.

        validated_data["expected_generation_kwh"] = (
            site.expected_monthly_generation
            or Decimal("0")
        )

        # Import Rate is entered manually each month.
        # Do not automatically replace it with Site export_rate.

        return super().create(validated_data)

    # ======================================================
    # UPDATE MONTHLY RECORD
    # ======================================================

    def update(self, instance, validated_data):

        # Expected Generation is a snapshot from Site Master.
        # Preserve it when updating an existing monthly record.

        validated_data.pop("expected_generation_kwh", None)

        return super().update(instance, validated_data)
