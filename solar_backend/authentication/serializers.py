from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    role_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "employee_no",
            "phone",
            "organization",
            "role_names",
        ]

    def get_role_names(self, obj):
        return list(
            obj.roles.filter(is_active=True).values_list(
                "code",
                flat=True,
            )
        )