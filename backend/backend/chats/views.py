from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ChatRoom, CommunityChatRoom, Message
from .serializers import ChatRoomSerializer, CommunityChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()

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
            return Response({"error": "Invalid user role"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        community_serializer = CommunityChatRoomSerializer(community_rooms, many=True, context={'request': request})
        return Response({
            "chat_rooms": serializer.data,
            "community_chat_rooms": community_serializer.data
        })

    def post(self, request):
            user = request.user
            trainer_id = request.data.get('trainer_id')
            
            try:
                trainer = User.objects.get(id=trainer_id, user_type="trainer")
                if user.user_type == "member":
                    # Members can create chat rooms with any trainer
                    room, created = ChatRoom.objects.get_or_create(member=user, trainer=trainer)
                elif user.user_type == "trainer" and user.id == trainer_id:
                    # Trainers can create chat rooms where they are the trainer
                    member_id = request.data.get('member_id')
                    if not member_id:
                        return Response({"error": "Member ID is required for trainers"}, status=status.HTTP_400_BAD_REQUEST)
                    try:
                        member = User.objects.get(id=member_id, user_type="member")
                        # Optionally, verify the member is assigned to the trainer
                        if not member.assigned_trainer or member.assigned_trainer.id != user.id:
                            return Response({"error": "Member is not assigned to this trainer"}, status=status.HTTP_403_FORBIDDEN)
                        room, created = ChatRoom.objects.get_or_create(member=member, trainer=user)
                    except User.DoesNotExist:
                        return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response({"error": "Invalid user role or trainer ID"}, status=status.HTTP_403_FORBIDDEN)
                
                serializer = ChatRoomSerializer(room, context={'request': request})
                return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "Trainer not found"}, status=status.HTTP_404_NOT_FOUND)
            


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id, room_type='chat'):
        user = request.user
        if room_type == 'chat':
            try:
                room = ChatRoom.objects.get(id=room_id)
                if user not in [room.member, room.trainer]:
                    return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                messages = Message.objects.filter(chat_room=room).order_by('timestamp')
            except ChatRoom.DoesNotExist:
                return Response({"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                room = CommunityChatRoom.objects.get(id=room_id)
                room_users = [room.trainer] + list(room.members.all())
                if user not in room_users:
                    return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                messages = Message.objects.filter(community_chat_room=room).order_by('timestamp')
            except CommunityChatRoom.DoesNotExist:
                return Response({"error": "Community chat room not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class CommunityChatRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.user_type != "trainer":
            return Response({"error": "Only trainers can create community chat rooms"}, status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get('name', f"{user.first_name}'s Community Chat")
        member_ids = request.data.get('member_ids', [])

        try:
            members = User.objects.filter(id__in=member_ids, user_type="member")
            community_room = CommunityChatRoom.objects.create(trainer=user, name=name)
            community_room.members.set(members)
            serializer = CommunityChatRoomSerializer(community_room, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, room_id):
        user = request.user
        if user.user_type != "trainer":
            return Response({"error": "Only trainers can modify community chat rooms"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            room = CommunityChatRoom.objects.get(id=room_id, trainer=user)
        except CommunityChatRoom.DoesNotExist:
            return Response({"error": "Community chat room not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        member_id = request.data.get('member_id')

        if not member_id or not action:
            return Response({"error": "Action and member_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = User.objects.get(id=member_id, user_type="member")
        except User.DoesNotExist:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == 'add':
            room.members.add(member)
        elif action == 'remove':
            room.members.remove(member)
        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CommunityChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    


class NotificationViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        notification_ids = request.data.get('notification_ids', [])
        if not notification_ids:
            return Response({"error": "No notification IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        notifications = Notification.objects.filter(id__in=notification_ids, user=request.user)
        updated = notifications.update(is_read=True)
        return Response({"message": f"{updated} notifications marked as read"}, status=status.HTTP_200_OK)