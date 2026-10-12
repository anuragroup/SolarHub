
from django.contrib import admin
from .models import MaintenanceSchedule, Breakdown


@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "site",
        "maintenance_type",
        "scheduled_date",
        "assigned_to",
        "status",
    )

    list_filter = (
        "status",
        "maintenance_type",
        "scheduled_date",
        "site",
    )

    search_fields = (
        "title",
        "site__name",
        "site__asset_code",
        "description",
    )

    date_hierarchy = "scheduled_date"
    ordering = ("scheduled_date",)


@admin.register(Breakdown)
class BreakdownAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "site",
        "equipment_name",
        "breakdown_date",
        "priority",
        "status",
        "assigned_to",
    )

    list_filter = (
        "status",
        "priority",
        "breakdown_date",
        "site",
    )

    search_fields = (
        "title",
        "site__name",
        "site__asset_code",
        "equipment_name",
        "problem_description",
    )

    date_hierarchy = "breakdown_date"
    ordering = ("-breakdown_date",)
