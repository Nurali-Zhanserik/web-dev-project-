import datetime
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from .models import SleepCategory, SleepRecord


class SleepTrackerVerificationTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='alice', password='Password123!')
        self.user_b = User.objects.create_user(username='bob', password='Password123!')
        self.client_a = APIClient()
        self.client_a.force_authenticate(user=self.user_a)
        self.anon_client = APIClient()

    def test_ac1_duration_calculation_across_midnight(self):
        rec = SleepRecord.objects.create(
            user=self.user_a,
            date=datetime.date(2026, 11, 18),
            sleep_time=datetime.time(23, 30),
            wake_time=datetime.time(7, 0),
            quality=4,
        )
        self.assertEqual(rec.duration_minutes, 450)

    def test_ac2_authentication_and_user_isolation(self):
        SleepRecord.objects.create(
            user=self.user_b,
            date=datetime.date(2026, 11, 18),
            sleep_time=datetime.time(22, 0),
            wake_time=datetime.time(6, 0),
            quality=5,
        )
        unauth = self.anon_client.get('/api/records/')
        self.assertEqual(unauth.status_code, 401)

        authed = self.client_a.get('/api/records/')
        self.assertEqual(authed.status_code, 200)
        self.assertEqual(len(authed.data), 0)

    def test_ac3_and_task03_stats_strategy_empty_and_populated(self):
        empty_res = self.client_a.get('/api/stats/')
        self.assertEqual(empty_res.status_code, 200)
        self.assertEqual(empty_res.data['total_records'], 0)
        self.assertEqual(empty_res.data['avg_duration_minutes'], 0.0)

        SleepRecord.objects.create(
            user=self.user_a,
            date=datetime.date.today(),
            sleep_time=datetime.time(0, 0),
            wake_time=datetime.time(8, 0),
            quality=4,
        )
        pop_res = self.client_a.get('/api/stats/')
        self.assertEqual(pop_res.status_code, 200)
        self.assertEqual(pop_res.data['total_records'], 1)
        self.assertEqual(pop_res.data['avg_duration_minutes'], 480.0)
        self.assertEqual(pop_res.data['week_avg_duration_minutes'], 480.0)

    def test_r02_rejects_cross_user_category_and_equal_patch_times(self):
        bob_cat = SleepCategory.objects.create(user=self.user_b, name='Bob Private')
        bad_cat_res = self.client_a.post('/api/records/', {
            'date': '2026-11-18',
            'sleep_time': '23:00:00',
            'wake_time': '07:00:00',
            'quality': 4,
            'category': bob_cat.id,
        }, format='json')
        self.assertEqual(bad_cat_res.status_code, 400)
        self.assertIn('category', bad_cat_res.data)

        created = self.client_a.post('/api/records/', {
            'date': '2026-11-18',
            'sleep_time': '23:00:00',
            'wake_time': '07:00:00',
            'quality': 4,
        }, format='json')
        self.assertEqual(created.status_code, 201)

        rec_id = created.data['id']
        bad_patch = self.client_a.patch(f'/api/records/{rec_id}/', {
            'wake_time': '23:00:00',
        }, format='json')
        self.assertEqual(bad_patch.status_code, 400)