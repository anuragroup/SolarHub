from django.core.management.base import BaseCommand

from users.models import Role


ROLES = [
    (
        "SUPER_ADMIN",
        "Super Admin",
        "Full technical and system control.",
    ),
    (
        "SYSTEM_ADMIN",
        "System Admin",
        "IT and system administration.",
    ),
    (
        "SOLAR_MANAGER",
        "Solar Manager",
        "Overall solar operations and management.",
    ),
    (
        "SOLAR_ENGINEER",
        "Solar Engineer",
        "Technical solar management and performance.",
    ),
    (
        "MAINT_MANAGER",
        "Maintenance Manager",
        "Maintenance planning and oversight.",
    ),
    (
        "MAINT_OFFICER",
        "Maintenance Officer",
        "Maintenance and breakdown operations.",
    ),
    (
        "SITE_SUPERVISOR",
        "Site Supervisor",
        "Site-level operational activities.",
    ),
    (
        "SITE_USER",
        "Site User",
        "Generation and meter data entry.",
    ),
    (
        "FINANCE",
        "Finance User",
        "Financial and invoice information.",
    ),
    (
        "PROCUREMENT",
        "Procurement User",
        "Suppliers, warranty and procurement.",
    ),
    (
        "MGMT_VIEWER",
        "Management Viewer",
        "Dashboard and management reports.",
    ),
    (
        "REPORT_USER",
        "Report User",
        "Reports only.",
    ),
]


class Command(BaseCommand):
    help = "Create or update the default SolarHub roles."

    def handle(self, *args, **options):

        for code, name, description in ROLES:

            role = Role.objects.filter(name=name).first()

            if role:
                role.code = code
                role.description = description
                role.is_system_role = True
                role.is_active = True
                role.save(
                    update_fields=[
                        "code",
                        "description",
                        "is_system_role",
                        "is_active",
                    ]
                )

                self.stdout.write(
                    f"Updated role: {name} → {code}"
                )

            else:
                Role.objects.create(
                    code=code,
                    name=name,
                    description=description,
                    is_system_role=True,
                    is_active=True,
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created role: {name} → {code}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                "SolarHub roles are ready."
            )
        )