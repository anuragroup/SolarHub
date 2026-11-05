
from decimal import Decimal

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from sites.models import Site


# ==========================================================
# DAILY GENERATION RECORD
# ==========================================================

class GenerationRecord(models.Model):

    SOURCE_CHOICES = [
        ("API", "Vendor API"),
        ("MANUAL", "Manual Entry"),
    ]

    SYNC_STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("PENDING", "Pending"),
        ("FAILED", "Failed"),
    ]

    site = models.ForeignKey(
        Site,
        on_delete=models.PROTECT,
        related_name="generation_records",
    )

    generation_date = models.DateField()

    generation_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Actual solar generation in kWh",
    )

    expected_generation_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Expected generation in kWh",
    )

    peak_power_kw = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Peak power generated in kW",
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="API",
    )

    sync_status = models.CharField(
        max_length=20,
        choices=SYNC_STATUS_CHOICES,
        default="SUCCESS",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-generation_date", "-id"]

        constraints = [
            models.UniqueConstraint(
                fields=["site", "generation_date"],
                name="unique_site_generation_date",
            )
        ]

    def __str__(self):
        return (
            f"{self.site.name} - "
            f"{self.generation_date} - "
            f"{self.generation_kwh} kWh"
        )


# ==========================================================
# METER READING
# ==========================================================

class MeterReading(models.Model):

    SOURCE_CHOICES = [
        ("MANUAL", "Manual Entry"),
        ("API", "Meter API"),
    ]

    site = models.ForeignKey(
        Site,
        on_delete=models.PROTECT,
        related_name="meter_readings",
    )

    reading_date = models.DateField()

    meter_serial_number = models.CharField(
        max_length=100,
        blank=True,
    )

    import_reading_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cumulative electricity imported from the grid in kWh",
    )

    export_reading_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cumulative electricity exported to the grid in kWh",
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="MANUAL",
    )

    logged_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="meter_readings",
    )

    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-reading_date", "-id"]

    def __str__(self):
        return f"{self.site.name} - {self.reading_date}"


# ==========================================================
# MONTHLY SOLAR RECORD
# ==========================================================

class MonthlySolarRecord(models.Model):

    ENTRY_MODE_CHOICES = [
        ("API", "Vendor API"),
        ("DAILY_MANUAL", "Daily Manual"),
        ("MONTHLY_MANUAL", "Monthly Manual"),
    ]

    # ------------------------------------------------------
    # SITE & PERIOD
    # ------------------------------------------------------

    site = models.ForeignKey(
        Site,
        on_delete=models.PROTECT,
        related_name="monthly_solar_records",
    )

    year = models.PositiveIntegerField()

    month = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(12),
        ]
    )

    # ------------------------------------------------------
    # DATA SOURCE
    # ------------------------------------------------------

    entry_mode = models.CharField(
        max_length=20,
        choices=ENTRY_MODE_CHOICES,
        default="MONTHLY_MANUAL",
    )

    # ------------------------------------------------------
    # SOLAR GENERATION
    # ------------------------------------------------------

    expected_generation_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Expected monthly generation snapshot in kWh",
    )

    actual_generation_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Actual monthly solar generation in kWh",
    )

    # ------------------------------------------------------
    # NEW MONTHLY IMPORT / EXPORT INPUTS
    # ------------------------------------------------------

    actual_import_units = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Monthly electricity imported from the grid in kWh",
    )

    actual_export_units = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Monthly electricity exported to the grid in kWh",
    )

    # ------------------------------------------------------
    # IMPORT RATE
    # ------------------------------------------------------

    import_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Import electricity rate per kWh",
    )

    # ------------------------------------------------------
    # AUTOMATIC BILL CALCULATIONS
    # ------------------------------------------------------

    bill_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Automatically calculated bill value",
    )

    balance_bill = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Additional balance bill entered manually",
    )

    total_bill = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text="Automatically calculated total bill",
    )

    # ------------------------------------------------------
    # LEGACY METER READING FIELDS
    # Retained to protect existing monthly records.
    # New entries use actual_import_units and actual_export_units.
    # ------------------------------------------------------

    import_opening_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    import_closing_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    export_opening_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    export_closing_kwh = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Legacy fields retained for existing data.

    export_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    bill_without_solar = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    bill_with_solar = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # ------------------------------------------------------
    # REMARKS
    # ------------------------------------------------------

    remarks = models.TextField(blank=True)

    # ------------------------------------------------------
    # USER
    # ------------------------------------------------------

    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="monthly_solar_records",
    )

    # ------------------------------------------------------
    # AUDIT
    # ------------------------------------------------------

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ------------------------------------------------------
    # DATABASE CONSTRAINTS
    # ------------------------------------------------------

    class Meta:
        ordering = ["-year", "-month", "site__name"]

        constraints = [
            models.UniqueConstraint(
                fields=["site", "year", "month"],
                name="unique_monthly_solar_site_record",
            )
        ]

    # ------------------------------------------------------
    # CALCULATED BILL VALUE
    # Formula:
    # (Actual Generation - Export + Import) * Import Rate
    # ------------------------------------------------------

    @property
    def calculated_bill_value(self):

        units = (
            self.actual_generation_kwh
            - self.actual_export_units
            + self.actual_import_units
        )

        return units * self.import_rate

    # ------------------------------------------------------
    # CALCULATED TOTAL BILL
    # Formula:
    # Bill Value + Balance Bill
    # ------------------------------------------------------

    @property
    def calculated_total_bill(self):

        return (
            self.calculated_bill_value
            + self.balance_bill
        )

    # ------------------------------------------------------
    # LEGACY METER UNIT CALCULATIONS
    # Used only for historical opening/closing readings.
    # ------------------------------------------------------

    @property
    def legacy_import_units(self):

        if (
            self.import_opening_kwh is None
            or self.import_closing_kwh is None
        ):
            return None

        return (
            self.import_closing_kwh
            - self.import_opening_kwh
        )

    @property
    def legacy_export_units(self):

        if (
            self.export_opening_kwh is None
            or self.export_closing_kwh is None
        ):
            return None

        return (
            self.export_closing_kwh
            - self.export_opening_kwh
        )

    # ------------------------------------------------------
    # LEGACY EXPORT VALUE
    # ------------------------------------------------------

    @property
    def export_value(self):

        units = self.legacy_export_units

        if units is None:
            return None

        return units * self.export_rate

    # ------------------------------------------------------
    # GENERATION PERFORMANCE
    # ------------------------------------------------------

    @property
    def performance_percentage(self):

        if not self.expected_generation_kwh:
            return None

        return round(
            float(
                self.actual_generation_kwh
                / self.expected_generation_kwh
                * 100
            ),
            2,
        )

    # ------------------------------------------------------
    # SAVE: AUTOMATICALLY CALCULATE AND STORE BILLS
    # ------------------------------------------------------

    def save(self, *args, **kwargs):

        self.bill_value = self.calculated_bill_value

        self.total_bill = (
            self.bill_value + self.balance_bill
        )

        super().save(*args, **kwargs)

    # ------------------------------------------------------
    # STRING REPRESENTATION
    # ------------------------------------------------------

    def __str__(self):

        return (
            f"{self.site.name} - "
            f"{self.year}/{self.month:02d}"
        )
