from abc import ABC, abstractmethod
from django.db.models import Avg, Max, Min
from .models import SleepRecord


class SleepStatsStrategy(ABC):
    """Strategy interface for computing sleep statistics over a queryset scope."""

    @staticmethod
    def _safe_round(value):
        return round(value or 0, 1)

    @abstractmethod
    def compute(self, user) -> dict:
        raise NotImplementedError


class AllTimeStatsStrategy(SleepStatsStrategy):
    """Computes lifetime sleep metrics for a user."""

    def compute(self, user) -> dict:
        records = SleepRecord.objects.for_user(user)
        aggregates = records.aggregate(
            avg_dur=Avg('duration_minutes'),
            avg_qual=Avg('quality'),
            best=Max('quality'),
            worst=Min('quality'),
            longest=Max('duration_minutes'),
            shortest=Min('duration_minutes'),
        )
        return {
            'total_records': records.count(),
            'avg_duration_minutes': self._safe_round(aggregates['avg_dur']),
            'avg_quality': self._safe_round(aggregates['avg_qual']),
            'best_quality': aggregates['best'],
            'worst_quality': aggregates['worst'],
            'longest_sleep_minutes': aggregates['longest'],
            'shortest_sleep_minutes': aggregates['shortest'],
        }


class WeeklyStatsStrategy(SleepStatsStrategy):
    """Computes trailing 7-day average duration and quality for a user."""

    def compute(self, user) -> dict:
        week_records = SleepRecord.objects.this_week(user)
        aggregates = week_records.aggregate(
            w_dur=Avg('duration_minutes'),
            w_qual=Avg('quality'),
        )
        return {
            'week_avg_duration_minutes': self._safe_round(aggregates['w_dur']),
            'week_avg_quality': self._safe_round(aggregates['w_qual']),
        }