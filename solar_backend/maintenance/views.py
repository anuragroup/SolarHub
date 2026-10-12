from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import MaintenanceSchedule, Breakdown
from .serializers import (
    MaintenanceScheduleSerializer,
    BreakdownSerializer,
)


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceSchedule.objects.select_related(
        "site",
        "assigned_to",
    ).all()

    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticated]


class BreakdownViewSet(viewsets.ModelViewSet):
    queryset = Breakdown.objects.select_related(
        "site",
        "reported_by",
        "assigned_to",
    ).all()

    serializer_class = BreakdownSerializer
    permission_classes = [IsAuthenticated]
