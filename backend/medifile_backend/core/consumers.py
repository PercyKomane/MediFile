from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"].get("conversation_id")
        self.user = self.scope.get("user")
        
        # Only allow authenticated users
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
            
        self.group_name = f"conversation_{self.conversation_id}"
        
        # Verify user has access to this conversation
        if await self.user_has_access():
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Support typing indicator messages
        msg_type = content.get("type")
        if msg_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.typing",
                    "payload": {
                        "type": "typing", 
                        "typing": True,
                        "user_id": self.user.user_id
                    },
                },
            )

    async def chat_message(self, event):
        await self.send_json(event.get("payload", {}))

    async def chat_typing(self, event):
        await self.send_json(event.get("payload", {}))
    
    @database_sync_to_async
    def user_has_access(self):
        """Check if user has access to this conversation."""
        from .models import Conversation
        try:
            conv = Conversation.objects.get(pk=self.conversation_id)
            # Check if user is either the patient or doctor in this conversation
            if hasattr(self.user, 'patient') and conv.patient == self.user.patient:
                return True
            if hasattr(self.user, 'doctor') and conv.doctor == self.user.doctor:
                return True
        except Conversation.DoesNotExist:
            pass
        return False


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Only allow authenticated users
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
            
        user_id = getattr(self.user, "user_id", None)
        self.group_name = f"user_{user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify_event(self, event):
        await self.send_json(event.get("payload", {}))


