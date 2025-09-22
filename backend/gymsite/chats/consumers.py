# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from rest_framework_simplejwt.tokens import AccessToken
# from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
# from django.contrib.auth import get_user_model
# from gymsite.chats.models import ChatRoom, CommunityChatRoom, Message, Notification, Reaction
# import json
# import base64
# from django.core.files.base import ContentFile
# import logging
# import uuid

# User = get_user_model()
# logger = logging.getLogger('chat')

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_id = self.scope['url_route']['kwargs']['room_id']
#         self.room_type = self.scope['query_string'].decode('utf-8').split('room_type=')[1] if 'room_type=' in self.scope['query_string'].decode('utf-8') else 'chat'
#         self.room_group_name = f"{self.room_type}_{self.room_id}"

#         # Extract token
#         query_string = self.scope.get('query_string', b'').decode('utf-8')
#         token = None
#         for param in query_string.split('&'):
#             if param.startswith('token='):
#                 token = param.split('=')[1]
#                 break

#         logger.info(f"WebSocket connect attempt: room_id={self.room_id}, room_type={self.room_type}, token={token[:10]}...")

#         # Authenticate user
#         user = None
#         if token:
#             try:
#                 access_token = AccessToken(token)
#                 user_id = access_token['user_id']
#                 user = await database_sync_to_async(User.objects.get)(id=user_id)
#                 self.scope['user'] = user
#                 logger.info(f"Authenticated user: {user.email}")
#             except (InvalidToken, TokenError, User.DoesNotExist) as e:
#                 logger.error(f"Authentication failed: {str(e)}")
#                 await self.close()
#                 return
#         else:
#             logger.error("No token provided")
#             await self.close()
#             return

#         if not user.is_authenticated:
#             logger.error("Closing WebSocket: User not authenticated")
#             await self.close()
#             return

#         # Validate room access
#         if self.room_type == 'chat':
#             try:
#                 room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
#                 get_room_users = await database_sync_to_async(lambda: [room.member, room.trainer])()
#                 if user not in get_room_users:
#                     logger.error("Closing WebSocket: User not authorized for this chat room")
#                     await self.close()
#                     return
#             except ChatRoom.DoesNotExist:
#                 logger.error("Closing WebSocket: Chat room does not exist")
#                 await self.close()
#                 return
#         else:
#             try:
#                 room = await database_sync_to_async(CommunityChatRoom.objects.get)(id=self.room_id)
#                 get_room_users = await database_sync_to_async(lambda: [room.trainer] + list(room.members.all()))()
#                 if user not in get_room_users:
#                     logger.error("Closing WebSocket: User not authorized for this community chat room")
#                     await self.close()
#                     return
#             except CommunityChatRoom.DoesNotExist:
#                 logger.error("Closing WebSocket: Community chat room does not exist")
#                 await self.close()
#                 return

#         logger.info("WebSocket connection accepted")
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         logger.info(f"WebSocket disconnected: {close_code}")
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     # async def receive(self, text_data):
#     #     logger.debug(f"Received message: {text_data}")
#     #     text_data_json = json.loads(text_data)
#     #     message_type = text_data_json.get('type')

#     #     if message_type == 'chat_message':
#     #         await self.handle_chat_message(text_data_json)
#     #     elif message_type == 'reaction':
#     #         await self.handle_reaction(text_data_json)


#     async def receive(self, text_data):
#         logger.debug(f"Received message: {text_data}")
#         try:
#             text_data_json = json.loads(text_data)
#             message_type = text_data_json.get('type')

#             if message_type == 'chat_message':
#                 await self.handle_chat_message(text_data_json)
#             elif message_type == 'reaction':
#                 await self.handle_reaction(text_data_json)
#             else:
#                 logger.error(f"Unknown message type: {message_type}")
#                 await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': 'Invalid message type'
#                 }))
#         except json.JSONDecodeError as e:
#             logger.error(f"JSON decode error: {str(e)}")
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': 'Invalid message format'
#             }))


#     async def handle_chat_message(self, data):
#         message = data.get('message', '')
#         file_data = data.get('file', None)
#         file_name = data.get('file_name', None)
#         file_type = data.get('file_type', None)
#         logger.debug(f"Processing message: {message}, file_name: {file_name}, file_type: {file_type}")

