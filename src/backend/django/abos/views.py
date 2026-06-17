from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Subscription
from .serializers import SubscriptionSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated  # oder IsAuthenticated


class SubscriptionViewSet(viewsets.ModelViewSet):
  serializer_class = SubscriptionSerializer
  permission_classes = [IsAuthenticated]  # unauthentifizierte Requests blockieren

  def get_queryset(self):
    # Nutzer sieht nur seine eigenen Subscriptions
    return Subscription.objects.filter(user=self.request.user)
