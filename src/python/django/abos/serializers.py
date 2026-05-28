from rest_framework import serializers
from .models import Vertrag
from decimal import Decimal

class VertragSerializer(serializers.ModelSerializer):
    # wir exponieren Preis als Menge + Currency, weil djmoney-Feld nicht automatisch gemappt wird
    preis_amount = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True)
    preis_currency = serializers.CharField(max_length=8, default='EUR', write_only=True)
    preis = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vertrag
        fields = [
            'id', 'anbieter', 'preis', 'preis_amount', 'preis_currency',
            'kündigungsfrist_amount', 'kündigungsfrist_unit',
            'buchumsdatum', 'abschlussdatum',
        ]

    def get_preis(self, obj):
      """Gibt Preis mit amount und currency-Code zurück (JSON-serialisierbar)."""
      if obj.preis is None:
        return None
      return {
        "amount": str(obj.preis.amount),
        "currency": str(obj.preis.currency.code)  # ← .code macht es zu einem String
      }

    def create(self, validated_data):
        # entnehme price-Teile und setze djmoney-Feld manuell
        price_amount = validated_data.pop('preis_amount', None)
        price_currency = validated_data.pop('preis_currency', None)
        vertrag = Vertrag(**validated_data)
        if price_amount is not None:
            setattr(vertrag, 'preis', Decimal(price_amount))
            if price_currency:
                setattr(vertrag, 'preis_currency', price_currency)
        vertrag.full_clean()
        vertrag.save()
        return vertrag
