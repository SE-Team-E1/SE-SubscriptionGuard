import os
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from .models import Subscription


class LocalSeedTest(TestCase):
    def test_requires_explicit_local_opt_in(self):
        with patch.dict(os.environ, {"LOCAL_TEST_DATA": "false"}):
            with self.assertRaises(CommandError):
                call_command("seed_local", stdout=StringIO())
        self.assertFalse(get_user_model().objects.exists())

    @patch.dict(os.environ, {"LOCAL_TEST_DATA": "true"})
    def test_repeated_seed_preserves_existing_edits_and_passwords(self):
        call_command("seed_local", stdout=StringIO())
        user = get_user_model().objects.get(username="demo")
        self.assertTrue(user.check_password("local-demo-password"))
        self.assertFalse(user.is_staff)
        user.set_password("changed-local-password")
        user.save()
        subscription = Subscription.objects.get(id="local-subscription-demo")
        subscription.name = "Edited example"
        subscription.save()

        call_command("seed_local", stdout=StringIO())

        user.refresh_from_db()
        subscription.refresh_from_db()
        self.assertTrue(user.check_password("changed-local-password"))
        self.assertEqual(subscription.name, "Edited example")
        self.assertEqual(get_user_model().objects.count(), 2)
        self.assertEqual(Subscription.objects.count(), 2)
        self.assertEqual(subscription.categoryIds.count(), 1)
