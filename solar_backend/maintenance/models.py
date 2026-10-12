from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models


class MaintenanceSchedule(models.Model):

    MAINTENANCE_TYPES = [
        ("PREVENTIVE", "Preventive Maintenance"),
        ("CORRECTIVE", "Corrective Maintenance"),
        ("INSPECTION", "Inspection"),
        ("CLEANING", "Panel Cleaning"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("SCHEDULED", "Scheduled"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    site = models.ForeignKey(
        "sites.Site",
        on_delete=models.PROTECT,
        related_name="maintenance_schedules",
    )

    title = models.CharField(max_length=200)
    maintenance_type = models.CharField(
        max_length=20,
        choices=MAINTENANCE_TYPES,
        default="PREVENTIVE",
    )

    scheduled_date = models.DateField()
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_maintenance",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="SCHEDULED",
    )

    description = models.TextField(blank=True)
    work_performed = models.TextField(blank=True)
    completed_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_date", "id"]

    def __str__(self):
        return f"{self.title} - {self.site}"


class Breakdown(models.Model):

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("INVESTIGATING", "Investigating"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    site = models.ForeignKey(
        "sites.Site",
        on_delete=models.PROTECT,
        related_name="breakdowns",
    )

    title = models.CharField(max_length=200)
    equipment_name = models.CharField(max_length=200, blank=True)

    breakdown_date = models.DateTimeField()
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="MEDIUM",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="OPEN",
    )

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reported_breakdowns",
    )

    problem_description = models.TextField()
    root_cause = models.TextField(blank=True)
    corrective_action = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_breakdowns",
    )

    resolved_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-breakdown_date", "-id"]

    def __str__(self):
        return f"{self.title} - {self.site}"