#         user = self.scope['user']
#         file_obj = None

#         if file_data and file_name and file_type:
#             try:
#                 valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
#                 if file_type not in valid_image_types:
#                     logger.error(f"Invalid file type: {file_type}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Only image files (JPEG, PNG, GIF) are allowed.'
#                     }))
#                     return

#                 # Validate base64 format
#                 if not file_data.startswith('data:image/'):
#                     logger.error("Invalid base64 data format")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Invalid image data format.'
#                     }))
#                     return

#                 format, file_str = file_data.split(';base64,')
#                 ext = file_type.split('/')[-1]
#                 logger.debug(f"File format: {format}, extension: {ext}")
#                 try:
#                     decoded_data = base64.b64decode(file_str)
#                 except Exception as e:
#                     logger.error(f"Base64 decode error: {str(e)}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Failed to decode image data.'
#                     }))
#                     return

#                 file_content = ContentFile(
#                     decoded_data,
#                     name=f"{uuid.uuid4()}.{ext}"
#                 )
                
#                 if file_content.size > 5 * 1024 * 1024:
#                     logger.error(f"File size exceeds 5MB limit: {file_content.size}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'File size must not exceed 5MB.'
#                     }))
#                     return

#                 file_obj = file_content
#                 logger.debug(f"File processed: {file_content.name}, size: {file_content.size}")
#             except Exception as e:
#                 logger.error(f"File upload error: {str(e)}")
#                 await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': f'Failed to process image file: {str(e)}'
#                 }))
#                 return

#         try:
#             notification_recipients = await self.save_message_and_notify(user, message, file_obj, file_type)
#         except Exception as e:
#             logger.error(f"Error saving message: {str(e)}")
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': 'Failed to save message.'
#             }))
#             return
        
#         # if file_data and file_name:
#         #     try:
#         #         format, file_str = file_data.split(';base64,')
#         #         ext = format.split('/')[-1]
#         #         file_content = ContentFile(base64.b64decode(file_str), name=f"{file_name}.{ext}")
#         #         file_obj = file_content
#         #     except Exception as e:
#         #         logger.error(f"File upload error: {str(e)}")
#         #         return

#         # Save the message and create notifications
#         # notification_recipients = await self.save_message_and_notify(user, message, file_obj)

#         # Broadcast the message
#         file_url = notification_recipients['file_url'] if notification_recipients['file_url'] else None
#         new_message = notification_recipients['new_message']
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message_id': new_message.id,
#                 'message': message,
#                 'file_url': file_url,
#                 'file_type': file_type,
#                 'sender': {
#                     'id': user.id,
#                     'email': user.email,
#                     'first_name': user.first_name,
#                 },
#                 'timestamp': str(new_message.timestamp)
#             }
#         )

#         # Broadcast notifications
#         for recipient_id, notification in notification_recipients['notifications']:
#             await self.channel_layer.group_send(
#                 f"notifications_{recipient_id}",
#                 {
#                     'type': 'notification_message',
#                     'message': message,
#                     'user_id': user.id,
#                     'room_id': self.room_id,
#                     'notification': {
#                         'id': notification.id,
#                         'content': notification.content,
#                         'notification_type': notification.notification_type,
#                         'is_read': notification.is_read,
#                         'user_id': recipient_id,
#                         'related_room': {'id': notification.related_room.id} if notification.related_room else None,
#                         'related_community_room': {'id': notification.related_community_room.id} if notification.related_community_room else None,
#                         'timestamp': notification.created_at.isoformat(),
#                     }
#                 }
#             )
#             logger.info(f"Broadcasted notification to group: notifications_{recipient_id}")

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             'type': 'chat_message',
#             'message_id': event['message_id'],
#             'message': event['message'],
#             'file_url': event['file_url'],
#             'file_type': event['file_type'],
#             'sender': event['sender'],
#             'timestamp': event['timestamp']
#         }))

#     async def handle_reaction(self, data):
#         message_id = data.get('message_id')
#         reaction = data.get('reaction')
#         user = self.scope['user']

