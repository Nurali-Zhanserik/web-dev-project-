from django.contrib import admin
from .models import SleepRecord, SleepGoal, SleepTag, RecordTag


admin.site.register(SleepRecord)
admin.site.register(SleepGoal)
admin.site.register(SleepTag)
admin.site.register(RecordTag)