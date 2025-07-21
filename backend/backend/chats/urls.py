from django.urls import path
from .views import ChatRoomListView, NotificationViewSet, MessageListView, CommunityChatRoomView

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='chat-room-list'),
    path('rooms/<int:room_id>/messages/', MessageListView.as_view(), name='message-list'),
    path('community/<int:room_id>/messages/', MessageListView.as_view(), {'room_type': 'community'}, name='community-message-list'),
    path('community/', CommunityChatRoomView.as_view(), name='community-chat-create'),
    path('community/<int:room_id>/', CommunityChatRoomView.as_view(), name='community-chat-update'),
    path('notifications/', NotificationViewSet.as_view(), name='notification-list'),



]