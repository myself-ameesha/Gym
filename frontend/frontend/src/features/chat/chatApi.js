import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { addNotification } from '../notification/notificationSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

let socket = null;
let notificationSocket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 5000;

export const connectWebSocket = (roomId, token, roomType = 'chat', onMessage, onError) => {
  socket = new WebSocket(`${WS_URL}/ws/${roomType}/${roomId}/?token=${encodeURIComponent(token)}&room_type=${roomType}`);

  socket.onopen = () => {
    console.log(`Chat WebSocket connected for ${roomType} room: ${roomId}`);
    reconnectAttempts = 0;
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'chat_message') {
      onMessage({
        id: data.message_id,
        content: data.message,
        file_url: data.file_url,
        sender: data.sender,
        timestamp: data.timestamp,
        [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: { id: roomId },
      });
    } else if (data.type === 'reaction_update') {
      onMessage({
        id: data.message_id,
        reactions: data.reactions,
      });
    }
  };

  socket.onerror = (error) => {
    console.error('Chat WebSocket error:', error);
    onError?.('Failed to connect to chat server');
  };

  socket.onclose = () => {
    console.log('Chat WebSocket closed');
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Reconnecting WebSocket... Attempt ${reconnectAttempts + 1}`);
        reconnectAttempts++;
        connectWebSocket(roomId, token, roomType, onMessage, onError);
      }, reconnectInterval);
    } else {
      onError?.('Max reconnect attempts reached');
    }
  };

  return socket;
};

export const connectNotificationWebSocket = (userId, token, dispatch, onNotification) => {
  notificationSocket = new WebSocket(`${WS_URL}/ws/notifications/${userId}/?token=${encodeURIComponent(token)}`);

  notificationSocket.onopen = () => {
    console.log('Notification WebSocket connected');
    reconnectAttempts = 0;
  };

  notificationSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received notification:', data);
    if (data.type === 'notification') {
      const { id, content, notification_type, is_read, user_id, related_room, related_community_room, timestamp } = data.payload;
      const notification = {
        id,
        content,
        notification_type,
        is_read,
        user: { id: user_id },
        related_room,
        related_community_room,
        created_at: timestamp,
      };
      dispatch(addNotification(notification));
      onNotification?.(notification);
    }
  };

  notificationSocket.onerror = (error) => {
    console.error('Notification WebSocket error:', error);
  };

  notificationSocket.onclose = () => {
    console.log('Notification WebSocket closed');
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Reconnecting Notification WebSocket... Attempt ${reconnectAttempts + 1}`);
        reconnectAttempts++;
        connectNotificationWebSocket(userId, token, dispatch, onNotification);
      }, reconnectInterval);
    }
  };

  return notificationSocket;
};

export const sendMessage = (message, file = null, fileName = null) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const messageData = {
      type: 'chat_message',
      message,
    };
    if (file && fileName) {
      messageData.file = file;
      messageData.file_name = fileName;
    }
    console.log('Sending message:', messageData);
    socket.send(JSON.stringify(messageData));
  } else {
    console.error('WebSocket is not open');
  }
};

export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
  if (notificationSocket) {
    notificationSocket.close();
    notificationSocket = null;
  }
};

export const getNotifications = createAsyncThunk(
  'auth/getNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const response = await axios.get(`${API_URL}/api/chats/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
    }
  }
);

export const getChatRooms = createAsyncThunk(
  'chat/getChatRooms',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const response = await axios.get(`${API_URL}/api/chats/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch chat rooms');
    }
  }
);

export const createChatRoom = createAsyncThunk(
    'chat/createChatRoom',
    async (memberId, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.accessToken || localStorage.getItem('accessToken');
            if (!token) throw new Error('No access token');
            const user = getState().auth.currentTrainer || getState().auth.currentMember;
            const isTrainer = user.user_type === 'trainer';
            const response = await axios.post(
                `${API_URL}/api/chats/rooms/`,
                isTrainer ? { trainer_id: user.id, member_id: memberId } : { trainer_id: memberId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create chat room');
        }
    }
);


export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async ({ roomId, roomType }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const url = roomType === 'community'
        ? `${API_URL}/api/chats/community/${roomId}/messages/`
        : `${API_URL}/api/chats/rooms/${roomId}/messages/`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { roomId, roomType, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const createCommunityChat = createAsyncThunk(
  'chat/createCommunityChat',
  async ({ trainerId, memberIds, roomName }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const response = await axios.post(
        `${API_URL}/api/chats/community/`,
        {
          trainer_id: trainerId,
          member_ids: memberIds,
          name: roomName || `Community Chat - ${trainerId}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create community chat');
    }
  }
);



