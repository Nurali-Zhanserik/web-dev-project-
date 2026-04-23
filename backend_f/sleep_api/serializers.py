from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SleepRecord, SleepCategory, UserProfile, SleepGoal




class LoginSerializer(serializers.Serializer):
    """Plain serializer for login credentials — not tied to any model."""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_username(self, value):
        if not value.strip():
            raise serializers.ValidationError("Username cannot be blank.")
        return value.lower()

    def validate_password(self, value):
        if len(value) < 4:
            raise serializers.ValidationError("Password must be at least 4 characters.")
        return value


class SleepStatsSerializer(serializers.Serializer):
    """
    Plain serializer for aggregated sleep statistics.
    Used to shape the computed stats response — no model behind it.
    """
    total_records = serializers.IntegerField()
    avg_duration_minutes = serializers.FloatField()
    avg_quality = serializers.FloatField()
    best_quality = serializers.IntegerField(allow_null=True)
    worst_quality = serializers.IntegerField(allow_null=True)
    longest_sleep_minutes = serializers.IntegerField(allow_null=True)
    shortest_sleep_minutes = serializers.IntegerField(allow_null=True)
    week_avg_duration_minutes = serializers.FloatField()
    week_avg_quality = serializers.FloatField()



class UserSerializer(serializers.ModelSerializer):
    """ModelSerializer for the built-in User model — used for registration and profile."""
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Auto-create profile and goal on registration
        UserProfile.objects.create(user=user)
        SleepGoal.objects.create(user=user)
        return user


class SleepRecordSerializer(serializers.ModelSerializer):
    """
    ModelSerializer for SleepRecord.
    Includes computed display fields and links to the authenticated user.
    """
    quality_display = serializers.CharField(source='get_quality_display', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = SleepRecord
        fields = [
            'id', 'date', 'sleep_time', 'wake_time',
            'quality', 'quality_display', 'notes',
            'duration_minutes', 'duration_hours',
            'category', 'category_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'duration_minutes', 'created_at', 'updated_at']

    def get_duration_hours(self, obj):
        h = obj.duration_minutes // 60
        m = obj.duration_minutes % 60
        return f"{h}h {m}m"

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def validate(self, data):
        sleep = data.get('sleep_time')
        wake = data.get('wake_time')
        if sleep and wake and sleep == wake:
            raise serializers.ValidationError("Sleep time and wake time cannot be the same.")
        return data


class SleepCategorySerializer(serializers.ModelSerializer):
    """ModelSerializer for SleepCategory."""
    record_count = serializers.SerializerMethodField()

    class Meta:
        model = SleepCategory
        fields = ['id', 'name', 'color', 'record_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_record_count(self, obj):
        return obj.records.count()


class SleepGoalSerializer(serializers.ModelSerializer):
    """ModelSerializer for SleepGoal."""
    target_duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = SleepGoal
        fields = [
            'id', 'target_duration_minutes', 'target_duration_hours',
            'target_quality', 'target_bedtime', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_target_duration_hours(self, obj):
        h = obj.target_duration_minutes // 60
        m = obj.target_duration_minutes % 60
        return f"{h}h {m}m"


class UserProfileSerializer(serializers.ModelSerializer):
    """ModelSerializer for UserProfile."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'bio', 'timezone', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'email', 'created_at', 'updated_at']
