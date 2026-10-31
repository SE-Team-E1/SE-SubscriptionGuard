from rest_framework import status, generics, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .serializers import (
  UserRegistrationSerializer,
  UserLoginSerializer,
  UserSerializer,
)
from drf_spectacular.utils import extend_schema, inline_serializer

INVALID_CREDENTIALS = {'error': 'Invalid credentials'}


def _find_user_for_login(login):
  if '@' in login:
    candidates = User.objects.filter(email__iexact=login)
  else:
    candidates = User.objects.filter(username=login)
  matches = list(candidates[:2])
  if len(matches) == 1:
    return matches[0]
  return None

class UserRegistrationView(generics.CreateAPIView):
  queryset = User.objects.all()
  serializer_class = UserRegistrationSerializer
  permission_classes = [AllowAny]

  def create(self, request, *args, **kwargs):
    response = super().create(request, *args, **kwargs)
    if response.status_code == 201:
      user = User.objects.get(username=request.data['username'])
      refresh = RefreshToken.for_user(user)
      return Response({
        'message': 'User registered successfully',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
      }, status=status.HTTP_201_CREATED)
    return response

@extend_schema(
    request=UserLoginSerializer,
    responses={
        200: inline_serializer(
            name="LoginResponse",
            fields={
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
                "user": serializers.JSONField(),
            },
        ),
        401: inline_serializer(
            name="LoginErrorResponse",
            fields={
                "error": serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name="LoginValidationErrorResponse",
            fields={},
        ),
    },
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
  serializer = UserLoginSerializer(data=request.data)
  if serializer.is_valid():
    login = serializer.validated_data['login']
    password = serializer.validated_data['password']
    user = _find_user_for_login(login)
    if user is None:
      # Hash anyway so unknown identifiers take as long as known ones.
      User().set_password(password)
      return Response(INVALID_CREDENTIALS, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(password) or not user.is_active:
      return Response(INVALID_CREDENTIALS, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
      'access': str(refresh.access_token),
      'refresh': str(refresh),
      'user': UserSerializer(user).data,
    }, status=status.HTTP_200_OK)
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
