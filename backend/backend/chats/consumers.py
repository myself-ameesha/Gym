from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from chats.models import ChatRoom, CommunityChatRoom, Message, Notification, Reaction
import json
import base64
from django.core.files.base import ContentFile
import logging
import uuid

User = get_user_model()
logger = logging.getLogger('chat')

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_type = self.scope['query_string'].decode('utf-8').split('room_type=')[1] if 'room_type=' in self.scope['query_string'].decode('utf-8') else 'chat'
        self.room_group_name = f"{self.room_type}_{self.room_id}"

        # Extract token
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        logger.info(f"WebSocket connect attempt: room_id={self.room_id}, room_type={self.room_type}, token={token[:10]}...")

        # Authenticate user
        user = None
        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                self.scope['user'] = user
                logger.info(f"Authenticated user: {user.email}")
            except (InvalidToken, TokenError, User.DoesNotExist) as e:
                logger.error(f"Authentication failed: {str(e)}")
                await self.close()
                return
        else:
            logger.error("No token provided")
            await self.close()
            return

        if not user.is_authenticated:
            logger.error("Closing WebSocket: User not authenticated")
            await self.close()
            return

        # Validate room access
        if self.room_type == 'chat':
            try:
                room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
                get_room_users = await database_sync_to_async(lambda: [room.member, room.trainer])()
                if user not in get_room_users:
                    logger.error("Closing WebSocket: User not authorized for this chat room")
                    await self.close()
                    return
            except ChatRoom.DoesNotExist:
                logger.error("Closing WebSocket: Chat room does not exist")
                await self.close()
                return
        else:
            try:
                room = await database_sync_to_async(CommunityChatRoom.objects.get)(id=self.room_id)
                get_room_users = await database_sync_to_async(lambda: [room.trainer] + list(room.members.all()))()
                if user not in get_room_users:
                    logger.error("Closing WebSocket: User not authorized for this community chat room")
                    await self.close()
                    return
            except CommunityChatRoom.DoesNotExist:
                logger.error("Closing WebSocket: Community chat room does not exist")
                await self.close()
                return

        logger.info("WebSocket connection accepted")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected: {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # async def receive(self, text_data):
    #     logger.debug(f"Received message: {text_data}")
    #     text_data_json = json.loads(text_data)
    #     message_type = text_data_json.get('type')

    #     if message_type == 'chat_message':
    #         await self.handle_chat_message(text_data_json)
    #     elif message_type == 'reaction':
    #         await self.handle_reaction(text_data_json)


    async def receive(self, text_data):
        logger.debug(f"Received message: {text_data}")
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'chat_message':
                await self.handle_chat_message(text_data_json)
            elif message_type == 'reaction':
                await self.handle_reaction(text_data_json)
            else:
                logger.error(f"Unknown message type: {message_type}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Invalid message type'
                }))
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))


    async def handle_chat_message(self, data):
        message = data.get('message', '')
        file_data = data.get('file', None)
        file_name = data.get('file_name', None)
        file_type = data.get('file_type', None)
        logger.debug(f"Processing message: {message}, file_name: {file_name}, file_type: {file_type}")

        user = self.scope['user']
        file_obj = None

        if file_data and file_name and file_type:
            try:
                valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
                if file_type not in valid_image_types:
                    logger.error(f"Invalid file type: {file_type}")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Only image files (JPEG, PNG, GIF) are allowed.'
                    }))
                    return

                # Validate base64 format
                if not file_data.startswith('data:image/'):
                    logger.error("Invalid base64 data format")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Invalid image data format.'
                    }))
                    return

                format, file_str = file_data.split(';base64,')
                ext = file_type.split('/')[-1]
                logger.debug(f"File format: {format}, extension: {ext}")
                try:
                    decoded_data = base64.b64decode(file_str)
                except Exception as e:
                    logger.error(f"Base64 decode error: {str(e)}")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Failed to decode image data.'
                    }))
                    return

                file_content = ContentFile(
                    decoded_data,
                    name=f"{uuid.uuid4()}.{ext}"
                )
                
                if file_content.size > 5 * 1024 * 1024:
                    logger.error(f"File size exceeds 5MB limit: {file_content.size}")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'File size must not exceed 5MB.'
                    }))
                    return

                file_obj = file_content
                logger.debug(f"File processed: {file_content.name}, size: {file_content.size}")
            except Exception as e:
                logger.error(f"File upload error: {str(e)}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Failed to process image file: {str(e)}'
                }))
                return

        try:
            notification_recipients = await self.save_message_and_notify(user, message, file_obj, file_type)
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to save message.'
            }))
            return
        
        # if file_data and file_name:
        #     try:
        #         format, file_str = file_data.split(';base64,')
        #         ext = format.split('/')[-1]
        #         file_content = ContentFile(base64.b64decode(file_str), name=f"{file_name}.{ext}")
        #         file_obj = file_content
        #     except Exception as e:
        #         logger.error(f"File upload error: {str(e)}")
        #         return

        # Save the message and create notifications
        # notification_recipients = await self.save_message_and_notify(user, message, file_obj)

        # Broadcast the message
        file_url = notification_recipients['file_url'] if notification_recipients['file_url'] else None
        new_message = notification_recipients['new_message']
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': new_message.id,
                'message': message,
                'file_url': file_url,
                'file_type': file_type,
                'sender': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                },
                'timestamp': str(new_message.timestamp)
            }
        )

        # Broadcast notifications
        for recipient_id, notification in notification_recipients['notifications']:
            await self.channel_layer.group_send(
                f"notifications_{recipient_id}",
                {
                    'type': 'notification_message',
                    'message': message,
                    'user_id': user.id,
                    'room_id': self.room_id,
                    'notification': {
                        'id': notification.id,
                        'content': notification.content,
                        'notification_type': notification.notification_type,
                        'is_read': notification.is_read,
                        'user_id': recipient_id,
                        'related_room': {'id': notification.related_room.id} if notification.related_room else None,
                        'related_community_room': {'id': notification.related_community_room.id} if notification.related_community_room else None,
                        'timestamp': notification.created_at.isoformat(),
                    }
                }
            )
            logger.info(f"Broadcasted notification to group: notifications_{recipient_id}")

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'message': event['message'],
            'file_url': event['file_url'],
            'file_type': event['file_type'],
            'sender': event['sender'],
            'timestamp': event['timestamp']
        }))

    async def handle_reaction(self, data):
        message_id = data.get('message_id')
        reaction = data.get('reaction')
        user = self.scope['user']

        try:
            message = await database_sync_to_async(Message.objects.get)(id=message_id)
            await database_sync_to_async(Reaction.objects.get_or_create)(
                message=message,
                user=user,
                reaction=reaction
            )
            reactions = await database_sync_to_async(lambda: list(message.reactions.all()))()
            reaction_data = [
                {'id': r.id, 'user': {'id': r.user.id, 'first_name': r.user.first_name}, 'reaction': r.reaction, 'created_at': str(r.created_at)}
                for r in reactions
            ]

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_update',
                    'message_id': message_id,
                    'reactions': reaction_data
                }
            )
        except Message.DoesNotExist:
            logger.error(f"Message {message_id} does not exist")
            return

    async def reaction_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'reaction_update',
            'message_id': event['message_id'],
            'reactions': event['reactions']
        }))

    @database_sync_to_async
    def save_message_and_notify(self, user, message, file_obj, file_type):
        if self.room_type == 'chat':
            room = ChatRoom.objects.get(id=self.room_id)
            new_message = Message.objects.create(
                chat_room=room,
                sender=user,
                content=message,
                file=file_obj,
                file_type=file_type
            )
            recipient = room.member if user == room.trainer else room.trainer
            notification = Notification.objects.create(
                user=recipient,
                receiver=user,
                content=f"New message from {user.first_name} in chat",
                notification_type='chat',
                related_room=room
            )
            logger.info(f"Created notification {notification.id} for {recipient.email}")
            return {
                'new_message': new_message,
                'file_url': new_message.file.url if new_message.file else None,
                'notifications': [(recipient.id, notification)]
            }
        else:
            room = CommunityChatRoom.objects.get(id=self.room_id)
            new_message = Message.objects.create(
                community_chat_room=room,
                sender=user,
                content=message,
                file=file_obj,
                file_type=file_type
            )
            members = list(room.members.all())
            notifications = []
            for member in members:
                if member != user:
                    notification = Notification.objects.create(
                        user=member,
                        receiver=user,
                        content=f"New message from {user.first_name} in {room.name}",
                        notification_type='chat',
                        related_community_room=room
                    )
                    logger.info(f"Created notification {notification.id} for {member.email}")
                    notifications.append((member.id, notification))
            return {
                'new_message': new_message,
                'file_url': new_message.file.url if new_message.file else None,
                'notifications': notifications
            }

        
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'

        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        logger.info(f"Notification WebSocket connect attempt: user_id={self.user_id}, token={token[:10]}...")

        # Authenticate user
        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                if str(user_id) != self.user_id:
                    logger.error(f"User ID mismatch: token={user_id}, url={self.user_id}")
                    await self.close()
                    return
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                self.scope['user'] = user
                logger.info(f"Authenticated user: {user.email}, user_id={user_id}")
            except (InvalidToken, TokenError, User.DoesNotExist) as e:
                logger.error(f"Authentication failed: {str(e)}")
                await self.close()
                return
        else:
            logger.error("No token provided")
            await self.close()
            return

        if not user.is_authenticated:
            logger.error("Closing WebSocket: User not authenticated")
            await self.close()
            return

        logger.info(f"Joining group: {self.room_group_name}")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.info(f"WebSocket accepted for user_id={self.user_id}")

    async def disconnect(self, close_code):
        logger.info(f"Notification WebSocket disconnected: close_code={close_code}, group={self.room_group_name}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def notification_message(self, event):
        logger.info(f"Sending notification to client: {event['notification']}")
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'payload': event['notification']
        }))


