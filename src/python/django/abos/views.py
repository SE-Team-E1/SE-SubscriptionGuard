from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Vertrag
from .serializers import VertragSerializer
from rest_framework.permissions import AllowAny  # oder IsAuthenticated

class VertragViewSet(viewsets.ModelViewSet):
    queryset = Vertrag.objects.all()
    serializer_class = VertragSerializer
    permission_classes = [AllowAny]  # für Tests; in Prod: stricter Regeln
