import json

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.test import APITestCase

from .serializers import UserRegistrationSerializer

User = get_user_model()

PASSWORD = 'Sicher123!'
WRONG_PASSWORD = 'Falsch123!'
INVALID_CREDENTIALS = {'error': 'Invalid credentials'}
USER_KEYS = {'id', 'username', 'email', 'first_name', 'last_name'}


class LoginApiTest(APITestCase):

  def setUp(self):
    self.otto = User.objects.create_user(
      username='otto', email='otto@example.de', password=PASSWORD,
    )
    self.inaktiv = User.objects.create_user(
      username='inaktiv', email='inaktiv@example.de', password=PASSWORD, is_active=False,
    )

  def _login(self, data):
    return self.client.post('/api/auth/login/', data, format='json')

  def _assert_tokens(self, body):
    for key in ('access', 'refresh'):
      self.assertIsInstance(body[key], str)
      self.assertTrue(body[key])

  # -------------------------
  # Login per E-Mail
  # -------------------------

  def test_login_with_email(self):  # T-1
    # Arrange
    data = {'login': 'otto@example.de', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    body = response.json()
    self._assert_tokens(body)
    self.assertEqual(body['user']['email'], 'otto@example.de')
    self.assertEqual(set(body['user'].keys()), USER_KEYS)

  def test_login_with_username(self):  # T-2
    # Arrange
    data = {'login': 'otto', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    body = response.json()
    self._assert_tokens(body)
    self.assertEqual(body['user']['username'], 'otto')

  def test_login_with_email_ignores_case(self):  # T-3
    # Arrange
    data = {'login': 'OTTO@Example.DE', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.json()['user']['id'], self.otto.id)

  def test_login_with_username_ignores_case(self):  # T-4
    # Arrange
    data = {'login': 'OTTO', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.json()['user']['id'], self.otto.id)
    self.assertEqual(response.json()['user']['username'], 'otto')

  def test_login_after_registration(self):  # T-16
    # Arrange
    registration = {
      'username': 'neu',
      'email': ' Neu@Example.de ',
      'password': PASSWORD,
      'password_confirm': PASSWORD,
    }
    registered = self.client.post('/api/auth/register/', registration, format='json')

    # Act
    response = self._login({'login': 'neu@example.de', 'password': PASSWORD})

    # Assert
    self.assertEqual(registered.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self._assert_tokens(response.json())

  def test_login_with_email_surrounded_by_whitespace(self):  # T-22
    # Arrange
    data = {'login': ' otto@example.de ', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  # -------------------------
  # Fehlerantworten
  # -------------------------

  def test_wrong_password_and_unknown_email_look_the_same(self):  # T-5
    # Arrange: user otto from setUp

    # Act
    wrong_password = self._login({'login': 'otto@example.de', 'password': WRONG_PASSWORD})
    unknown = self._login({'login': 'niemand@example.de', 'password': PASSWORD})

    # Assert
    self.assertEqual(wrong_password.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(unknown.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(wrong_password.content, unknown.content)
    self.assertEqual(wrong_password.json(), INVALID_CREDENTIALS)

  def test_wrong_password_and_unknown_username_look_the_same(self):  # T-6
    # Arrange: user otto from setUp

    # Act
    wrong_password = self._login({'login': 'otto', 'password': WRONG_PASSWORD})
    unknown = self._login({'login': 'niemand', 'password': PASSWORD})

    # Assert
    self.assertEqual(wrong_password.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(unknown.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(wrong_password.content, unknown.content)
    self.assertEqual(wrong_password.json(), INVALID_CREDENTIALS)

  def test_inactive_account_is_rejected(self):  # T-7
    # Arrange: inactive user from setUp, response for an unknown account as reference
    unknown = self._login({'login': 'niemand@example.de', 'password': PASSWORD})

    for login in ('inaktiv@example.de', 'inaktiv'):
      with self.subTest(login=login):
        # Act
        response = self._login({'login': login, 'password': PASSWORD})

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.content, unknown.content)
        self.assertNotIn('access', response.json())
        self.assertNotIn('refresh', response.json())

  def test_ambiguous_email_is_rejected(self):  # T-21
    # Arrange: second user with the same email in other case, response for an unknown account as reference
    unknown = self._login({'login': 'niemand@example.de', 'password': PASSWORD})
    User.objects.create_user(username='otto_alt', email='OTTO@example.de', password=PASSWORD)

    # Act
    by_email = self._login({'login': 'otto@example.de', 'password': PASSWORD})
    by_username = self._login({'login': 'otto', 'password': PASSWORD})

    # Assert
    self.assertEqual(by_email.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(by_email.content, unknown.content)
    self.assertNotIn('access', by_email.json())
    self.assertEqual(by_username.status_code, status.HTTP_200_OK)

  # -------------------------
  # Validierung
  # -------------------------

  def test_missing_fields_fail(self):  # T-8
    # Arrange
    cases = (
      ({'password': PASSWORD}, 'login'),
      ({'login': 'otto'}, 'password'),
    )

    for data, field in cases:
      with self.subTest(field=field):
        # Act
        response = self._login(data)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(field, response.json())

  def test_blank_fields_fail(self):  # T-9
    # Arrange
    cases = (
      ({'login': '', 'password': PASSWORD}, 'login'),
      ({'login': 'otto', 'password': ''}, 'password'),
    )

    for data, field in cases:
      with self.subTest(field=field):
        # Act
        response = self._login(data)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(field, response.json())

  def test_username_field_is_not_accepted(self):  # T-10
    # Arrange
    data = {'username': 'otto', 'password': PASSWORD}

    # Act
    response = self._login(data)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    body = response.json()
    self.assertIn('login', body)
    self.assertNotIn('access', body)
    self.assertNotIn('refresh', body)


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

  def test_register_keeps_username_case(self):  # T-24
    # Arrange
    data = {**self.valid_registration, 'username': 'NeuerUser'}

    # Act
    response = self.client.post('/api/auth/register/', data, format='json')

    # Assert
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(User.objects.filter(username='NeuerUser').exists())

  def test_database_rejects_username_with_other_case(self):  # T-25
    # Act / Assert
    with self.assertRaises(IntegrityError), transaction.atomic():
      User.objects.create_user(username='OTTO', email='otto2@example.de', password=PASSWORD)


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

  def test_existing_username_with_other_case_fails(self):  # T-26
    # Arrange
    data = {**self.valid_registration, 'username': 'Otto'}
    serializer = UserRegistrationSerializer(data=data)

    # Act
    is_valid = serializer.is_valid()

    # Assert
    self.assertFalse(is_valid)
    self.assertIn('username', serializer.errors)

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


class LoginSchemaTest(APITestCase):

  def _resolve(self, schema, node):
    ref = node.get('$ref')
    if ref is None:
      return node
    return schema['components']['schemas'][ref.split('/')[-1]]

  def _content_schema(self, schema, content):
    return self._resolve(schema, next(iter(content.values()))['schema'])

  # -------------------------
  # OpenAPI-Schema
  # -------------------------

  def test_login_schema_describes_login_field_and_401(self):  # T-20
    # Arrange
    url = '/api/schema/?format=json'

    # Act
    response = self.client.get(url)

    # Assert
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    schema = json.loads(response.content)
    operation = schema['paths']['/api/auth/login/']['post']
    request_schema = self._content_schema(schema, operation['requestBody']['content'])
    self.assertIn('login', request_schema['properties'])
    self.assertNotIn('username', request_schema['properties'])
    error_schema = self._content_schema(schema, operation['responses']['401']['content'])
    self.assertIn('error', error_schema['properties'])
