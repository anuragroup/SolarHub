from rest_framework import serializers

from .models import Site


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "id",
            "name",
            "asset_code",
            "address",
            "capacity_kwp",
            "project_investment",
            "expected_daily_generation_kwh",
            "monitoring_portal",
            "plant_id",
            "inverter_model",
            "panel_model",
            "agreement_reference",
            "agreement_date",
            "commissioning_date",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]