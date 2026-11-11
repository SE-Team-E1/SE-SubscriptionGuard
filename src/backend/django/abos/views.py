from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Subscription, Provider, Category
from .serializers import SubscriptionSerializer, ProviderSerializer, CategorySerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def total_costs_view(request):
  totals = (
    Subscription.objects
    .filter(user=request.user)
    .values("price_currency")
    .annotate(total=Sum("price"))
  )

  return Response({
    "totals": {
      entry["price_currency"]: format(entry["total"].quantize(Decimal("0.01")), "f")
      for entry in totals
    }
  })


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