#         try:
#             message = await database_sync_to_async(Message.objects.get)(id=message_id)
#             await database_sync_to_async(Reaction.objects.get_or_create)(
#                 message=message,
#                 user=user,
#                 reaction=reaction
#             )
#             reactions = await database_sync_to_async(lambda: list(message.reactions.all()))()
#             reaction_data = [
#                 {'id': r.id, 'user': {'id': r.user.id, 'first_name': r.user.first_name}, 'reaction': r.reaction, 'created_at': str(r.created_at)}
#                 for r in reactions
#             ]

#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'reaction_update',
#                     'message_id': message_id,
#                     'reactions': reaction_data
#                 }
#             )
#         except Message.DoesNotExist:
#             logger.error(f"Message {message_id} does not exist")
#             return

#     async def reaction_update(self, event):
#         await self.send(text_data=json.dumps({
#             'type': 'reaction_update',
#             'message_id': event['message_id'],
#             'reactions': event['reactions']
#         }))

#     @database_sync_to_async
#     def save_message_and_notify(self, user, message, file_obj, file_type):
#         if self.room_type == 'chat':
#             room = ChatRoom.objects.get(id=self.room_id)
#             new_message = Message.objects.create(
#                 chat_room=room,
#                 sender=user,
#                 content=message,
#                 file=file_obj,
#                 file_type=file_type
#             )
#             recipient = room.member if user == room.trainer else room.trainer
#             notification = Notification.objects.create(
#                 user=recipient,
#                 receiver=user,
#                 content=f"New message from {user.first_name} in chat",
#                 notification_type='chat',
#                 related_room=room
#             )
#             logger.info(f"Created notification {notification.id} for {recipient.email}")
#             return {
#                 'new_message': new_message,
#                 'file_url': new_message.file.url if new_message.file else None,
#                 'notifications': [(recipient.id, notification)]
#             }
#         else:
#             room = CommunityChatRoom.objects.get(id=self.room_id)
#             new_message = Message.objects.create(
#                 community_chat_room=room,
#                 sender=user,
#                 content=message,
#                 file=file_obj,
#                 file_type=file_type
#             )
#             members = list(room.members.all())
#             notifications = []
#             for member in members:
#                 if member != user:
#                     notification = Notification.objects.create(
#                         user=member,
#                         receiver=user,
#                         content=f"New message from {user.first_name} in {room.name}",
#                         notification_type='chat',
#                         related_community_room=room
#                     )
#                     logger.info(f"Created notification {notification.id} for {member.email}")
#                     notifications.append((member.id, notification))
#             return {
#                 'new_message': new_message,
#                 'file_url': new_message.file.url if new_message.file else None,
#                 'notifications': notifications
#             }

        
# class NotificationConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user_id = self.scope['url_route']['kwargs']['user_id']
#         self.room_group_name = f'notifications_{self.user_id}'

#         query_string = self.scope.get('query_string', b'').decode('utf-8')
#         token = None
#         for param in query_string.split('&'):
#             if param.startswith('token='):
#                 token = param.split('=')[1]
#                 break

#         logger.info(f"Notification WebSocket connect attempt: user_id={self.user_id}, token={token[:10]}...")

#         # Authenticate user
#         if token:
#             try:
#                 access_token = AccessToken(token)
#                 user_id = access_token['user_id']
#                 if str(user_id) != self.user_id:
#                     logger.error(f"User ID mismatch: token={user_id}, url={self.user_id}")
#                     await self.close()
#                     return
#                 user = await database_sync_to_async(User.objects.get)(id=user_id)
#                 self.scope['user'] = user
#                 logger.info(f"Authenticated user: {user.email}, user_id={user_id}")
#             except (InvalidToken, TokenError, User.DoesNotExist) as e:
#                 logger.error(f"Authentication failed: {str(e)}")
#                 await self.close()
#                 return
#         else:
#             logger.error("No token provided")
#             await self.close()
#             return

#         if not user.is_authenticated:
#             logger.error("Closing WebSocket: User not authenticated")
#             await self.close()
#             return

#         logger.info(f"Joining group: {self.room_group_name}")
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()
#         logger.info(f"WebSocket accepted for user_id={self.user_id}")

