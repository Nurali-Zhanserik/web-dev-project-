from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/',    views.login_view,    name='login'),
    path('auth/logout/',   views.logout_view,   name='logout'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/delete-account/', views.delete_account_view, name='delete-account'),  # ← add this


    path('records/',      views.SleepRecordListCreateView.as_view(), name='records-list-create'),
    path('records/<int:pk>/', views.SleepRecordDetailView.as_view(), name='records-detail'),

    path('categories/', views.SleepCategoryListCreateView.as_view(), name='categories'),

    path('stats/', views.sleep_stats_view, name='stats'),

    path('profile/', views.UserProfileView.as_view(), name='profile'),
]
