from django.contrib import admin

from .models import SpotPlayerLicense


@admin.register(SpotPlayerLicense)
class SpotPlayerLicenseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "course", "test_mode", "created_at", "updated_at")
    list_filter = ("test_mode", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "course__title",
        "spotplayer_license_id",
    )
    readonly_fields = ("created_at", "updated_at")