#     async def disconnect(self, close_code):
#         logger.info(f"Notification WebSocket disconnected: close_code={close_code}, group={self.room_group_name}")
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def notification_message(self, event):
#         logger.info(f"Sending notification to client: {event['notification']}")
#         await self.send(text_data=json.dumps({
#             'type': 'notification',
#             'payload': event['notification']
#         }))


# consumers.py - FIXED VERSION


from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from gymsite.chats.models import ChatRoom, CommunityChatRoom, Message, Notification, Reaction
from .serializers import NotificationSerializer
import json
import base64
from django.core.files.base import ContentFile
import logging
import uuid
import magic  
import os

User = get_user_model()
logger = logging.getLogger('chat')

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_id = self.scope['url_route']['kwargs']['room_id']
#         self.room_type = self.scope['query_string'].decode('utf-8').split('room_type=')[1] if 'room_type=' in self.scope['query_string'].decode('utf-8') else 'chat'
#         self.room_group_name = f"{self.room_type}_{self.room_id}"

#         # Extract token
#         query_string = self.scope.get('query_string', b'').decode('utf-8')
#         token = None
#         for param in query_string.split('&'):
#             if param.startswith('token='):
#                 token = param.split('=')[1]
#                 break

#         logger.info(f"WebSocket connect attempt: room_id={self.room_id}, room_type={self.room_type}, token={token[:10]}...")

#         # Authenticate user
#         user = None
#         if token:
#             try:
#                 access_token = AccessToken(token)
#                 user_id = access_token['user_id']
#                 user = await database_sync_to_async(User.objects.get)(id=user_id)
#                 self.scope['user'] = user
#                 logger.info(f"Authenticated user: {user.email}")
#             except (InvalidToken, TokenError, User.DoesNotExist) as e:
#                 logger.error(f"Authentication failed: {str(e)}")
#                 await self.close()
#                 return
#         else:
#             logger.error("No token provided")
#             await self.close()
#             return

#         if not user.is_authenticated:
#             logger.error("Closing WebSocket: User not authenticated")
#             await self.close()
#             return

#         # Validate room access
#         if self.room_type == 'chat':
#             try:
#                 room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
#                 get_room_users = await database_sync_to_async(lambda: [room.member, room.trainer])()
#                 if user not in get_room_users:
#                     logger.error("Closing WebSocket: User not authorized for this chat room")
#                     await self.close()
#                     return
#             except ChatRoom.DoesNotExist:
#                 logger.error("Closing WebSocket: Chat room does not exist")
#                 await self.close()
#                 return
#         else:
#             try:
#                 room = await database_sync_to_async(CommunityChatRoom.objects.get)(id=self.room_id)
#                 get_room_users = await database_sync_to_async(lambda: [room.trainer] + list(room.members.all()))()
#                 if user not in get_room_users:
#                     logger.error("Closing WebSocket: User not authorized for this community chat room")
#                     await self.close()
#                     return
#             except CommunityChatRoom.DoesNotExist:
#                 logger.error("Closing WebSocket: Community chat room does not exist")
#                 await self.close()
#                 return

#         logger.info("WebSocket connection accepted")
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         logger.info(f"WebSocket disconnected: {close_code}")
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         logger.debug(f"Received message: {text_data}")
#         try:
#             text_data_json = json.loads(text_data)
#             message_type = text_data_json.get('type')

#             if message_type == 'chat_message':
#                 await self.handle_chat_message(text_data_json)
#             elif message_type == 'reaction':
#                 await self.handle_reaction(text_data_json)
#             elif message_type == 'ping':
#                 # Handle ping for heartbeat
#                 await self.send(text_data=json.dumps({
#                     'type': 'pong',
#                     'timestamp': text_data_json.get('timestamp')
#                 }))
#             else:
#                 logger.error(f"Unknown message type: {message_type}")
#                 await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': 'Invalid message type'
#                 }))
#         except json.JSONDecodeError as e:
#             logger.error(f"JSON decode error: {str(e)}")
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': 'Invalid message format'
#             }))

#     async def handle_chat_message(self, data):
#         message = data.get('message', '')
#         file_data = data.get('file', None)
#         file_name = data.get('file_name', None)
#         file_type = data.get('file_type', None)
        
#         user = self.scope['user']
#         file_obj = None

