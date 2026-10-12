from django.core.management.base import BaseCommand
from permissions.models import Menu, Permission


class Command(BaseCommand):
    help = "Create default SolarHub menus and permissions"

    def handle(self, *args, **options):
        Permission.objects.all().delete()
        # ==========================================================
        # MENU STRUCTURE
        # ==========================================================

        menus = [
            {
                "name": "Dashboard",
                "code": "DASHBOARD",
                "icon": "dashboard",
                "url": "/dashboard",
                "parent": None,
                "order": 1,
            },

            # ------------------------------------------------------
            # MASTER DATA
            # ------------------------------------------------------

            {
                "name": "Master Data",
                "code": "MASTER_DATA",
                "icon": "database",
                "url": "",
                "parent": None,
                "order": 10,
            },
            {
                "name": "Sites",
                "code": "SITES",
                "icon": "solar_power",
                "url": "/sites",
                "parent": "MASTER_DATA",
                "order": 11,
            },
            {
                "name": "Assets",
                "code": "ASSETS",
                "icon": "memory",
                "url": "/assets",
                "parent": "MASTER_DATA",
                "order": 12,
            },
            {
                "name": "Suppliers",
                "code": "SUPPLIERS",
                "icon": "business",
                "url": "/suppliers",
                "parent": "MASTER_DATA",
                "order": 13,
            },
            {
                "name": "Service Providers",
                "code": "SERVICE_PROVIDERS",
                "icon": "engineering",
                "url": "/service-providers",
                "parent": "MASTER_DATA",
                "order": 14,
            },

            # ------------------------------------------------------
            # OPERATIONS
            # ------------------------------------------------------

            {
                "name": "Operations",
                "code": "OPERATIONS",
                "icon": "settings",
                "url": "",
                "parent": None,
                "order": 20,
            },
            {
                "name": "Generation",
                "code": "GENERATION",
                "icon": "electric_bolt",
                "url": "/generation",
                "parent": "OPERATIONS",
                "order": 21,
            },
            {
                "name": "Meter Readings",
                "code": "METER_READINGS",
                "icon": "speed",
                "url": "/meter-readings",
                "parent": "OPERATIONS",
                "order": 22,
            },
            {
                "name": "Maintenance",
                "code": "MAINTENANCE",
                "icon": "build",
                "url": "/maintenance",
                "parent": "OPERATIONS",
                "order": 23,
            },
            {
                "name": "Breakdowns",
                "code": "BREAKDOWNS",
                "icon": "warning",
                "url": "/breakdowns",
                "parent": "OPERATIONS",
                "order": 24,
            },
            {
                "name": "Tasks / Follow-up",
                "code": "TASKS",
                "icon": "task",
                "url": "/tasks",
                "parent": "OPERATIONS",
                "order": 25,
            },

            # ------------------------------------------------------
            # COMMERCIAL
            # ------------------------------------------------------

            {
                "name": "Commercial",
                "code": "COMMERCIAL",
                "icon": "business_center",
                "url": "",
                "parent": None,
                "order": 30,
            },
            {
                "name": "Warranties",
                "code": "WARRANTIES",
                "icon": "verified",
                "url": "/warranties",
                "parent": "COMMERCIAL",
                "order": 31,
            },
            {
                "name": "Contracts",
                "code": "CONTRACTS",
                "icon": "description",
                "url": "/contracts",
                "parent": "COMMERCIAL",
                "order": 32,
            },
            {
                "name": "Invoices",
                "code": "INVOICES",
                "icon": "receipt",
                "url": "/invoices",
                "parent": "COMMERCIAL",
                "order": 33,
            },
            {
                "name": "Documents",
                "code": "DOCUMENTS",
                "icon": "folder",
                "url": "/documents",
                "parent": "COMMERCIAL",
                "order": 34,
            },

            # ------------------------------------------------------
            # REPORTING
            # ------------------------------------------------------

            {
                "name": "Reporting",
                "code": "REPORTING",
                "icon": "assessment",
                "url": "",
                "parent": None,
                "order": 40,
            },
            {
                "name": "Generation Reports",
                "code": "GENERATION_REPORTS",
                "icon": "bar_chart",
                "url": "/reports/generation",
                "parent": "REPORTING",
                "order": 41,
            },
            {
                "name": "Maintenance Reports",
                "code": "MAINTENANCE_REPORTS",
                "icon": "build",
                "url": "/reports/maintenance",
                "parent": "REPORTING",
                "order": 42,
            },
            {
                "name": "Breakdown Reports",
                "code": "BREAKDOWN_REPORTS",
                "icon": "report_problem",
                "url": "/reports/breakdowns",
                "parent": "REPORTING",
                "order": 43,
            },
            {
                "name": "Performance Reports",
                "code": "PERFORMANCE_REPORTS",
                "icon": "trending_up",
                "url": "/reports/performance",
                "parent": "REPORTING",
                "order": 44,
            },

            # ------------------------------------------------------
            # ADMINISTRATION
            # ------------------------------------------------------

            {
                "name": "Administration",
                "code": "ADMINISTRATION",
                "icon": "admin_panel_settings",
                "url": "",
                "parent": None,
                "order": 50,
            },
            {
                "name": "Users",
                "code": "USERS",
                "icon": "people",
                "url": "/admin/users",
                "parent": "ADMINISTRATION",
                "order": 51,
            },
            {
                "name": "Roles",
                "code": "ROLES",
                "icon": "security",
                "url": "/admin/roles",
                "parent": "ADMINISTRATION",
                "order": 52,
            },
            {
                "name": "Menus",
                "code": "MENUS",
                "icon": "menu",
                "url": "/admin/menus",
                "parent": "ADMINISTRATION",
                "order": 53,
            },
            {
                "name": "Permissions",
                "code": "PERMISSIONS",
                "icon": "lock",
                "url": "/admin/permissions",
                "parent": "ADMINISTRATION",
                "order": 54,
            },
            {
                "name": "Audit Logs",
                "code": "AUDIT_LOGS",
                "icon": "history",
                "url": "/admin/audit-logs",
                "parent": "ADMINISTRATION",
                "order": 55,
            },
            {
                "name": "System Settings",
                "code": "SYSTEM_SETTINGS",
                "icon": "tune",
                "url": "/admin/settings",
                "parent": "ADMINISTRATION",
                "order": 56,
            },
        ]

        # ==========================================================
        # CREATE MENUS
        # ==========================================================

        menu_objects = {}

        # First create parent menus
        for item in menus:
            if item["parent"] is None:
                menu, created = Menu.objects.update_or_create(
                    code=item["code"],
                    defaults={
                        "name": item["name"],
                        "icon": item["icon"],
                        "url": item["url"],
                        "order": item["order"],
                        "is_active": True,
                    },
                )

                menu_objects[item["code"]] = menu

                action = "Created" if created else "Updated"

                self.stdout.write(
                    self.style.SUCCESS(
                        f"{action} menu: {menu.name}"
                    )
                )

        # Then create child menus
        for item in menus:
            if item["parent"] is not None:
                parent = menu_objects[item["parent"]]

                menu, created = Menu.objects.update_or_create(
                    code=item["code"],
                    defaults={
                        "name": item["name"],
                        "icon": item["icon"],
                        "url": item["url"],
                        "parent": parent,
                        "order": item["order"],
                        "is_active": True,
                    },
                )

                menu_objects[item["code"]] = menu

                action = "Created" if created else "Updated"

                self.stdout.write(
                    self.style.SUCCESS(
                        f"{action} menu: {menu.name}"
                    )
                )

        # ==========================================================
        # PERMISSIONS
        # ==========================================================

        permission_actions = [
            ("VIEW", "View"),
            ("ADD", "Add"),
            ("EDIT", "Edit"),
            ("DELETE", "Delete"),
            ("APPROVE", "Approve"),
            ("ASSIGN", "Assign"),
            ("CLOSE", "Close"),
            ("EXPORT", "Export"),
        ]

        # Menus that need normal CRUD permissions
        crud_menus = [
            "SITES",
            "ASSETS",
            "SUPPLIERS",
            "SERVICE_PROVIDERS",
            "GENERATION",
            "METER_READINGS",
            "MAINTENANCE",
            "BREAKDOWNS",
            "TASKS",
            "WARRANTIES",
            "CONTRACTS",
            "INVOICES",
            "DOCUMENTS",
        ]

        # Reporting menus
        report_menus = [
            "GENERATION_REPORTS",
            "MAINTENANCE_REPORTS",
            "BREAKDOWN_REPORTS",
            "PERFORMANCE_REPORTS",
        ]

        # Administration menus
        admin_menus = [
            "USERS",
            "ROLES",
            "MENUS",
            "PERMISSIONS",
            "AUDIT_LOGS",
            "SYSTEM_SETTINGS",
        ]

        # ----------------------------------------------------------
        # CRUD permissions
        # ----------------------------------------------------------

        for menu_code in crud_menus:

            menu = menu_objects[menu_code]

            for action_code, action_name in permission_actions:

                # Not every module needs every action
                if action_code in ["APPROVE", "ASSIGN", "CLOSE"]:
                    if menu_code not in [
                        "MAINTENANCE",
                        "BREAKDOWNS",
                        "TASKS",
                        "CONTRACTS",
                        "INVOICES",
                    ]:
                        continue

                code = f"{menu_code}_{action_code}"

                Permission.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": f"{menu.name} - {action_name}",
                        "action": action_code,
                        "description": f"{action_name} permission for {menu.name}",
                        "menu": menu,
                        "is_active": True,
                    },
                )

        # ----------------------------------------------------------
        # Reporting permissions
        # ----------------------------------------------------------

        for menu_code in report_menus:

            menu = menu_objects[menu_code]

            for action_code in ["VIEW", "EXPORT"]:

                code = f"{menu_code}_{action_code}"

                Permission.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": f"{menu.name} - {action_code.title()}",
                        "action": action_code,
                        "description": f"{action_code.title()} permission for {menu.name}",
                        "menu": menu,
                        "is_active": True,
                    },
                )

        # ----------------------------------------------------------
        # Administration permissions
        # ----------------------------------------------------------

        for menu_code in admin_menus:

            menu = menu_objects[menu_code]

            for action_code in ["VIEW", "ADD", "EDIT", "DELETE"]:

                code = f"{menu_code}_{action_code}"

                Permission.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": f"{menu.name} - {action_code.title()}",
                        "action": action_code,
                        "description": f"{action_code.title()} permission for {menu.name}",
                        "menu": menu,
                        "is_active": True,
                    },
                )

        # ----------------------------------------------------------
        # Dashboard permission
        # ----------------------------------------------------------

        dashboard = menu_objects["DASHBOARD"]

        Permission.objects.update_or_create(
            code="DASHBOARD_VIEW",
            defaults={
                "name": "Dashboard - View",
                "action": "VIEW",
                "description": "View the SolarHub dashboard",
                "menu": dashboard,
                "is_active": True,
            },
        )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "SolarHub menus and permissions seeded successfully."
            )
        )