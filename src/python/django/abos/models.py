import datetime

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from djmoney.models.fields import MoneyField
from dateutil.relativedelta import relativedelta
import calendar
# Create your models here.
class Vertrag(models.Model):
  def __str__(self):
    return ""
  anbieter = models.CharField(max_length=100)
  preis = MoneyField(decimal_places=2, default=0, default_currency="Eur", max_digits=12)
  NOTICE_UNIT_CHOICES = [
    ('days', 'Tage'),
    ('weeks', 'Wochen'),
    ('months', 'Monate'),
    ('years', 'Jahre'),
  ]
  kündigungsfrist_amount = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Zahl z.B. 3')
  kündigungsfrist_unit = models.CharField(max_length=10, choices=NOTICE_UNIT_CHOICES, default='months', blank=True)
  buchumsdatum = models.PositiveSmallIntegerField(
    null=True,
    blank=True,
    validators=[MinValueValidator(1), MaxValueValidator(31)],
    help_text='Tag im Monat (1–31), an dem die Buchung/Abrechnung stattfinden soll'
  )
  abschlussdatum = models.DateField(null=True, blank=True)

  def get_billing_date_for_month(self, year: int, month: int) -> datetime.date | None:
    """
    Gibt ein konkretes Datum im angegebenen Jahr/Monat zurück,
    das dem gewünschten `buchumsdatum` entspricht.
    Falls der Monat weniger Tage hat, wird das letzte Tagesdatum verwendet.
    Beispiel: buchumsdatum=31, Monat=Februar -> 28 (oder 29)
    """
    if not self.buchumsdatum:
      return None
    last_day = calendar.monthrange(year, month)[1]  # z.B. 28,29,30,31
    day = min(self.buchumsdatum, last_day)
    return datetime.date(year, month, day)

  def next_billing_date_after(self, reference_date: datetime.date | None = None) -> datetime.date | None:
    """
    Berechnet das nächste Buchungs-/Rechnungsdatum nach `reference_date`.
    Falls kein reference_date übergeben wird, wird heute verwendet.
    """
    if not self.buchumsdatum:
      return None
    if reference_date is None:
      reference_date = datetime.date.today()

    # Versuche im aktuellen Monat, ansonsten nächster Monat
    candidate = self.get_billing_date_for_month(reference_date.year, reference_date.month)
    if candidate and candidate > reference_date:
      return candidate
    # nächster Monat
    next_month = reference_date + relativedelta(months=1)
    return self.get_billing_date_for_month(next_month.year, next_month.month)

  def get_notice_period_timedelta_or_relativedelta(self):
    """Gibt entweder timedelta (bei days/weeks) oder relativedelta (bei months/years) zurück."""
    if not self.kündigungsfrist_amount:
      return None
    amt = self.kündigungsfrist_amount
    unit = self.kündigungsfrist_unit
    if unit == 'days':
      return datetime.timedelta(days=amt)
    if unit == 'weeks':
      return datetime.timedelta(weeks=amt)
    if unit == 'months':
      return relativedelta(months=amt)
    if unit == 'years':
      return relativedelta(years=amt)
    return None

  def calculate_cancel_deadline(self, reference_date=None):
    """
    Berechnet das Datum, bis zu dem gekündigt werden muss,
    z.B. für einen Vertrag mit start_date oder einem Rechnungsdatum.
    reference_date: datetime.date (z.B. start_date oder next_billing_date)
    """
    period = self.get_notice_period_timedelta_or_relativedelta()
    if period is None:
      return None
    if reference_date is None:
      reference_date = self.abschlussdatum
    if reference_date is None:
      return None
    # relativedelta und timedelta unterstützen unterschiedliche Addition
    return reference_date + period
