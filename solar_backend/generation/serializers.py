from rest_framework import serializers

from .models import GenerationRecord, MeterReading


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