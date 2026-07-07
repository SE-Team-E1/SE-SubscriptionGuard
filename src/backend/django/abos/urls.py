from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ProviderViewSet, CategoryViewSet

app_name = "abos"

router = DefaultRouter()
router.register(r'subscriptions', views.SubscriptionViewSet, basename='subscription')
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"categories", CategoryViewSet, basename="category")


urlpatterns = [
    path('', include(router.urls)),
]
