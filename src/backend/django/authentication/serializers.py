from rest_framework import serializers
from django.contrib.auth.models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
  password = serializers.CharField(write_only=True, min_length=8)
  password_confirm = serializers.CharField(write_only=True, min_length=8)

  class Meta:
    model = User
    fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

  def validate(self, data):
    if data['password'] != data['password_confirm']:
      raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
    return data

  def create(self, validated_data):
    validated_data.pop('password_confirm')
    password = validated_data.pop('password')
    user = User.objects.create_user(**validated_data)
    user.set_password(password)
    user.save()
    return user


class UserLoginSerializer(serializers.Serializer):
  username = serializers.CharField()
  password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id', 'username', 'email', 'first_name', 'last_name']
