import datetime

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from djmoney.models.fields import MoneyField
from dateutil.relativedelta import relativedelta
from django.conf import settings
import calendar



# Create your models here.
class Category(models.Model):
  id = models.CharField(primary_key=True)
  name = models.CharField()
  icon = models.CharField()
class Provider(models.Model):
  def __str__(self):
    return ""
  id = models.CharField(primary_key=True)
  name = models.TextField()

class Subscription(models.Model):
  class Currency(models.TextChoices):
    EUR = "EUR", "Euro"
    USD = "USD", "US Dollar"
    GBP = "GBP", "British Pound"
  def __str__(self):
    return ""

  @property
  def renewal(self):
    return {
      "amount": self.renewal_amount,
      "unit": self.renewal_unit,
    }

  user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        null=False,  # optional je nach Wunsch; besser: False wenn immer vorhanden
        blank=True
    )
  id = models.CharField(primary_key=True)
  createdAt = models.DateTimeField()
  name = models.CharField(blank=True, default="")
  providerId = models.ForeignKey(Provider, on_delete=models.CASCADE)
  categoryIds = models.ManyToManyField(Category)
  price = MoneyField(max_digits=10, decimal_places=2, default_currency="EUR")
  NOTICE_UNIT_CHOICES = [
    ('days', 'Tage'),
    ('weeks', 'Wochen'),
    ('months', 'Monate'),
    ('years', 'Jahre'),
  ]
  renewal_amount = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Zahl z.B. 3')
  renewal_unit = models.CharField(max_length=10, choices=NOTICE_UNIT_CHOICES, default='months', blank=True)
  bookingDate = models.DateField(null=True, blank=True)
