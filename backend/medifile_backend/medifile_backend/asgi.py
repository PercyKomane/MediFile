"""
ASGI config for medifile_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medifile_backend.settings')

django_asgi_app = get_asgi_application()

try:
    # Lazy import to avoid circulars if core not ready
    from core import routing as core_routing
    websocket_routes = core_routing.websocket_urlpatterns
except Exception:
    websocket_routes = []

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_routes)
    ),
})
