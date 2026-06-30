from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "abos"

router = DefaultRouter()
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
