"""Repeatable sample data for the local Compose environment only."""
import os
from datetime import date, datetime, timezone
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from abos.models import Category, Provider, Subscription


class Command(BaseCommand):
    help = "Create local demo accounts and sample data without duplicating records."

    @transaction.atomic
    def handle(self, *args, **options):
        if os.getenv("LOCAL_TEST_DATA") != "true":
            raise CommandError("Seeding requires LOCAL_TEST_DATA=true; use only locally.")

        users = []
        for username in ("demo", "other-demo"):
            user, created = get_user_model().objects.get_or_create(username=username)
            if created:
                user.set_password("local-demo-password")
                user.save()
            users.append(user)

        category, _ = Category.objects.get_or_create(
            id="local-streaming", defaults={"name": "Streaming", "icon": ""}
        )
        provider, _ = Provider.objects.get_or_create(
            id="local-provider", defaults={"name": "Example streaming"}
        )
        for user in users:
            subscription, created = Subscription.objects.get_or_create(
                id=f"local-subscription-{user.username}",
                defaults={
                    "user": user,
                    "name": f"Example subscription ({user.username})",
                    "providerId": provider,
                    "createdAt": datetime(2026, 1, 1, tzinfo=timezone.utc),
                    "price": Decimal("9.99"),
                    "price_currency": "EUR",
                    "renewal_amount": 1,
                    "renewal_unit": "months",
                    "bookingDate": date(2026, 1, 15),
                },
            )
            if created:
                subscription.categoryIds.add(category)

        self.stdout.write(self.style.SUCCESS(
            "Local data ready. New accounts: demo / other-demo; password: local-demo-password. "
            "Existing accounts and data are unchanged."
        ))
