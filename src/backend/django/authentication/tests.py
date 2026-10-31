from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .serializers import UserRegistrationSerializer

User = get_user_model()

PASSWORD = 'Sicher123!'


class RegistrationApiTest(APITestCase):

  def setUp(self):
    self.otto = User.objects.create_user(
      username='otto', email='otto@example.de', password=PASSWORD,
    )
    self.valid_registration = {
      'username': 'neu',
      'email': 'neu@example.de',
      'password': PASSWORD,
      'password_confirm': PASSWORD,
    }

  # -------------------------
  # Registrierung
  # -------------------------

  def test_register_with_existing_email_fails(self):  # T-11
    # Arrange
    data = {**self.valid_registration, 'username': 'otto2', 'email': 'otto@example.de'}

    # Act
    response = self.client.post('/api/auth/register/', data, format='json')

    # Assert
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('email', response.json())
    self.assertEqual(User.objects.filter(email__iexact='otto@example.de').count(), 1)
    self.assertFalse(User.objects.filter(username='otto2').exists())

  def test_register_without_or_with_blank_email_fails(self):  # T-13
    # Arrange
    without_email = {k: v for k, v in self.valid_registration.items() if k != 'email'}
    blank_email = {**self.valid_registration, 'email': ''}

    for label, data in (('ohne email', without_email), ('leere email', blank_email)):
      with self.subTest(label):
        count_before = User.objects.count()

        # Act
        response = self.client.post('/api/auth/register/', data, format='json')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.json())
        self.assertEqual(User.objects.count(), count_before)

  def test_register_normalizes_email(self):  # T-15
    # Arrange
    data = {**self.valid_registration, 'email': ' Neu@Example.de '}

    # Act
    response = self.client.post('/api/auth/register/', data, format='json')

    # Assert
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(set(response.json().keys()), {'message', 'access', 'refresh'})
    self.assertEqual(User.objects.get(username='neu').email, 'neu@example.de')


class UserRegistrationSerializerTest(APITestCase):

  def setUp(self):
    self.otto = User.objects.create_user(
      username='otto', email='otto@example.de', password=PASSWORD,
    )
    self.valid_registration = {
      'username': 'neu',
      'email': 'neu@example.de',
      'password': PASSWORD,
      'password_confirm': PASSWORD,
    }

  # -------------------------
  # Validierung
  # -------------------------

  def test_existing_email_with_other_case_fails(self):  # T-12
    # Arrange
    data = {**self.valid_registration, 'email': 'Otto@Example.de'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('email', serializer.errors)

  def test_invalid_email_format_fails(self):  # T-14
    # Arrange
    data = {**self.valid_registration, 'email': 'kein-at-zeichen'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('email', serializer.errors)

  def test_missing_username_fails(self):  # T-17
    # Arrange
    data = {k: v for k, v in self.valid_registration.items() if k != 'username'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('username', serializer.errors)

  def test_username_with_at_sign_fails(self):  # T-18
    # Arrange
    data = {**self.valid_registration, 'username': 'a@b'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('username', serializer.errors)

  def test_whitespace_only_email_fails(self):  # T-19
    # Arrange
    data = {**self.valid_registration, 'email': '   '}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('email', serializer.errors)

  def test_too_long_email_fails(self):  # T-23
    # Arrange
    data = {**self.valid_registration, 'email': 'a' * 244 + '@example.de'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('email', serializer.errors)
