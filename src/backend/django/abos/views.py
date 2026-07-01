from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Subscription, Provider, Category
from .serializers import SubscriptionSerializer, ProviderSerializer, CategorySerializer
from rest_framework.permissions import IsAuthenticated
class SubscriptionViewSet(viewsets.ModelViewSet):
  serializer_class = SubscriptionSerializer
  permission_classes = [IsAuthenticated]

  def get_queryset(self):
    # Nutzer sieht nur seine eigenen Subscriptions
    return Subscription.objects.filter(user_id=self.request.user.id)

class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer
    permission_classes = [IsAuthenticated]


class CategoryViewSet(viewsets.ModelViewSet):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer
  permission_classes = [IsAuthenticated]
