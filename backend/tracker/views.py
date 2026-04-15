from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import SleepRecord, SleepGoal
from .serializers import SleepRecordSerializer, SleepGoalSerializer


@api_view(['GET', 'POST'])
def sleep_record_list(request):
    if request.method == 'GET':
        records = SleepRecord.objects.all()
        serializer = SleepRecordSerializer(records, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SleepRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_id=1)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def sleep_record_detail(request, pk):
    record = get_object_or_404(SleepRecord, pk=pk)

    if request.method == 'GET':
        serializer = SleepRecordSerializer(record)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SleepRecordSerializer(record, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SleepGoalListAPIView(APIView):
    def get(self, request):
        goals = SleepGoal.objects.all()
        serializer = SleepGoalSerializer(goals, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SleepGoalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user_id=1)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SleepGoalDetailAPIView(APIView):
    def get(self, request, pk):
        goal = get_object_or_404(SleepGoal, pk=pk)
        serializer = SleepGoalSerializer(goal)
        return Response(serializer.data)

    def put(self, request, pk):
        goal = get_object_or_404(SleepGoal, pk=pk)
        serializer = SleepGoalSerializer(goal, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        goal = get_object_or_404(SleepGoal, pk=pk)
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)