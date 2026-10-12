from django.db import models

# Create your models here.
from django.db import models


# ==========================================================
# MENU
# ==========================================================

class Menu(models.Model):
    name = models.CharField(
        max_length=100,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    icon = models.CharField(
        max_length=100,
        blank=True,
    )

    url = models.CharField(
        max_length=255,
        blank=True,
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )

    order = models.PositiveIntegerField(
        default=0,
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
        return self.name

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Menu"
        verbose_name_plural = "Menus"


# ==========================================================
# PERMISSION
# ==========================================================

class Permission(models.Model):
    ACTION_CHOICES = [
        ("VIEW", "View"),
        ("ADD", "Add"),
        ("EDIT", "Edit"),
        ("DELETE", "Delete"),
        ("APPROVE", "Approve"),
        ("ASSIGN", "Assign"),
        ("CLOSE", "Close"),
        ("EXPORT", "Export"),
    ]

    name = models.CharField(
        max_length=150,
    )

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
    )

    description = models.TextField(
        blank=True,
    )

    menu = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name="permissions",
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
        ordering = ["menu__order", "code"]
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"