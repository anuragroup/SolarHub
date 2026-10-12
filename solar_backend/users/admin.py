from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Organization, Role, User


# ==========================================================
# ORGANIZATION
# ==========================================================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )


# ==========================================================
# ROLE
# ==========================================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "is_system_role",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_system_role",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

    filter_horizontal = (
        "permissions",
    )


# ==========================================================
# USER
# ==========================================================

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "organization",
        "employee_no",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "organization",
        "roles",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
        "employee_no",
    )

    filter_horizontal = (
        "groups",
        "user_permissions",
        "roles",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "SolarHub Information",
            {
                "fields": (
                    "organization",
                    "employee_no",
                    "phone",
                    "roles",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "SolarHub Information",
            {
                "fields": (
                    "organization",
                    "employee_no",
                    "phone",
                    "roles",
                )
            },
        ),
    )