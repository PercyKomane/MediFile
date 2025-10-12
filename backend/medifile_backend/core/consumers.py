from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"].get("conversation_id")
        self.group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Support typing indicator messages
        msg_type = content.get("type")
        if msg_type == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.typing",
                    "payload": {"type": "typing", "typing": True},
                },
            )

    async def chat_message(self, event):
        await self.send_json(event.get("payload", {}))

    async def chat_typing(self, event):
        await self.send_json(event.get("payload", {}))


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        user_id = getattr(user, "id", None)
        self.group_name = f"user_{user_id}" if user_id else "user_anon"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify_event(self, event):
        await self.send_json(event.get("payload", {}))


