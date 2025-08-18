from django.contrib import admin
from .models import PythonFile
from django.contrib import admin


@admin.register(PythonFile)
class PythonFileAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "is_analyzed", "created_at"]
    list_filter = ["is_active", "is_analyzed"]
