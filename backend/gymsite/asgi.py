import os
from django.core.asgi import get_asgi_application

# Set Django settings module FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gymsite.settings')

# Initialize Django ASGI application early to ensure AppRegistry is ready
django_asgi_app = get_asgi_application()

# Import channels and routing AFTER Django is initialized
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from gymsite.chats.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})