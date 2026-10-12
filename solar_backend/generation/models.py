from django.db import models

# Create your models here.
from django.db import models
from sites.models import Site


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

    # ==========================================================
    # SITE
    # ==========================================================

    site = models.ForeignKey(
        Site,
        on_delete=models.PROTECT,
        related_name="generation_records",
    )

    # ==========================================================
    # GENERATION DATE
    # ==========================================================

    generation_date = models.DateField()

    # ==========================================================
    # GENERATION
    # ==========================================================

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

    # ==========================================================
    # PERFORMANCE
    # ==========================================================

    peak_power_kw = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Peak power generated in kW",
    )

    # ==========================================================
    # DATA SOURCE
    # ==========================================================

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

    # ==========================================================
    # AUDIT
    # ==========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

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
    
#########################################################################

class MeterReading(models.Model):
    SOURCE_CHOICES = [
        ("MANUAL", "Manual Entry"),
        ("API", "Meter API"),
    ]

    # ==========================================================
    # SITE
    # ==========================================================

    site = models.ForeignKey(
        Site,
        on_delete=models.PROTECT,
        related_name="meter_readings",
    )

    # ==========================================================
    # READING INFORMATION
    # ==========================================================

    reading_date = models.DateField()

    meter_serial_number = models.CharField(
        max_length=100,
        blank=True,
    )

    # ==========================================================
    # CUMULATIVE METER READINGS
    # ==========================================================

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

    # ==========================================================
    # SOURCE
    # ==========================================================

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="MANUAL",
    )

    # ==========================================================
    # USER / REMARKS
    # ==========================================================

    logged_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="meter_readings",
    )

    remarks = models.TextField(
        blank=True,
    )

    # ==========================================================
    # AUDIT
    # ==========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-reading_date", "-id"]

    def __str__(self):
        return (
            f"{self.site.name} - "
            f"{self.reading_date}"
        )