#         if file_data and file_name and file_type:
#             try:
#                 valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
#                 if file_type not in valid_image_types:
#                     logger.error(f"Invalid file type: {file_type}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Only image files (JPEG, PNG, GIF) are allowed.'
#                     }))
#                     return

#                 if not file_data.startswith('data:image/'):
#                     logger.error("Invalid base64 data format")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Invalid image data format.'
#                     }))
#                     return

#                 format, file_str = file_data.split(';base64,')
#                 ext = file_type.split('/')[-1]
                
#                 try:
#                     decoded_data = base64.b64decode(file_str)
#                 except Exception as e:
#                     logger.error(f"Base64 decode error: {str(e)}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'Failed to decode image data.'
#                     }))
#                     return

#                 file_content = ContentFile(
#                     decoded_data,
#                     name=f"{uuid.uuid4()}.{ext}"
#                 )
                
#                 if file_content.size > 5 * 1024 * 1024:
#                     logger.error(f"File size exceeds 5MB limit: {file_content.size}")
#                     await self.send(text_data=json.dumps({
#                         'type': 'error',
#                         'message': 'File size must not exceed 5MB.'
#                     }))
#                     return

#                 file_obj = file_content
                
#             except Exception as e:
#                 logger.error(f"File upload error: {str(e)}")
#                 await self.send(text_data=json.dumps({
#                     'type': 'error',
#                     'message': f'Failed to process image file: {str(e)}'
#                 }))
#                 return

#         try:
#             notification_data = await self.save_message_and_notify(user, message, file_obj, file_type)
#         except Exception as e:
#             logger.error(f"Error saving message: {str(e)}")
#             await self.send(text_data=json.dumps({
#                 'type': 'error',
#                 'message': 'Failed to save message.'
#             }))
#             return

#         # Broadcast the message to chat room
#         new_message = notification_data['new_message']
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message_id': new_message.id,
#                 'message': message,
#                 'file_url': notification_data.get('file_url'),
#                 'file_type': file_type,
#                 'sender': {
#                     'id': user.id,
#                     'email': user.email,
#                     'first_name': user.first_name,
#                 },
#                 'timestamp': str(new_message.timestamp)
#             }
#         )

#         # FIXED: Broadcast notifications to each recipient's notification channel
#         for recipient_id, notification in notification_data['notifications']:
#             notification_group = f"notifications_{recipient_id}"
#             logger.info(f"Broadcasting notification to group: {notification_group}")
            
#             await self.channel_layer.group_send(
#                 notification_group,
#                 {
#                     'type': 'send_notification',  # Changed to match NotificationConsumer method
#                     'notification': {
#                         'id': notification.id,
#                         'content': notification.content,
#                         'notification_type': notification.notification_type,
#                         'is_read': notification.is_read,
#                         'created_at': notification.created_at.isoformat(),
#                         'user': {'id': recipient_id},
#                         'receiver': {'id': user.id, 'first_name': user.first_name},
#                         'related_room': {'id': notification.related_room.id} if notification.related_room else None,
#                         'related_community_room': {'id': notification.related_community_room.id} if notification.related_community_room else None,
#                     }
#                 }
#             )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             'type': 'message',
#             'message': {
#                 'id': event['message_id'],
#                 'content': event['message'],
#                 'file_url': event['file_url'],
#                 'file_type': event['file_type'],
#                 'sender': event['sender'],
#                 'timestamp': event['timestamp']
#             }
#         }))

#     async def handle_reaction(self, data):
#         message_id = data.get('message_id')
#         reaction = data.get('reaction')
#         user = self.scope['user']

#         try:
#             message = await database_sync_to_async(Message.objects.get)(id=message_id)
#             await database_sync_to_async(Reaction.objects.get_or_create)(
#                 message=message,
#                 user=user,
#                 reaction=reaction
#             )
#             reactions = await database_sync_to_async(lambda: list(message.reactions.all()))()
#             reaction_data = [
#                 {'id': r.id, 'user': {'id': r.user.id, 'first_name': r.user.first_name}, 'reaction': r.reaction, 'created_at': str(r.created_at)}
#                 for r in reactions
#             ]

#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'reaction_update',
#                     'message_id': message_id,
#                     'reactions': reaction_data
#                 }
#             )
#         except Message.DoesNotExist:
#             logger.error(f"Message {message_id} does not exist")
#             return

