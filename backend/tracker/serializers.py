from rest_framework import serializers
from .models import SleepRecord, SleepGoal, SleepTag, RecordTag


class SleepTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepTag
        fields = '__all__'


class SleepGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepGoal
        fields = '__all__'
        read_only_fields = ['user']


class SleepRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepRecord
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class RecordTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordTag
        fields = '__all__'