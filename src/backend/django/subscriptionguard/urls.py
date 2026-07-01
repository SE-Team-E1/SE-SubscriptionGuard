"""
URL configuration for subscriptionguard project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.db import router
from django.urls import path, include

from drf_spectacular.views import SpectacularSwaggerView, SpectacularRedocView, SpectacularAPIView
from drf_spectacular.views import SpectacularSwaggerView, SpectacularRedocView, SpectacularAPIView
from rest_framework.routers import DefaultRouter
from abos.views import SubscriptionViewSet, ProviderViewSet, CategoryViewSet

router = DefaultRouter()
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('abos.urls')),
  # Swagger UI
  path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

  # ReDoc (alternative Doku)
  path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

  # OpenAPI Schema
  path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

  path('', include(router.urls))
]