#     async def reaction_update(self, event):
#         await self.send(text_data=json.dumps({
#             'type': 'reaction_update',
#             'message_id': event['message_id'],
#             'reactions': event['reactions']
#         }))

#     @database_sync_to_async
#     def save_message_and_notify(self, user, message, file_obj, file_type):
#         if self.room_type == 'chat':
#             room = ChatRoom.objects.get(id=self.room_id)
#             new_message = Message.objects.create(
#                 chat_room=room,
#                 sender=user,
#                 content=message,
#                 file=file_obj,
#                 file_type=file_type
#             )
#             recipient = room.member if user == room.trainer else room.trainer
#             notification = Notification.objects.create(
#                 user=recipient,
#                 receiver=user,
#                 content=f"New message from {user.first_name} in chat",
#                 notification_type='chat',
#                 related_room=room
#             )
#             logger.info(f"Created notification {notification.id} for {recipient.email}")
#             return {
#                 'new_message': new_message,
#                 'file_url': new_message.file.url if new_message.file else None,
#                 'notifications': [(recipient.id, notification)]
#             }
#         else:
#             room = CommunityChatRoom.objects.get(id=self.room_id)
#             new_message = Message.objects.create(
#                 community_chat_room=room,
#                 sender=user,
#                 content=message,
#                 file=file_obj,
#                 file_type=file_type
#             )
#             members = [room.trainer] + list(room.members.all())
#             notifications = []
#             for member in members:
#                 if member != user:
#                     notification = Notification.objects.create(
#                         user=member,
#                         receiver=user,
#                         content=f"New message from {user.first_name} in {room.name}",
#                         notification_type='chat',
#                         related_community_room=room
#                     )
#                     logger.info(f"Created notification {notification.id} for {member.email}")
#                     notifications.append((member.id, notification))
#             return {
#                 'new_message': new_message,
#                 'file_url': new_message.file.url if new_message.file else None,
#                 'notifications': notifications
#             }

import cloudinary
import cloudinary.uploader
from django.conf import settings


cloud_name = settings.CLOUDINARY_STORAGE['CLOUD_NAME']
api_key = settings.CLOUDINARY_STORAGE['API_KEY']
api_secret = settings.CLOUDINARY_STORAGE['API_SECRET']


