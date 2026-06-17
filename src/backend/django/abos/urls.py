from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "abos"

router = DefaultRouter()
router.register(r'', views.SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
