# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from .models import ChatRoom, CommunityChatRoom, Message
# from .serializers import (
#     ChatRoomSerializer,
#     CommunityChatRoomSerializer,
#     MessageSerializer,
# )
# from django.contrib.auth import get_user_model
# from rest_framework.permissions import IsAuthenticated
# from .models import Notification
# from .serializers import NotificationSerializer

# User = get_user_model()


# class ChatRoomListView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         user = request.user
#         if user.user_type == "member":
#             rooms = ChatRoom.objects.filter(member=user)
#             community_rooms = CommunityChatRoom.objects.filter(members=user)
#         elif user.user_type == "trainer":
#             rooms = ChatRoom.objects.filter(trainer=user)
#             community_rooms = CommunityChatRoom.objects.filter(trainer=user)
#         else:
#             return Response(
#                 {"error": "Invalid user role"}, status=status.HTTP_403_FORBIDDEN
#             )

#         serializer = ChatRoomSerializer(rooms, many=True, context={"request": request})
#         community_serializer = CommunityChatRoomSerializer(
#             community_rooms, many=True, context={"request": request}
#         )
#         return Response(
#             {
#                 "chat_rooms": serializer.data,
#                 "community_chat_rooms": community_serializer.data,
#             }
#         )

#     def post(self, request):
#         user = request.user
#         trainer_id = request.data.get("trainer_id")

#         try:
#             trainer = User.objects.get(id=trainer_id, user_type="trainer")
#             if user.user_type == "member":

#                 room, created = ChatRoom.objects.get_or_create(
#                     member=user, trainer=trainer
#                 )
#             elif user.user_type == "trainer" and user.id == trainer_id:

#                 member_id = request.data.get("member_id")
#                 if not member_id:
#                     return Response(
#                         {"error": "Member ID is required for trainers"},
#                         status=status.HTTP_400_BAD_REQUEST,
#                     )
#                 try:
#                     member = User.objects.get(id=member_id, user_type="member")

#                     if (
#                         not member.assigned_trainer
#                         or member.assigned_trainer.id != user.id
#                     ):
#                         return Response(
#                             {"error": "Member is not assigned to this trainer"},
#                             status=status.HTTP_403_FORBIDDEN,
#                         )
#                     room, created = ChatRoom.objects.get_or_create(
#                         member=member, trainer=user
#                     )
#                 except User.DoesNotExist:
#                     return Response(
#                         {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
#                     )
#             else:
#                 return Response(
#                     {"error": "Invalid user role or trainer ID"},
#                     status=status.HTTP_403_FORBIDDEN,
#                 )

#             serializer = ChatRoomSerializer(room, context={"request": request})
#             return Response(
#                 serializer.data,
#                 status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
#             )
#         except User.DoesNotExist:
#             return Response(
#                 {"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND
#             )


# class MessageListView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, room_id, room_type="chat"):
#         user = request.user
#         if room_type == "chat":
#             try:
#                 room = ChatRoom.objects.get(id=room_id)
#                 if user not in [room.member, room.trainer]:
#                     return Response(
#                         {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
#                     )
#                 messages = Message.objects.filter(chat_room=room).order_by("timestamp")
#             except ChatRoom.DoesNotExist:
#                 return Response(
#                     {"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND
#                 )
#         else:
#             try:
#                 room = CommunityChatRoom.objects.get(id=room_id)
#                 room_users = [room.trainer] + list(room.members.all())
#                 if user not in room_users:
#                     return Response(
#                         {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
#                     )
#                 messages = Message.objects.filter(community_chat_room=room).order_by(
#                     "timestamp"
#                 )
#             except CommunityChatRoom.DoesNotExist:
#                 return Response(
#                     {"error": "Community chat room not found"},
#                     status=status.HTTP_404_NOT_FOUND,
#                 )

#         serializer = MessageSerializer(messages, many=True)
#         return Response(serializer.data)


# class CommunityChatRoomView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         user = request.user
#         if user.user_type != "trainer":
#             return Response(
#                 {"error": "Only trainers can create community chat rooms"},
#                 status=status.HTTP_403_FORBIDDEN,
#             )

#         name = request.data.get("name", f"{user.first_name}'s Community Chat")
#         member_ids = request.data.get("member_ids", [])

