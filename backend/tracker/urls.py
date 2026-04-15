from django.urls import path
from .views import (
    sleep_record_list,
    sleep_record_detail,
    SleepGoalListAPIView,
    SleepGoalDetailAPIView,
)
from .auth_views import login_view, logout_view

urlpatterns = [
    path('records/', sleep_record_list),
    path('records/<int:pk>/', sleep_record_detail),

    path('goals/', SleepGoalListAPIView.as_view()),
    path('goals/<int:pk>/', SleepGoalDetailAPIView.as_view()),

    path('login/', login_view),
    path('logout/', logout_view),
]