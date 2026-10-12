from django.db import models


class Site(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("MAINTENANCE", "Maintenance"),
        ("PLANNED", "Planned"),
    ]

    # ==========================================================
    # SITE IDENTIFICATION
    # ==========================================================

    name = models.CharField(
        max_length=150,
    )

    asset_code = models.CharField(
        max_length=50,
        unique=True,
    )

    # ==========================================================
    # LOCATION
    # ==========================================================

    address = models.CharField(
        max_length=255,
        blank=True,
    )

    # ==========================================================
    # SYSTEM CAPACITY & INVESTMENT
    # ==========================================================

    capacity_kwp = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Installed solar capacity in kWp",
    )

    project_investment = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Total project investment",
    )

    expected_daily_generation_kwh = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Expected daily generation in kWh",
    )

    # ==========================================================
    # MONITORING / VENDOR INFORMATION
    # ==========================================================

    monitoring_portal = models.CharField(
        max_length=100,
        blank=True,
        help_text="Example: Growatt ShineServer",
    )

    plant_id = models.CharField(
        max_length=100,
        blank=True,
    )

    # ==========================================================
    # EQUIPMENT SUMMARY
    # ==========================================================

    inverter_model = models.CharField(
        max_length=150,
        blank=True,
    )

    panel_model = models.CharField(
        max_length=150,
        blank=True,
    )

    # ==========================================================
    # AGREEMENT
    # ==========================================================

    agreement_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    agreement_date = models.DateField(
        blank=True,
        null=True,
    )

    # ==========================================================
    # STATUS
    # ==========================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE",
    )

    # ==========================================================
    # SYSTEM FLAGS
    # ==========================================================

    is_active = models.BooleanField(
        default=True,
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


    # ============================================================
    # commissioning
    # ==========================================================
    commissioning_date = models.DateField(
        blank=True,
        null=True,
    )



    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.asset_code})"