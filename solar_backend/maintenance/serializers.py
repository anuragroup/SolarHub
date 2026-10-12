
from rest_framework import serializers
from .models import MaintenanceSchedule, Breakdown


class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )
    site_asset_code = serializers.CharField(
        source="site.asset_code",
        read_only=True,
    )
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceSchedule
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None


class BreakdownSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )
    site_asset_code = serializers.CharField(
        source="site.asset_code",
        read_only=True,
    )
    reported_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Breakdown
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def get_reported_by_name(self, obj):
        if obj.reported_by:
            return obj.reported_by.get_full_name() or obj.reported_by.username
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
