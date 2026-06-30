from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = "authentication"

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
