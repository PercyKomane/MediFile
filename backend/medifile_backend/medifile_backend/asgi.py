"""
ASGI config for medifile_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Temporarily use standard ASGI until Channels is properly installed
application = django_asgi_app

# from channels.routing import ProtocolTypeRouter, URLRouter
# from core.middleware import JWTAuthMiddleware
# import core.routing
# 
# application = ProtocolTypeRouter({
#     "http": django_asgi_app,
#     "websocket": JWTAuthMiddleware(
#         URLRouter(
#             core.routing.websocket_urlpatterns
#         )
#     ),
# })
