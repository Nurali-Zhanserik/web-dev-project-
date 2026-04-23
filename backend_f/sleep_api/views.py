from django.contrib.auth.models import User
from django.db.models import Avg, Max, Min
from django.utils import timezone
import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import SleepRecord, SleepCategory, UserProfile, SleepGoal
from .serializers import (
    LoginSerializer, SleepStatsSerializer,
    UserSerializer, SleepRecordSerializer,
    SleepCategorySerializer, SleepGoalSerializer,
    UserProfileSerializer,
)




@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    FBV 1 — Login endpoint.
    Validates credentials and returns JWT access + refresh tokens.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Account is disabled.'},
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    FBV 2 — Logout endpoint.
    Blacklists the provided refresh token so it can no longer be used.
    """
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
    except TokenError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    FBV 3 — User registration.
    Creates a new user account linked to a UserProfile and SleepGoal.
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sleep_stats_view(request):
    """
    FBV 4 — Sleep statistics for the authenticated user.
    Uses SleepStatsSerializer (plain Serializer) to shape the response.
    """
    records = SleepRecord.objects.for_user(request.user)
    week_records = SleepRecord.objects.this_week(request.user)

    aggregates = records.aggregate(
        avg_dur=Avg('duration_minutes'),
        avg_qual=Avg('quality'),
        best=Max('quality'),
        worst=Min('quality'),
        longest=Max('duration_minutes'),
        shortest=Min('duration_minutes'),
    )
    week_aggregates = week_records.aggregate(
        w_dur=Avg('duration_minutes'),
        w_qual=Avg('quality'),
    )

    stats_data = {
        'total_records': records.count(),
        'avg_duration_minutes': round(aggregates['avg_dur'] or 0, 1),
        'avg_quality': round(aggregates['avg_qual'] or 0, 1),
        'best_quality': aggregates['best'],
        'worst_quality': aggregates['worst'],
        'longest_sleep_minutes': aggregates['longest'],
        'shortest_sleep_minutes': aggregates['shortest'],
        'week_avg_duration_minutes': round(week_aggregates['w_dur'] or 0, 1),
        'week_avg_quality': round(week_aggregates['w_qual'] or 0, 1),
    }

    serializer = SleepStatsSerializer(stats_data)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    user = request.user
    user.delete()
    return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

class SleepRecordListCreateView(APIView):
    """
    CBV 1 — List all sleep records for the authenticated user, or create a new one.
    Full CRUD for SleepRecord (list + create here; detail/update/delete below).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = SleepRecord.objects.for_user(request.user)
        serializer = SleepRecordSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Requirement: link created objects to the authenticated user (request.user).
        """
        serializer = SleepRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # link to request.user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SleepRecordDetailView(APIView):
    """
    CBV 2 — Retrieve, update, or delete a single sleep record.
    Completes the full CRUD operations for SleepRecord.
    """
    permission_classes = [IsAuthenticated]

    def _get_record(self, pk, user):
        try:
            return SleepRecord.objects.get(pk=pk, user=user)
        except SleepRecord.DoesNotExist:
            return None

    def get(self, request, pk):
        record = self._get_record(pk, request.user)
        if not record:
            return Response({'error': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SleepRecordSerializer(record)
        return Response(serializer.data)

    def put(self, request, pk):
        record = self._get_record(pk, request.user)
        if not record:
            return Response({'error': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SleepRecordSerializer(record, data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        record = self._get_record(pk, request.user)
        if not record:
            return Response({'error': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SleepRecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        record = self._get_record(pk, request.user)
        if not record:
            return Response({'error': 'Record not found.'}, status=status.HTTP_404_NOT_FOUND)
        record.delete()
        return Response({'message': 'Record deleted.'}, status=status.HTTP_204_NO_CONTENT)


class SleepCategoryListCreateView(APIView):
    """
    CBV 3 — List and create sleep categories for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = SleepCategory.objects.filter(user=request.user)
        serializer = SleepCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SleepCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # link to request.user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    CBV 4 — Get or update the authenticated user's profile and goal.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)

        try:
            goal = request.user.sleep_goal
        except SleepGoal.DoesNotExist:
            goal = SleepGoal.objects.create(user=request.user)

        return Response({
            'profile': UserProfileSerializer(profile).data,
            'goal': SleepGoalSerializer(goal).data,
            'user': UserSerializer(request.user).data,
        })

    def patch(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)

        profile_data = request.data.get('profile', {})
        goal_data = request.data.get('goal', {})

        if profile_data:
            p_serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
            if not p_serializer.is_valid():
                return Response(p_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            p_serializer.save()

        if goal_data:
            try:
                goal = request.user.sleep_goal
            except SleepGoal.DoesNotExist:
                goal = SleepGoal.objects.create(user=request.user)
            g_serializer = SleepGoalSerializer(goal, data=goal_data, partial=True)
            if not g_serializer.is_valid():
                return Response(g_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            g_serializer.save()

        return self.get(request)
