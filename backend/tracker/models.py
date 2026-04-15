from django.db import models
from django.contrib.auth.models import User


class SleepRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    sleep_time = models.DateTimeField()
    wake_time = models.DateTimeField()
    duration = models.FloatField()
    quality = models.IntegerField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.sleep_time}"


class SleepGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    target_hours = models.FloatField()
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.target_hours}h"


class SleepTag(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class RecordTag(models.Model):
    record = models.ForeignKey(SleepRecord, on_delete=models.CASCADE)
    tag = models.ForeignKey(SleepTag, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.record.id} - {self.tag.name}"