from rest_framework import serializers
from .models import Subscription, Provider, Category
from decimal import Decimal


class PriceSerializer(serializers.Serializer):
  amount = serializers.DecimalField(max_digits=10, decimal_places=2)
  currency = serializers.ChoiceField(choices=["EUR", "USD", "GBP"])


class RenewalSerializer(serializers.Serializer):
  amount = serializers.IntegerField(min_value=1)
  unit = serializers.ChoiceField(choices=["days", "weeks", "months", "years"])

class ProviderSerializer(serializers.ModelSerializer):
  class Meta:
    model = Provider
    fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
  class Meta:
    model = Category
    fields = ["id", "name", "icon"]

class SubscriptionSerializer(serializers.ModelSerializer):
  price = PriceSerializer()
  renewal = RenewalSerializer()
  categoriesId = serializers.PrimaryKeyRelatedField(
    many=True,
    queryset=Category.objects.all(),
    source="categoryIds"
  )
  providerId = serializers.PrimaryKeyRelatedField(
    queryset=Provider.objects.all(),
  )
  createdAt = serializers.DateTimeField()
  bookingDate = serializers.DateField()


  class Meta:
    model = Subscription
    fields = [
      "id",
      "createdAt",
      "name",
      "providerId",
      "categoriesId",
      "price",
      "renewal",
      "bookingDate",
    ]

  def create(self, validated_data):
    price_data = validated_data.pop("price")
    renewal_data = validated_data.pop("renewal")
    category_ids = validated_data.pop("categoryIds", [])
    provider = validated_data.pop("providerId")
    subscription = Subscription.objects.create(
      user=self.context["request"].user,  # aus dem Request-Kontext
      price=price_data["amount"],
      price_currency=price_data["currency"],
      renewal_amount=renewal_data["amount"],
      renewal_unit=renewal_data["unit"],
      providerId=provider,
      **validated_data
    )
    subscription.categoryIds.set(category_ids)
    return subscription


  def update(self, instance, validated_data):
    price_data = validated_data.pop("price", None)
    renewal_data = validated_data.pop("renewal", None)
    category_ids = validated_data.pop("categoryIds", None)
    provider = validated_data.pop("providerId", None)

    if price_data:
      instance.price = price_data["amount"]
      instance.price_currency = price_data["currency"]

    if provider:
      instance.providerId = provider

    if renewal_data:
      instance.renewal_amount = renewal_data["amount"]
      instance.renewal_unit = renewal_data["unit"]

    if category_ids is not None:
      instance.categoryIds.set(category_ids)

    for attr, value in validated_data.items():
      setattr(instance, attr, value)

    instance.save()
    return instance
