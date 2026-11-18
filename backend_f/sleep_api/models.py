from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class SleepRecordManager(models.Manager):
    """Custom manager providing filtered querysets for sleep records."""

    def for_user(self, user):
        """Return all records belonging to a specific user."""
        return self.filter(user=user).order_by('-date', '-created_at')

    def good_quality(self, user):
        """Return records with quality >= 4 for a user."""
        return self.filter(user=user, quality__gte=4).order_by('-date')

    def this_week(self, user):
        """Return records from the past 7 days for a user."""
        from django.utils import timezone
        import datetime
        week_ago = timezone.now().date() - datetime.timedelta(days=7)
        return self.filter(user=user, date__gte=week_ago).order_by('-date')



class UserProfile(models.Model):
    """Extended profile data for each registered user."""

   
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(blank=True, default='')
    timezone = models.CharField(max_length=64, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'


class SleepCategory(models.Model):
    """Categories/tags that a user can assign to sleep records (e.g. 'Work day', 'Weekend')."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sleep_categories'
    )
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=7, default='#3b82f6')  # hex color
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    class Meta:
        verbose_name = 'Sleep Category'
        verbose_name_plural = 'Sleep Categories'
        unique_together = ('user', 'name')


class SleepRecord(models.Model):
    """Core model: one sleep session recorded by a user."""

    QUALITY_CHOICES = [
        (1, 'Very Poor'),
        (2, 'Poor'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sleep_records'
    )
    category = models.ForeignKey(
        SleepCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='records'
    )

    date = models.DateField()
    sleep_time = models.TimeField()
    wake_time = models.TimeField()
    quality = models.IntegerField(
        choices=QUALITY_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True, default='')
    duration_minutes = models.PositiveIntegerField(default=0)  # calculated on save
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SleepRecordManager()

    def save(self, *args, **kwargs):
        """Auto-calculate duration_minutes before saving."""
        import datetime
        sleep_dt = datetime.datetime.combine(datetime.date.today(), self.sleep_time)
        wake_dt = datetime.datetime.combine(datetime.date.today(), self.wake_time)
        if wake_dt <= sleep_dt:
            wake_dt += datetime.timedelta(days=1)
        self.duration_minutes = int((wake_dt - sleep_dt).total_seconds() / 60)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} — {self.date} ({self.get_quality_display()})"

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Sleep Record'
        verbose_name_plural = 'Sleep Records'


class SleepGoal(models.Model):
    """User's personal sleep goals (target duration and quality)."""

    # ForeignKey: SleepGoal → User
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='sleep_goal'
    )
    target_duration_minutes = models.PositiveIntegerField(default=480)  # 8 hours
    target_quality = models.IntegerField(
        default=4,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    target_bedtime = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Goal of {self.user.username}"

    class Meta:
        verbose_name = 'Sleep Goal'
        verbose_name_plural = 'Sleep Goals'
