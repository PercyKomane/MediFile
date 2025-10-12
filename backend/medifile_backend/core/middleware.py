from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


@database_sync_to_async
def get_user_from_token(token_key):
    """
    Get user from JWT token.
    """
    try:
        # Use the JWT authentication class to validate token
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token_key)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that takes JWT token from query string.
    """
    
    async def __call__(self, scope, receive, send):
        # Look for token in query string
        query_string = scope.get("query_string", b"").decode()
        token_key = None
        
        # Parse query string
        if query_string:
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token_key = param.split("=", 1)[1]
                    break
        
        # Get user from token
        if token_key:
            scope["user"] = await get_user_from_token(token_key)
        else:
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