class ChatConsumer(AsyncWebsocketConsumer):
    # File size limits (in bytes)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB for general files
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB for images
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB for videos

    # Allowed file types - comprehensive list
    ALLOWED_MIME_TYPES = {
        # Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
        'image/bmp', 'image/tiff', 'image/svg+xml', 'image/ico',
        
        # Documents
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'text/rtf',
        
        # Archives
        'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
        'application/x-7z-compressed', 'application/gzip', 'application/x-tar',
        
        # Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 
        'audio/flac', 'audio/x-ms-wma',
        
        # Video
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        'video/x-ms-wmv', 'video/webm', 'video/x-flv',
        
        # Other
        'application/json', 'application/xml', 'text/xml', 'text/html',
        'application/javascript', 'text/css',
    }

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

        logger.info(f"WebSocket connect attempt: room_id={self.room_id}, room_type={self.room_type}")

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
                await self.close(code=4001)
                return
        else:
            logger.error("No token provided")
            await self.close(code=4001)
            return

        if not user.is_authenticated:
            logger.error("Closing WebSocket: User not authenticated")
            await self.close(code=4001)
            return

        # Validate room access
        if self.room_type == 'chat':
            try:
                room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)
                get_room_users = await database_sync_to_async(lambda: [room.member, room.trainer])()
                if user not in get_room_users:
                    logger.error("Closing WebSocket: User not authorized for this chat room")
                    await self.close(code=4003)
                    return
            except ChatRoom.DoesNotExist:
                logger.error("Closing WebSocket: Chat room does not exist")
                await self.close(code=4004)
                return
        else:
            try:
                room = await database_sync_to_async(CommunityChatRoom.objects.get)(id=self.room_id)
                get_room_users = await database_sync_to_async(lambda: [room.trainer] + list(room.members.all()))()
                if user not in get_room_users:
                    logger.error("Closing WebSocket: User not authorized for this community chat room")
                    await self.close(code=4003)
                    return
            except CommunityChatRoom.DoesNotExist:
                logger.error("Closing WebSocket: Community chat room does not exist")
                await self.close(code=4004)
                return

        logger.info("WebSocket connection accepted")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected: {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    def validate_file_type(self, file_data):
        """Validate file type using magic number detection"""
        try:
            # Use magic to detect actual file type
            detected_mime = magic.from_buffer(file_data, mime=True)
            return detected_mime if detected_mime in self.ALLOWED_MIME_TYPES else None
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            return None

    def get_file_size_limit(self, mime_type):
        """Get appropriate file size limit based on file type"""
        if mime_type.startswith('image/'):
            return self.MAX_IMAGE_SIZE
        elif mime_type.startswith('video/'):
            return self.MAX_VIDEO_SIZE
        else:
            return self.MAX_FILE_SIZE

    @database_sync_to_async
    def upload_to_cloudinary(self, file_data, file_name, file_type):
        """Upload file to Cloudinary and return the URL"""
        try:
            # Create a temporary file-like object
            file_obj = ContentFile(file_data, name=file_name)
            
            # Determine resource type for Cloudinary
            if file_type.startswith('image/'):
                resource_type = 'image'
            elif file_type.startswith('video/'):
                resource_type = 'video'
            elif file_type.startswith('audio/'):
                resource_type = 'video'  # Cloudinary treats audio as video
            else:
                resource_type = 'raw'
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file_obj,
                folder="chat_files",
                resource_type=resource_type,
                public_id=f"chat_{uuid.uuid4()}",
                use_filename=True,
                unique_filename=True
            )
            
            return {
                'url': upload_result['secure_url'],
                'public_id': upload_result['public_id'],
                'resource_type': upload_result['resource_type'],
                'format': upload_result.get('format'),
                'bytes': upload_result.get('bytes', len(file_data))
            }
            
        except Exception as e:
            logger.error(f"Cloudinary upload error: {str(e)}")
            raise e

    async def receive(self, text_data):
        logger.debug(f"Received message: {text_data[:200]}...")
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'chat_message':
                await self.handle_chat_message(text_data_json)
            elif message_type == 'reaction':
                await self.handle_reaction(text_data_json)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
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
        file_data_info = data.get('file_data', None)
        user = self.scope['user']
        
        # Validate that we have either message or file
        if not message.strip() and not file_data_info:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Please provide either a message or attach a file.'
            }))
            return

        cloudinary_url = None
        file_type = None
        file_name = None
        file_size = None

        # Handle Cloudinary file info if present
        if file_data_info:
            try:
                cloudinary_url = file_data_info.get('url')
                file_type = file_data_info.get('type')
                file_name = file_data_info.get('name')
                file_size = file_data_info.get('size')
                
                if not cloudinary_url:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'File upload failed. Please try again.'
                    }))
                    return
                
                logger.info(f"Cloudinary file received: {file_name} ({file_type}, {file_size} bytes)")

            except Exception as e:
                logger.error(f"Error processing Cloudinary file data: {str(e)}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Failed to process file: {str(e)}'
                }))
                return

        try:
            notification_data = await self.save_message_and_notify(
                user, message, cloudinary_url, file_type, file_name, file_size
            )
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to save message.'
            }))
            return

        # FIXED: Broadcast the message to chat room with ALL file fields
        new_message = notification_data['new_message']
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': new_message.id,
                'message': message,
                'file_url': cloudinary_url,  # IMPORTANT: Include file URL
                'file_type': file_type,       # IMPORTANT: Include file type
                'file_name': file_name,       # IMPORTANT: Include file name
                'file_size': file_size,       # IMPORTANT: Include file size
                'sender': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                },
                'timestamp': str(new_message.timestamp)
            }
        )

        # Broadcast notifications (unchanged)
        for recipient_id, notification in notification_data['notifications']:
            notification_group = f"notifications_{recipient_id}"
            await self.channel_layer.group_send(
                notification_group,
                {
                    'type': 'send_notification',
                    'notification': {
                        'id': notification.id,
                        'content': notification.content,
                        'notification_type': notification.notification_type,
                        'is_read': notification.is_read,
                        'created_at': notification.created_at.isoformat(),
                        'user': {'id': recipient_id},
                        'receiver': {'id': user.id, 'first_name': user.first_name},
                        'related_room': {'id': notification.related_room.id} if notification.related_room else None,
                        'related_community_room': {'id': notification.related_community_room.id} if notification.related_community_room else None,
                    }
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'message': event['message'],
            'file_url': event.get('file_url'),
            'file_type': event.get('file_type'),
            'file_name': event.get('file_name'),
            'file_size': event.get('file_size'),
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
                {'id': r.id, 'user': {'id': r.user.id, 'first_name': r.user.first_name}, 
                 'reaction': r.reaction, 'created_at': str(r.created_at)}
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
    def save_message_and_notify(self, user, message, file_url, file_type, file_name, file_size):
        if self.room_type == 'chat':
            room = ChatRoom.objects.get(id=self.room_id)
            new_message = Message.objects.create(
                chat_room=room,
                sender=user,
                content=message,
                file_url=file_url,  # Store Cloudinary URL directly
                file_type=file_type,
                file_name=file_name,
                file_size=file_size
            )
            recipient = room.member if user == room.trainer else room.trainer
            
            # Create more descriptive notification content
            if file_url and message:
                content = f"{user.first_name} sent a message with attachment in chat"
            elif file_url:
                content = f"{user.first_name} sent a file in chat"
            else:
                content = f"{user.first_name} sent a message in chat"
                
            notification = Notification.objects.create(
                user=recipient,
                receiver=user,
                content=content,
                notification_type='chat',
                related_room=room
            )
            
            return {
                'new_message': new_message,
                'notifications': [(recipient.id, notification)]
            }
        else:
            room = CommunityChatRoom.objects.get(id=self.room_id)
            new_message = Message.objects.create(
                community_chat_room=room,
                sender=user,
                content=message,
                file_url=file_url,  # Store Cloudinary URL directly
                file_type=file_type,
                file_name=file_name,
                file_size=file_size
            )
            
            members = [room.trainer] + list(room.members.all())
            notifications = []
            
            # Create more descriptive notification content
            if file_url and message:
                content = f"{user.first_name} sent a message with attachment in {room.name}"
            elif file_url:
                content = f"{user.first_name} sent a file in {room.name}"
            else:
                content = f"{user.first_name} sent a message in {room.name}"
                
            for member in members:
                if member != user:
                    notification = Notification.objects.create(
                        user=member,
                        receiver=user,
                        content=content,
                        notification_type='chat',
                        related_community_room=room
                    )
                    notifications.append((member.id, notification))
                    
            return {
                'new_message': new_message,
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

        logger.info(f"Notification WebSocket connect attempt: user_id={self.user_id}, token={token[:10] if token else 'None'}...")

        # Authenticate user
        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                if str(user_id) != self.user_id:
                    logger.error(f"User ID mismatch: token={user_id}, url={self.user_id}")
                    await self.close(code=4004)
                    return
                user = await database_sync_to_async(User.objects.get)(id=user_id)
                self.scope['user'] = user
                logger.info(f"Authenticated user: {user.email}, user_id={user_id}")
            except (InvalidToken, TokenError, User.DoesNotExist) as e:
                logger.error(f"Authentication failed: {str(e)}")
                await self.close(code=4001)
                return
        else:
            logger.error("No token provided")
            await self.close(code=4001)
            return

        if not user.is_authenticated:
            logger.error("Closing WebSocket: User not authenticated")
            await self.close(code=4001)
            return

        logger.info(f"Joining group: {self.room_group_name}")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        # Send confirmation message
        await self.send(text_data=json.dumps({
            'type': 'auth_success',
            'message': 'Notification WebSocket connected successfully'
        }))
        
        logger.info(f"WebSocket accepted for user_id={self.user_id}")

    async def disconnect(self, close_code):
        logger.info(f"Notification WebSocket disconnected: close_code={close_code}, group={self.room_group_name}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming messages for heartbeat"""
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in NotificationConsumer")

    # FIXED: This method name must match the 'type' sent from ChatConsumer
    async def send_notification(self, event):
        """Send notification to the client"""
        notification = event['notification']
        logger.info(f"Sending notification to client: {notification['content']}")
        
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'payload': notification
        }))

