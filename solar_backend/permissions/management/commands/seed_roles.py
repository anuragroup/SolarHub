from django.core.management.base import BaseCommand

from users.models import Role
from permissions.models import Permission


class Command(BaseCommand):
    help = "Create default SolarHub roles and assign permissions"

    ROLE_DEFINITIONS = {
        "SUPER_ADMIN": {
            "name": "Super Admin",
            "description": "Full SolarHub system and business administration access.",
            "permissions": "ALL",
        },

        "SYSTEM_ADMIN": {
            "name": "System Admin",
            "description": "System administration and configuration access.",
            "permissions": [
                "DASHBOARD_VIEW",

                "USERS_VIEW",
                "USERS_ADD",
                "USERS_EDIT",

                "ROLES_VIEW",
                "ROLES_ADD",
                "ROLES_EDIT",

                "MENUS_VIEW",
                "MENUS_EDIT",

                "PERMISSIONS_VIEW",
                "PERMISSIONS_EDIT",

                "AUDIT_LOGS_VIEW",

                "SYSTEM_SETTINGS_VIEW",
                "SYSTEM_SETTINGS_EDIT",
            ],
        },

        "SOLAR_MANAGER": {
            "name": "Solar Manager",
            "description": "Manages solar sites, assets, operations and reports.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "SITES_ADD",
                "SITES_EDIT",

                "ASSETS_VIEW",
                "ASSETS_ADD",
                "ASSETS_EDIT",

                "SUPPLIERS_VIEW",
                "SUPPLIERS_ADD",
                "SUPPLIERS_EDIT",

                "SERVICE_PROVIDERS_VIEW",
                "SERVICE_PROVIDERS_ADD",
                "SERVICE_PROVIDERS_EDIT",

                "GENERATION_VIEW",
                "GENERATION_ADD",
                "GENERATION_EDIT",

                "METER_READINGS_VIEW",
                "METER_READINGS_ADD",
                "METER_READINGS_EDIT",

                "MAINTENANCE_VIEW",
                "MAINTENANCE_ADD",
                "MAINTENANCE_EDIT",
                "MAINTENANCE_APPROVE",
                "MAINTENANCE_ASSIGN",
                "MAINTENANCE_CLOSE",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",
                "BREAKDOWNS_EDIT",
                "BREAKDOWNS_ASSIGN",
                "BREAKDOWNS_CLOSE",

                "WARRANTIES_VIEW",
                "CONTRACTS_VIEW",
                "INVOICES_VIEW",
                "DOCUMENTS_VIEW",

                "GENERATION_REPORTS_VIEW",
                "GENERATION_REPORTS_EXPORT",

                "MAINTENANCE_REPORTS_VIEW",
                "MAINTENANCE_REPORTS_EXPORT",

                "BREAKDOWN_REPORTS_VIEW",
                "BREAKDOWN_REPORTS_EXPORT",

                "PERFORMANCE_REPORTS_VIEW",
                "PERFORMANCE_REPORTS_EXPORT",
            ],
        },

        "SOLAR_ENGINEER": {
            "name": "Solar Engineer",
            "description": "Technical solar engineering and asset management.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",

                "ASSETS_VIEW",
                "ASSETS_ADD",
                "ASSETS_EDIT",

                "GENERATION_VIEW",
                "GENERATION_ADD",
                "GENERATION_EDIT",

                "METER_READINGS_VIEW",
                "METER_READINGS_ADD",
                "METER_READINGS_EDIT",

                "MAINTENANCE_VIEW",
                "MAINTENANCE_ADD",
                "MAINTENANCE_EDIT",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",
                "BREAKDOWNS_EDIT",
                "BREAKDOWNS_CLOSE",

                "WARRANTIES_VIEW",
                "DOCUMENTS_VIEW",

                "GENERATION_REPORTS_VIEW",
                "MAINTENANCE_REPORTS_VIEW",
                "BREAKDOWN_REPORTS_VIEW",
                "PERFORMANCE_REPORTS_VIEW",
            ],
        },

        "MAINTENANCE_MANAGER": {
            "name": "Maintenance Manager",
            "description": "Manages maintenance schedules, breakdowns and service activities.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "ASSETS_VIEW",

                "MAINTENANCE_VIEW",
                "MAINTENANCE_ADD",
                "MAINTENANCE_EDIT",
                "MAINTENANCE_APPROVE",
                "MAINTENANCE_ASSIGN",
                "MAINTENANCE_CLOSE",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",
                "BREAKDOWNS_EDIT",
                "BREAKDOWNS_ASSIGN",
                "BREAKDOWNS_CLOSE",

                "SERVICE_PROVIDERS_VIEW",
                "SERVICE_PROVIDERS_ADD",
                "SERVICE_PROVIDERS_EDIT",

                "WARRANTIES_VIEW",
                "CONTRACTS_VIEW",
                "DOCUMENTS_VIEW",

                "MAINTENANCE_REPORTS_VIEW",
                "MAINTENANCE_REPORTS_EXPORT",

                "BREAKDOWN_REPORTS_VIEW",
                "BREAKDOWN_REPORTS_EXPORT",
            ],
        },

        "MAINTENANCE_OFFICER": {
            "name": "Maintenance Officer",
            "description": "Performs and records maintenance activities.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "ASSETS_VIEW",

                "MAINTENANCE_VIEW",
                "MAINTENANCE_ADD",
                "MAINTENANCE_EDIT",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",
                "BREAKDOWNS_EDIT",
                "BREAKDOWNS_CLOSE",

                "SERVICE_PROVIDERS_VIEW",
                "WARRANTIES_VIEW",
                "DOCUMENTS_VIEW",
            ],
        },

        "SITE_SUPERVISOR": {
            "name": "Site Supervisor",
            "description": "Manages daily activities at assigned solar sites.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "ASSETS_VIEW",

                "GENERATION_VIEW",
                "GENERATION_ADD",

                "METER_READINGS_VIEW",
                "METER_READINGS_ADD",

                "MAINTENANCE_VIEW",
                "MAINTENANCE_ADD",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",

                "DOCUMENTS_VIEW",
            ],
        },

        "SITE_USER": {
            "name": "Site User",
            "description": "Basic operational user for assigned solar sites.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "ASSETS_VIEW",

                "GENERATION_VIEW",
                "GENERATION_ADD",

                "METER_READINGS_VIEW",
                "METER_READINGS_ADD",

                "MAINTENANCE_VIEW",

                "BREAKDOWNS_VIEW",
                "BREAKDOWNS_ADD",
            ],
        },

        "FINANCE_USER": {
            "name": "Finance User",
            "description": "Access to commercial and financial records.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",

                "WARRANTIES_VIEW",
                "CONTRACTS_VIEW",

                "INVOICES_VIEW",
                "INVOICES_ADD",
                "INVOICES_EDIT",

                "DOCUMENTS_VIEW",
                "DOCUMENTS_ADD",
                "DOCUMENTS_EDIT",

                "PERFORMANCE_REPORTS_VIEW",
                "PERFORMANCE_REPORTS_EXPORT",
            ],
        },

        "PROCUREMENT_USER": {
            "name": "Procurement User",
            "description": "Manages suppliers, service providers and procurement records.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",

                "SUPPLIERS_VIEW",
                "SUPPLIERS_ADD",
                "SUPPLIERS_EDIT",

                "SERVICE_PROVIDERS_VIEW",
                "SERVICE_PROVIDERS_ADD",
                "SERVICE_PROVIDERS_EDIT",

                "CONTRACTS_VIEW",
                "CONTRACTS_ADD",
                "CONTRACTS_EDIT",

                "WARRANTIES_VIEW",

                "DOCUMENTS_VIEW",
                "DOCUMENTS_ADD",
                "DOCUMENTS_EDIT",
            ],
        },

        "MANAGEMENT_VIEWER": {
            "name": "Management Viewer",
            "description": "Read-only management dashboard and reports.",
            "permissions": [
                "DASHBOARD_VIEW",

                "SITES_VIEW",
                "ASSETS_VIEW",

                "GENERATION_VIEW",
                "METER_READINGS_VIEW",

                "MAINTENANCE_VIEW",
                "BREAKDOWNS_VIEW",

                "WARRANTIES_VIEW",
                "CONTRACTS_VIEW",
                "INVOICES_VIEW",

                "GENERATION_REPORTS_VIEW",
                "GENERATION_REPORTS_EXPORT",

                "MAINTENANCE_REPORTS_VIEW",
                "MAINTENANCE_REPORTS_EXPORT",

                "BREAKDOWN_REPORTS_VIEW",
                "BREAKDOWN_REPORTS_EXPORT",

                "PERFORMANCE_REPORTS_VIEW",
                "PERFORMANCE_REPORTS_EXPORT",
            ],
        },

        "REPORT_USER": {
            "name": "Report User",
            "description": "Read-only reporting access.",
            "permissions": [
                "DASHBOARD_VIEW",

                "GENERATION_REPORTS_VIEW",
                "GENERATION_REPORTS_EXPORT",

                "MAINTENANCE_REPORTS_VIEW",
                "MAINTENANCE_REPORTS_EXPORT",

                "BREAKDOWN_REPORTS_VIEW",
                "BREAKDOWN_REPORTS_EXPORT",

                "PERFORMANCE_REPORTS_VIEW",
                "PERFORMANCE_REPORTS_EXPORT",
            ],
        },
    }

    def handle(self, *args, **options):

        all_permissions = Permission.objects.filter(
            is_active=True
        )

        for code, definition in self.ROLE_DEFINITIONS.items():

            role, created = Role.objects.update_or_create(
                code=code,
                defaults={
                    "name": definition["name"],
                    "description": definition["description"],
                    "is_system_role": True,
                    "is_active": True,
                },
            )

            if definition["permissions"] == "ALL":
                role.permissions.set(all_permissions)

            else:
                permissions = Permission.objects.filter(
                    code__in=definition["permissions"],
                    is_active=True,
                )

                role.permissions.set(permissions)

            action = "Created" if created else "Updated"

            self.stdout.write(
                self.style.SUCCESS(
                    f"{action} role: {role.name} "
                    f"({role.permissions.count()} permissions)"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "SolarHub default roles created successfully."
            )
        )