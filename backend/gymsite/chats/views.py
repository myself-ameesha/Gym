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
        user = request.user
        if user.user_type == "member":
            rooms = ChatRoom.objects.filter(member=user)
            community_rooms = CommunityChatRoom.objects.filter(members=user)
        elif user.user_type == "trainer":
            rooms = ChatRoom.objects.filter(trainer=user)
            community_rooms = CommunityChatRoom.objects.filter(trainer=user)
        else:
            return Response(
                {"error": "Invalid user role"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = ChatRoomSerializer(rooms, many=True, context={"request": request})
        community_serializer = CommunityChatRoomSerializer(
            community_rooms, many=True, context={"request": request}
        )
        return Response(
            {
                "chat_rooms": serializer.data,
                "community_chat_rooms": community_serializer.data,
            }
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


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id, room_type="chat"):
        user = request.user
        if room_type == "chat":
            try:
                room = ChatRoom.objects.get(id=room_id)
                if user not in [room.member, room.trainer]:
                    return Response(
                        {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
                    )
                messages = Message.objects.filter(chat_room=room).order_by("timestamp")
            except ChatRoom.DoesNotExist:
                return Response(
                    {"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            try:
                room = CommunityChatRoom.objects.get(id=room_id)
                room_users = [room.trainer] + list(room.members.all())
                if user not in room_users:
                    return Response(
                        {"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN
                    )
                messages = Message.objects.filter(community_chat_room=room).order_by(
                    "timestamp"
                )
            except CommunityChatRoom.DoesNotExist:
                return Response(
                    {"error": "Community chat room not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


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
            members = User.objects.filter(id__in=member_ids, user_type="member")
            community_room = CommunityChatRoom.objects.create(trainer=user, name=name)
            community_room.members.set(members)
            serializer = CommunityChatRoomSerializer(
                community_room, context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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