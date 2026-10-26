from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from unittest.mock import patch
from .models import Subscription, Provider, Category
from .serializers import SubscriptionSerializer
import datetime

User = get_user_model()


class SubscriptionSerializerTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.provider = Provider.objects.create(id="provider-1", name="Netflix")
        self.category = Category.objects.create(id="cat-1", name="Streaming", icon="🎬")
        self.factory = APIRequestFactory()

        self.valid_data = {
            "id": "sub-1",
            "createdAt": "2024-01-01T00:00:00Z",
            "name": "Netflix Abo",
            "providerId": "provider-1",
            "categoriesId": ["cat-1"],
            "price": {"amount": 9.99, "currency": "EUR"},
            "renewal": {"amount": 1, "unit": "months"},
            "bookingDate": "2024-01-15",
        }

    def _get_request(self):
        request = self.factory.post("/")
        request.user = self.user
        return request

    # -------------------------
    # Validierung
    # -------------------------

    def test_valid_data_is_valid(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_currency_fails(self):
        data = {**self.valid_data, "price": {"amount": 9.99, "currency": "CHF"}}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("price", serializer.errors)

    def test_invalid_renewal_unit_fails(self):
        data = {**self.valid_data, "renewal": {"amount": 1, "unit": "quarters"}}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("renewal", serializer.errors)

    def test_missing_price_amount_fails(self):
        data = {**self.valid_data, "price": {"currency": "EUR"}}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("price", serializer.errors)

    def test_nonexistent_provider_fails(self):
        data = {**self.valid_data, "providerId": "nicht-vorhanden"}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("providerId", serializer.errors)

    def test_nonexistent_category_fails(self):
        data = {**self.valid_data, "categoriesId": ["nicht-vorhanden"]}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("categoriesId", serializer.errors)

    def test_empty_name_is_valid(self):
        data = {**self.valid_data, "name": ""}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_renewal_amount_must_be_positive(self):
        data = {**self.valid_data, "renewal": {"amount": 0, "unit": "months"}}
        serializer = SubscriptionSerializer(data=data, context={"request": self._get_request()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("renewal", serializer.errors)

    # -------------------------
    # Create
    # -------------------------

    def test_create_sets_user_from_request(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(subscription.user, self.user)

    def test_create_sets_price_correctly(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(float(subscription.price.amount), 9.99)
        self.assertEqual(str(subscription.price_currency), "EUR")

    def test_create_sets_provider_correctly(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(subscription.providerId, self.provider)

    def test_create_sets_categories_correctly(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertIn(self.category, subscription.categoryIds.all())

    def test_create_sets_renewal_correctly(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(subscription.renewal_amount, 1)
        self.assertEqual(subscription.renewal_unit, "months")

    def test_created_subscription_serializes_renewal(self):
        serializer = SubscriptionSerializer(
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(serializer.instance, subscription)
        self.assertEqual(serializer.data["renewal"], {"amount": 1, "unit": "months"})

    # -------------------------
    # Update
    # -------------------------

    def test_update_price(self):
        subscription = Subscription.objects.create(
            id="sub-2",
            createdAt="2024-01-01T00:00:00Z",
            name="Alt",
            providerId=self.provider,
            price=9.99,
            price_currency="EUR",
            renewal_amount=1,
            renewal_unit="months",
            bookingDate="2024-01-15",
            user=self.user,
        )
        data = {**self.valid_data, "price": {"amount": 14.99, "currency": "USD"}}
        serializer = SubscriptionSerializer(
            subscription,
            data=data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(float(updated.price.amount), 14.99)
        self.assertEqual(str(updated.price_currency), "USD")

    def test_update_does_not_change_user(self):
        other_user = User.objects.create_user(username="other", password="pass")
        subscription = Subscription.objects.create(
            id="sub-3",
            createdAt="2024-01-01T00:00:00Z",
            name="Alt",
            providerId=self.provider,
            price=9.99,
            price_currency="EUR",
            renewal_amount=1,
            renewal_unit="months",
            bookingDate="2024-01-15",
            user=self.user,
        )
        serializer = SubscriptionSerializer(
            subscription,
            data=self.valid_data,
            context={"request": self._get_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.user, self.user)  # user bleibt gleich