#         try:
#             members = User.objects.filter(id__in=member_ids, user_type="member")
#             community_room = CommunityChatRoom.objects.create(trainer=user, name=name)
#             community_room.members.set(members)
#             serializer = CommunityChatRoomSerializer(
#                 community_room, context={"request": request}
#             )
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     def patch(self, request, room_id):
#         user = request.user
#         if user.user_type != "trainer":
#             return Response(
#                 {"error": "Only trainers can modify community chat rooms"},
#                 status=status.HTTP_403_FORBIDDEN,
#             )

#         try:
#             room = CommunityChatRoom.objects.get(id=room_id, trainer=user)
#         except CommunityChatRoom.DoesNotExist:
#             return Response(
#                 {"error": "Community chat room not found"},
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         action = request.data.get("action")
#         member_id = request.data.get("member_id")

#         if not member_id or not action:
#             return Response(
#                 {"error": "Action and member_id are required"},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         try:
#             member = User.objects.get(id=member_id, user_type="member")
#         except User.DoesNotExist:
#             return Response(
#                 {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
#             )

#         if action == "add":
#             room.members.add(member)
#         elif action == "remove":
#             room.members.remove(member)
#         else:
#             return Response(
#                 {"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST
#             )

#         serializer = CommunityChatRoomSerializer(room, context={"request": request})
#         return Response(serializer.data, status=status.HTTP_200_OK)


# class NotificationViewSet(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         notifications = Notification.objects.filter(user=request.user).order_by(
#             "-created_at"
#         )
#         serializer = NotificationSerializer(notifications, many=True)
#         return Response(serializer.data)

#     def post(self, request):
#         notification_ids = request.data.get("notification_ids", [])
#         if not notification_ids:
#             return Response(
#                 {"error": "No notification IDs provided"},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )
#         notifications = Notification.objects.filter(
#             id__in=notification_ids, user=request.user
#         )
#         updated = notifications.update(is_read=True)
#         return Response(
#             {"message": f"{updated} notifications marked as read"},
#             status=status.HTTP_200_OK,
#         )


# views.py - FIXED VERSION



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ChatRoom, CommunityChatRoom, Message
from .serializers import (
    ChatRoomSerializer,
    CommunityChatRoomSerializer,
    MessageSerializer,
)
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
import logging
import cloudinary
import cloudinary.uploader

User = get_user_model()
logger = logging.getLogger(__name__)



class CloudinaryUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload file directly to Cloudinary from backend"""
        try:
            if 'file' not in request.FILES:
                return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            file = request.FILES['file']
            
            # Validate file size (10MB limit)
            max_size = 10 * 1024 * 1024  # 10MB
            if file.size > max_size:
                return Response(
                    {'error': f'File size too large. Maximum size is {max_size/(1024*1024)}MB'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to Cloudinary
            try:
                upload_result = cloudinary.uploader.upload(
                    file,
                    folder="chat_files",
                    resource_type="auto",
                    use_filename=True,
                    unique_filename=True,
                )
                
                logger.info(f"File uploaded to Cloudinary: {upload_result['public_id']}")
                
                return Response({
                    'url': upload_result['secure_url'],
                    'public_id': upload_result['public_id'],
                    'resource_type': upload_result.get('resource_type', 'raw'),
                    'format': upload_result.get('format', ''),
                    'bytes': upload_result.get('bytes', file.size),
                    'original_filename': file.name
                })
                
            except Exception as cloudinary_error:
                logger.error(f"Cloudinary upload error: {str(cloudinary_error)}")
                return Response(
                    {'error': f'Failed to upload to Cloudinary: {str(cloudinary_error)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            return Response(
                {'error': f'File upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatRoomListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            logger.info(f"Getting chat rooms for user {user.id} ({user.user_type})")
            
            if user.user_type == "member":
                rooms = ChatRoom.objects.filter(member=user).select_related('member', 'trainer')
                community_rooms = CommunityChatRoom.objects.filter(members=user).select_related('trainer').prefetch_related('members')
            elif user.user_type == "trainer":
                rooms = ChatRoom.objects.filter(trainer=user).select_related('member', 'trainer')
                community_rooms = CommunityChatRoom.objects.filter(trainer=user).select_related('trainer').prefetch_related('members')
            else:
                return Response(
                    {"error": "Invalid user role"}, status=status.HTTP_403_FORBIDDEN
                )

            try:
                serializer = ChatRoomSerializer(rooms, many=True, context={"request": request})
                community_serializer = CommunityChatRoomSerializer(
                    community_rooms, many=True, context={"request": request}
                )
                
                logger.info(f"Successfully serialized {len(rooms)} rooms and {len(community_rooms)} community rooms")
                
                return Response(
                    {
                        "chat_rooms": serializer.data,
                        "community_chat_rooms": community_serializer.data,
                    }
                )
            except Exception as serialization_error:
                logger.error(f"Serialization error: {str(serialization_error)}")
                return Response(
                    {"error": "Error processing chat rooms"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error in ChatRoomListView.get: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        user = request.user
        trainer_id = request.data.get("trainer_id")

        try:
            trainer = User.objects.get(id=trainer_id, user_type="trainer")
            if user.user_type == "member":
                room, created = ChatRoom.objects.get_or_create(
                    member=user, trainer=trainer
                )
            elif user.user_type == "trainer" and user.id == trainer_id:
                member_id = request.data.get("member_id")
                if not member_id:
                    return Response(
                        {"error": "Member ID is required for trainers"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    member = User.objects.get(id=member_id, user_type="member")
                    if (
                        not member.assigned_trainer
                        or member.assigned_trainer.id != user.id
                    ):
                        return Response(
                            {"error": "Member is not assigned to this trainer"},
                            status=status.HTTP_403_FORBIDDEN,
                        )
                    room, created = ChatRoom.objects.get_or_create(
                        member=member, trainer=user
                    )
                except User.DoesNotExist:
                    return Response(
                        {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"error": "Invalid user role or trainer ID"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = ChatRoomSerializer(room, context={"request": request})
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating chat room: {str(e)}")
            return Response(
                {"error": "Failed to create chat room"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# class MessageListView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, room_id, room_type="chat"):
#         user = request.user
#         if room_type == "chat":
#             try:
#                 room = ChatRoom.objects.get(id=room_id)
#                 if user not in [room.member, room.trainer]:
#                     return Response(
#                         {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
#                     )
#                 messages = Message.objects.filter(chat_room=room).order_by("timestamp")
#             except ChatRoom.DoesNotExist:
#                 return Response(
#                     {"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND
#                 )
#         else:
#             try:
#                 room = CommunityChatRoom.objects.get(id=room_id)
#                 room_users = [room.trainer] + list(room.members.all())
#                 if user not in room_users:
#                     return Response(
#                         {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
#                     )
#                 messages = Message.objects.filter(community_chat_room=room).order_by(
#                     "timestamp"
#                 )
#             except CommunityChatRoom.DoesNotExist:
#                 return Response(
#                     {"error": "Community chat room not found"},
#                     status=status.HTTP_404_NOT_FOUND,
#                 )

#         serializer = MessageSerializer(messages, many=True)
#         return Response(serializer.data)


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id, room_type="chat"):
        user = request.user
        
        logger.info(f"MessageListView: room_id={room_id}, room_type={room_type}, user={user.id}")
        
        try:
            # Convert room_id to integer safely
            try:
                room_id = int(room_id)
            except (ValueError, TypeError):
                logger.error(f"Invalid room ID format: {room_id}")
                return Response(
                    {"error": "Invalid room ID"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if room_type == "chat":
                try:
                    # Use select_related to optimize queries
                    room = ChatRoom.objects.select_related('member', 'trainer').get(id=room_id)
                    logger.info(f"Found chat room: {room.id}, member: {room.member.id}, trainer: {room.trainer.id}")
                    
                    # Check user authorization
                    if user not in [room.member, room.trainer]:
                        logger.error(f"User {user.id} not authorized for chat room {room_id}")
                        return Response(
                            {"error": "Unauthorized"}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # FIXED: Optimize message query and handle potential database errors
                    try:
                        messages = Message.objects.filter(
                            chat_room=room
                        ).select_related('sender').order_by("timestamp")
                        
                        logger.info(f"Found {messages.count()} messages in chat room {room_id}")
                        
                    except Exception as query_error:
                        logger.error(f"Database query error for messages: {str(query_error)}")
                        return Response(
                            {"error": "Database error while fetching messages"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                except ChatRoom.DoesNotExist:
                    logger.error(f"Chat room {room_id} not found")
                    return Response(
                        {"error": "Chat room not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                except Exception as e:
                    logger.error(f"Error fetching chat room {room_id}: {str(e)}")
                    return Response(
                        {"error": "Internal server error while fetching chat room"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
            elif room_type == "community":
                try:
                    room = CommunityChatRoom.objects.select_related('trainer').prefetch_related('members').get(id=room_id)
                    logger.info(f"Found community room: {room.id}, trainer: {room.trainer.id}")
                    
                    # Get all authorized users (trainer + members)
                    room_users = [room.trainer] + list(room.members.all())
                    logger.info(f"Community room users: {[u.id for u in room_users]}")
                    
                    # Check user authorization
                    if user not in room_users:
                        logger.error(f"User {user.id} not authorized for community room {room_id}")
                        return Response(
                            {"error": "Unauthorized"}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    # FIXED: Optimize message query
                    try:
                        messages = Message.objects.filter(
                            community_chat_room=room
                        ).select_related('sender').order_by("timestamp")
                        
                        logger.info(f"Found {messages.count()} messages in community room {room_id}")
                        
                    except Exception as query_error:
                        logger.error(f"Database query error for community messages: {str(query_error)}")
                        return Response(
                            {"error": "Database error while fetching messages"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                except CommunityChatRoom.DoesNotExist:
                    logger.error(f"Community chat room {room_id} not found")
                    return Response(
                        {"error": "Community chat room not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                except Exception as e:
                    logger.error(f"Error fetching community room {room_id}: {str(e)}")
                    return Response(
                        {"error": "Internal server error while fetching community room"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                logger.error(f"Invalid room type: {room_type}")
                return Response(
                    {"error": "Invalid room type. Must be 'chat' or 'community'"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # FIXED: Safe message serialization with error handling
            try:
                # Create a custom serializer context for better error handling
                serializer_context = {'request': request, 'room_type': room_type}
                serializer = MessageSerializer(messages, many=True, context=serializer_context)
                
                # Test serialization in chunks to identify problematic messages
                try:
                    serialized_data = []
                    for message in messages:
                        try:
                            message_serializer = MessageSerializer(message, context=serializer_context)
                            message_data = message_serializer.data
                            serialized_data.append(message_data)
                            
                            # Log file information for debugging
                            if message_data.get('file_url'):
                                logger.debug(f"Message {message_data['id']} has file: {message_data.get('file_name')} ({message_data.get('file_type')})")
                        except Exception as single_msg_error:
                            logger.error(f"Error serializing message {message.id}: {str(single_msg_error)}")
                            # Create a safe fallback message
                            fallback_message = {
                                'id': message.id,
                                'sender': {
                                    'id': message.sender.id if message.sender else None,
                                    'first_name': message.sender.first_name if message.sender else 'Unknown',
                                    'last_name': message.sender.last_name if message.sender else 'User',
                                    'email': message.sender.email if message.sender else 'unknown@example.com',
                                },
                                'content': getattr(message, 'content', 'Error loading message'),
                                'file_url': getattr(message, 'file_url', None),
                                'file_type': getattr(message, 'file_type', None),
                                'file_name': getattr(message, 'file_name', None),
                                'file_size': getattr(message, 'file_size', None),
                                'timestamp': str(getattr(message, 'timestamp', '')),
                                'reactions': [],
                                room_type == 'chat' and 'chat_room' or 'community_chat_room': {'id': room_id}
                            }
                            serialized_data.append(fallback_message)
                    
                    logger.info(f"Successfully serialized {len(serialized_data)} messages for room {room_id}")
                    return Response(serialized_data)
                    
                except Exception as chunk_error:
                    logger.error(f"Error in chunk serialization: {str(chunk_error)}")
                    # Fall back to simple serialization
                    serializer_data = serializer.data
                    return Response(serializer_data)
                
            except Exception as serialization_error:
                logger.error(f"Critical serialization error for room {room_id}: {str(serialization_error)}")
                logger.error(f"Serialization error type: {type(serialization_error).__name__}")
                
                # Return empty messages list as fallback
                return Response([])
                
        except Exception as e:
            logger.error(f"Critical error in MessageListView for room {room_id}: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CommunityChatRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.user_type != "trainer":
            return Response(
                {"error": "Only trainers can create community chat rooms"},
                status=status.HTTP_403_FORBIDDEN,
            )

        name = request.data.get("name", f"{user.first_name}'s Community Chat")
        member_ids = request.data.get("member_ids", [])

        try:
            with transaction.atomic():
                members = User.objects.filter(id__in=member_ids, user_type="member")
                community_room = CommunityChatRoom.objects.create(trainer=user, name=name)
                community_room.members.set(members)
                serializer = CommunityChatRoomSerializer(
                    community_room, context={"request": request}
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating community chat: {str(e)}")
            return Response({"error": "Failed to create community chat"}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, room_id):
        user = request.user
        if user.user_type != "trainer":
            return Response(
                {"error": "Only trainers can modify community chat rooms"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            room = CommunityChatRoom.objects.get(id=room_id, trainer=user)
        except CommunityChatRoom.DoesNotExist:
            return Response(
                {"error": "Community chat room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get("action")
        member_id = request.data.get("member_id")

        if not member_id or not action:
            return Response(
                {"error": "Action and member_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            member = User.objects.get(id=member_id, user_type="member")
        except User.DoesNotExist:
            return Response(
                {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            if action == "add":
                room.members.add(member)
            elif action == "remove":
                room.members.remove(member)
            else:
                return Response(
                    {"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST
                )

            serializer = CommunityChatRoomSerializer(room, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error modifying community chat: {str(e)}")
            return Response(
                {"error": "Failed to modify community chat"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NotificationViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all notifications for the current user"""
        try:
            notifications = Notification.objects.filter(user=request.user).order_by(
                "-created_at"
            )
            serializer = NotificationSerializer(notifications, many=True)
            logger.info(f"Retrieved {len(notifications)} notifications for user {request.user.id}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            return Response(
                {"error": "Failed to fetch notifications"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Mark multiple notifications as read - FIXED endpoint"""
        notification_ids = request.data.get("notification_ids", [])
        
        if not notification_ids:
            return Response(
                {"error": "No notification IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not isinstance(notification_ids, list):
            return Response(
                {"error": "notification_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            notifications = Notification.objects.filter(
                id__in=notification_ids, user=request.user
            )
            
            if not notifications.exists():
                return Response(
                    {"error": "No valid notifications found for the provided IDs"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            
            updated = notifications.update(is_read=True)
            logger.info(f"Marked {updated} notifications as read for user {request.user.id}")
            
            return Response(
                {"message": f"{updated} notifications marked as read"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(f"Error marking notifications as read: {str(e)}")
            return Response(
                {"error": "Failed to mark notifications as read"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        """Delete multiple notifications"""
        notification_ids = request.data.get("notification_ids", [])
        
        if not notification_ids:
            return Response(
                {"error": "No notification IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            notifications = Notification.objects.filter(
                id__in=notification_ids, user=request.user
            )
            
            deleted_count = notifications.count()
            notifications.delete()
            
            logger.info(f"Deleted {deleted_count} notifications for user {request.user.id}")
            
            return Response(
                {"message": f"{deleted_count} notifications deleted"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(f"Error deleting notifications: {str(e)}")
            return Response(
                {"error": "Failed to delete notifications"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# FIXED: Add the missing mark-read endpoint
class MarkNotificationsAsReadView(APIView):
    """Separate endpoint specifically for marking notifications as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark multiple notifications as read"""
        notification_ids = request.data.get("notification_ids", [])
        
        if not notification_ids:
            return Response(
                {"error": "No notification IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if not isinstance(notification_ids, list):
            return Response(
                {"error": "notification_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Only allow users to mark their own notifications as read
            notifications = Notification.objects.filter(
                id__in=notification_ids, 
                user=request.user,
                is_read=False  # Only update unread notifications
            )
            
            if not notifications.exists():
                return Response(
                    {"message": "No unread notifications found to mark as read"},
                    status=status.HTTP_200_OK,
                )
            
            updated = notifications.update(is_read=True)
            logger.info(f"Marked {updated} notifications as read for user {request.user.id}")
            
            return Response(
                {
                    "message": f"{updated} notifications marked as read",
                    "updated_count": updated
                },
                status=status.HTTP_200_OK,
            )
            
        except Exception as e:
            logger.error(f"Error marking notifications as read: {str(e)}")
            return Response(
                {"error": "Failed to mark notifications as read"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )