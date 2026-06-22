from rest_framework import viewsets
from .models import Subscription
from .serializers import SubscriptionSerializer
from rest_framework.permissions import IsAuthenticated


class SubscriptionViewSet(viewsets.ModelViewSet):
  serializer_class = SubscriptionSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    # Nutzer sieht nur seine eigenen Subscriptions
    return Subscription.objects.filter(user=self.request.user)
