from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import Menu, Permission


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "parent",
        "order",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

    ordering = (
        "order",
        "name",
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "action",
        "menu",
        "is_active",
    )

    list_filter = (
        "action",
        "is_active",
        "menu",
    )

    search_fields = (
        "name",
        "code",
    )

    ordering = (
        "menu__order",
        "code",
    )