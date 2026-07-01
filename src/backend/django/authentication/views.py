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
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    try:
      user = User.objects.get(username=username)
      if user.check_password(password):
        refresh = RefreshToken.for_user(user)
        return Response({
          'access': str(refresh.access_token),
          'refresh': str(refresh),
          'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
      else:
        return Response({
          'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
      return Response({
        'error': 'User not found'
      }, status=status.HTTP_401_UNAUTHORIZED)
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
