from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


# ==========================================================
# ORGANIZATION
# ==========================================================

class Organization(models.Model):
    name = models.CharField(
        max_length=200,
        unique=True,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ["name"]
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"


# ==========================================================
# ROLE
# ==========================================================

class Role(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_system_role = models.BooleanField(
        default=False,
        help_text="System-defined role that should not be deleted by normal administrators.",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    permissions = models.ManyToManyField(
        "permissions.Permission",
        blank=True,
        related_name="roles",
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = "Role"
        verbose_name_plural = "Roles"


# ==========================================================
# CUSTOM USER
# ==========================================================

class User(AbstractUser):

    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )

    employee_no = models.CharField(
        max_length=50,
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    roles = models.ManyToManyField(
        Role,
        blank=True,
        related_name="users",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.get_full_name() or self.username

    class Meta:
        ordering = ["username"]
        verbose_name = "User"
        verbose_name_plural = "Users"


        ##################################################

