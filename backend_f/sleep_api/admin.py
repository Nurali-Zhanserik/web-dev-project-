from django.contrib import admin
from .models import SleepRecord, SleepCategory, UserProfile, SleepGoal

@admin.register(SleepRecord)
class SleepRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'sleep_time', 'wake_time', 'quality', 'duration_minutes']
    list_filter = ['quality', 'date']
    search_fields = ['user__username', 'notes']

@admin.register(SleepCategory)
class SleepCategoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'color']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'timezone', 'created_at']

@admin.register(SleepGoal)
class SleepGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_duration_minutes', 'target_quality']
