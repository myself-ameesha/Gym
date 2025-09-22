// import { createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';
// import { addNotification } from '../notification/notificationSlice';

// // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// // const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
// const WS_URL = import.meta.env.VITE_WS_URL;
// const API_URL = `${import.meta.env.VITE_API_URL}`;

// let socket = null;
// let notificationSocket = null;
// let reconnectAttempts = 0;
// const maxReconnectAttempts = 5;
// const reconnectInterval = 5000;

// export const connectWebSocket = (roomId, token, roomType = 'chat', onMessage, onError) => {
//   socket = new WebSocket(`${WS_URL}/ws/${roomType}/${roomId}/?token=${encodeURIComponent(token)}&room_type=${roomType}`);

//   socket.onopen = () => {
//     console.log(`Chat WebSocket connected for ${roomType} room: ${roomId}`);
//     reconnectAttempts = 0;
//   };

//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     if (data.type === 'chat_message') {
//       onMessage({
//         id: data.message_id,
//         content: data.message,
//         file_url: data.file_url,
//         sender: data.sender,
//         timestamp: data.timestamp,
//         [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: { id: roomId },
//       });
//     } else if (data.type === 'reaction_update') {
//       onMessage({
//         id: data.message_id,
//         reactions: data.reactions,
//       });
//     }
//   };

//   socket.onerror = (error) => {
//     console.error('Chat WebSocket error:', error);
//     onError?.('Failed to connect to chat server');
//   };

//   socket.onclose = () => {
//     console.log('Chat WebSocket closed');
//     if (reconnectAttempts < maxReconnectAttempts) {
//       setTimeout(() => {
//         console.log(`Reconnecting WebSocket... Attempt ${reconnectAttempts + 1}`);
//         reconnectAttempts++;
//         connectWebSocket(roomId, token, roomType, onMessage, onError);
//       }, reconnectInterval);
//     } else {
//       onError?.('Max reconnect attempts reached');
//     }
//   };

//   return socket;
// };

// export const connectNotificationWebSocket = (userId, token, dispatch, onNotification) => {
//   notificationSocket = new WebSocket(`${WS_URL}/ws/notifications/${userId}/?token=${encodeURIComponent(token)}`);

//   notificationSocket.onopen = () => {
//     console.log('Notification WebSocket connected');
//     reconnectAttempts = 0;
//   };

//   notificationSocket.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     console.log('Received notification:', data);
//     if (data.type === 'notification') {
//       const { id, content, notification_type, is_read, user_id, related_room, related_community_room, timestamp } = data.payload;
//       const notification = {
//         id,
//         content,
//         notification_type,
//         is_read,
//         user: { id: user_id },
//         related_room,
//         related_community_room,
//         created_at: timestamp,
//       };
//       dispatch(addNotification(notification));
//       onNotification?.(notification);
//     }
//   };

//   notificationSocket.onerror = (error) => {
//     console.error('Notification WebSocket error:', error);
//   };

//   notificationSocket.onclose = () => {
//     console.log('Notification WebSocket closed');
//     if (reconnectAttempts < maxReconnectAttempts) {
//       setTimeout(() => {
//         console.log(`Reconnecting Notification WebSocket... Attempt ${reconnectAttempts + 1}`);
//         reconnectAttempts++;
//         connectNotificationWebSocket(userId, token, dispatch, onNotification);
//       }, reconnectInterval);
//     }
//   };

//   return notificationSocket;
// };

// export const sendMessage = (message, file = null, fileName = null) => {
//   if (socket && socket.readyState === WebSocket.OPEN) {
//     const messageData = {
//       type: 'chat_message',
//       message,
//     };
//     if (file && fileName) {
//       messageData.file = file;
//       messageData.file_name = fileName;
//     }
//     console.log('Sending message:', messageData);
//     socket.send(JSON.stringify(messageData));
//   } else {
//     console.error('WebSocket is not open');
//   }
// };

// export const closeWebSocket = () => {
//   if (socket) {
//     socket.close();
//     socket = null;
//   }
//   if (notificationSocket) {
//     notificationSocket.close();
//     notificationSocket = null;
//   }
// };

// export const getNotifications = createAsyncThunk(
//   'auth/getNotifications',
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const response = await axios.get(`${API_URL}/api/chats/notifications/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
//     }
//   }
// );

// export const getChatRooms = createAsyncThunk(
//   'chat/getChatRooms',
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const response = await axios.get(`${API_URL}/api/chats/rooms/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to fetch chat rooms');
//     }
//   }
// );

// export const createChatRoom = createAsyncThunk(
//     'chat/createChatRoom',
//     async (memberId, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//             if (!token) throw new Error('No access token');
//             const user = getState().auth.currentTrainer || getState().auth.currentMember;
//             const isTrainer = user.user_type === 'trainer';
//             const response = await axios.post(
//                 `${API_URL}/api/chats/rooms/`,
//                 isTrainer ? { trainer_id: user.id, member_id: memberId } : { trainer_id: memberId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             return response.data;
//         } catch (error) {
//             return rejectWithValue(error.response?.data?.error || 'Failed to create chat room');
//         }
//     }
// );


// export const getMessages = createAsyncThunk(
//   'chat/getMessages',
//   async ({ roomId, roomType }, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const url = roomType === 'community'
//         ? `${API_URL}/api/chats/community/${roomId}/messages/`
//         : `${API_URL}/api/chats/rooms/${roomId}/messages/`;
//       const response = await axios.get(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return { roomId, roomType, messages: response.data };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
//     }
//   }
// );

// export const createCommunityChat = createAsyncThunk(
//   'chat/createCommunityChat',
//   async ({ trainerId, memberIds, roomName }, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const response = await axios.post(
//         `${API_URL}/api/chats/community/`,
//         {
//           trainer_id: trainerId,
//           member_ids: memberIds,
//           name: roomName || `Community Chat - ${trainerId}`,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to create community chat');
//     }
//   }
// );
// chatApi.js - FIXED VERSION


import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { addNotification } from '../notification/notificationSlice';

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

// Enhanced WebSocket connection manager with better error handling
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.reconnectTimeouts = new Map();
    this.heartbeatIntervals = new Map();
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.heartbeatInterval = 30000; // 30 seconds
    this.connectionTimeout = 10000; // 10 seconds
  }

  getConnectionKey(type, id, roomType = null) {
    return roomType ? `${type}-${roomType}-${id}` : `${type}-${id}`;
  }

  getReconnectDelay(attempts) {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, attempts),
      this.maxReconnectDelay
    );
    return delay + Math.random() * 1000;
  }

  validateConfig(config) {
    const { key, url, token } = config;
    
    if (!key) throw new Error('Connection key is required');
    if (!url) throw new Error('WebSocket URL is required');
    if (!token) throw new Error('Authentication token is required');
    if (!WS_URL) throw new Error('VITE_WS_URL environment variable not set');
    
    return true;
  }

  connect(config) {
    const { key, url, onOpen, onMessage, onError, onClose, token, userId } = config;
    
    try {
      this.validateConfig(config);
      this.disconnect(key);

      console.log(`🔗 Connecting WebSocket: ${key}`);
      console.log(`📍 URL: ${url}`);
      
      const ws = new WebSocket(url);
      
      const connection = {
        socket: ws,
        config: { ...config, userId },
        lastPing: Date.now(),
        isAlive: true,
        connectionTimeout: null,
        heartbeatInterval: null
      };

      connection.connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error(`❌ Connection timeout for ${key}`);
          ws.close(4001, 'Connection timeout');
        }
      }, this.connectionTimeout);

      ws.onopen = (event) => {
        if (connection.connectionTimeout) {
          clearTimeout(connection.connectionTimeout);
          connection.connectionTimeout = null;
        }
        
        console.log(`✅ WebSocket connected: ${key}`);
        this.reconnectAttempts.set(key, 0);
        connection.isAlive = true;
        
        const reconnectTimeout = this.reconnectTimeouts.get(key);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          this.reconnectTimeouts.delete(key);
        }
        
        this.startHeartbeat(key);
        
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        connection.lastPing = Date.now();
        connection.isAlive = true;
        
        try {
          const data = JSON.parse(event.data);
          console.log(`📨 Message received on ${key}:`, data.type || 'unknown');
          
          if (data.type === 'pong') {
            console.log(`🏓 Pong received from ${key}`);
            return;
          }
          
          if (onMessage) onMessage(data, event);
        } catch (error) {
          console.error(`❌ Error parsing message from ${key}:`, error);
          if (onError) onError(error);
        }
      };

      ws.onerror = (error) => {
        if (connection.connectionTimeout) {
          clearTimeout(connection.connectionTimeout);
          connection.connectionTimeout = null;
        }
        
        console.error(`❌ WebSocket error on ${key}:`, error);
        connection.isAlive = false;
        
        if (onError) onError(error);
      };

      ws.onclose = (event) => {
        if (connection.connectionTimeout) {
          clearTimeout(connection.connectionTimeout);
          connection.connectionTimeout = null;
        }
        
        console.log(`🔌 WebSocket closed: ${key} (Code: ${event.code}, Reason: ${event.reason})`);
        
        connection.isAlive = false;
        this.stopHeartbeat(key);
        
        let shouldReconnect = false;
        switch (event.code) {
          case 1000:
          case 1001:
            console.log(`ℹ️ Normal closure for ${key}`);
            break;
          case 4001:
            console.error(`🔐 Authentication error for ${key}`);
            break;
          case 4004:
            console.error(`👤 User not found error for ${key}`);
            break;
          default:
            shouldReconnect = true;
            break;
        }
        
        if (shouldReconnect) {
          this.handleReconnection(key);
        }
        
        if (onClose) onClose(event);
      };

      this.connections.set(key, connection);
      return ws;

    } catch (error) {
      console.error(`❌ Failed to create WebSocket ${key}:`, error);
      if (onError) onError(error);
      return null;
    }
  }

  handleReconnection(key) {
    const connection = this.connections.get(key);
    if (!connection) return;

    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.getReconnectDelay(attempts);
      console.log(`🔄 Scheduling reconnection for ${key} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      const reconnectTimeout = setTimeout(() => {
        console.log(`🔄 Attempting reconnection for ${key}`);
        this.reconnectAttempts.set(key, attempts + 1);
        this.reconnectTimeouts.delete(key);
        this.connect(connection.config);
      }, delay);
      
      this.reconnectTimeouts.set(key, reconnectTimeout);
    } else {
      console.error(`❌ Max reconnection attempts reached for ${key}`);
      this.connections.delete(key);
      this.reconnectAttempts.delete(key);
    }
  }

  startHeartbeat(key) {
    const connection = this.connections.get(key);
    if (!connection) return;

    this.stopHeartbeat(key);

    const heartbeatInterval = setInterval(() => {
      if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify({ 
            type: 'ping',
            timestamp: Date.now()
          }));
          console.log(`🏓 Ping sent to ${key}`);
          
          const timeSinceLastPing = Date.now() - connection.lastPing;
          if (timeSinceLastPing > this.heartbeatInterval * 2) {
            console.warn(`⚠️ No pong received from ${key} for ${timeSinceLastPing}ms`);
            connection.isAlive = false;
            connection.socket.close(1006, 'Heartbeat timeout');
          }
        } catch (error) {
          console.error(`❌ Failed to send ping to ${key}:`, error);
          connection.isAlive = false;
        }
      } else {
        console.warn(`⚠️ Cannot send ping to ${key}: connection not open`);
        this.stopHeartbeat(key);
      }
    }, this.heartbeatInterval);

    connection.heartbeatInterval = heartbeatInterval;
    this.heartbeatIntervals.set(key, heartbeatInterval);
  }

  stopHeartbeat(key) {
    const heartbeatInterval = this.heartbeatIntervals.get(key);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.heartbeatIntervals.delete(key);
    }
    
    const connection = this.connections.get(key);
    if (connection && connection.heartbeatInterval) {
      clearInterval(connection.heartbeatInterval);
      connection.heartbeatInterval = null;
    }
  }

  send(key, message) {
    const connection = this.connections.get(key);
    if (!connection) {
      console.error(`❌ Connection ${key} not found`);
      return false;
    }
    
    if (connection.socket.readyState !== WebSocket.OPEN) {
      console.error(`❌ Cannot send message to ${key}: connection state is ${connection.socket.readyState}`);
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      connection.socket.send(messageStr);
      console.log(`📤 Message sent to ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send message to ${key}:`, error);
      return false;
    }
  }

  disconnect(key) {
    const connection = this.connections.get(key);
    if (connection) {
      console.log(`🔌 Disconnecting ${key}`);
      
      this.stopHeartbeat(key);
      
      if (connection.connectionTimeout) {
        clearTimeout(connection.connectionTimeout);
      }
      
      const reconnectTimeout = this.reconnectTimeouts.get(key);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        this.reconnectTimeouts.delete(key);
      }
      
      if (connection.socket) {
        connection.socket.close(1000, 'Manual disconnect');
      }
      
      this.connections.delete(key);
      this.reconnectAttempts.delete(key);
      
      console.log(`✅ Disconnected ${key}`);
    }
  }

  disconnectAll() {
    console.log('🧹 Disconnecting all WebSocket connections');
    const keys = Array.from(this.connections.keys());
    keys.forEach(key => this.disconnect(key));
    
    this.reconnectTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    
    this.heartbeatIntervals.forEach((interval) => clearInterval(interval));
    this.heartbeatIntervals.clear();
  }

  getConnectionStatus(key) {
    const connection = this.connections.get(key);
    if (!connection) return { status: 'disconnected', details: 'No connection found' };
    
    let status = 'unknown';
    let details = '';
    
    switch (connection.socket.readyState) {
      case WebSocket.CONNECTING:
        status = 'connecting';
        details = 'Establishing connection';
        break;
      case WebSocket.OPEN:
        status = connection.isAlive ? 'connected' : 'stale';
        details = connection.isAlive ? 'Connection active' : 'Connection may be stale';
        break;
      case WebSocket.CLOSING:
        status = 'closing';
        details = 'Connection closing';
        break;
      case WebSocket.CLOSED:
        status = 'closed';
        details = 'Connection closed';
        break;
    }
    
    return {
      status,
      details,
      lastPing: connection.lastPing,
      attempts: this.reconnectAttempts.get(key) || 0,
      userId: connection.config.userId
    };
  }

  isConnected(key) {
    const connection = this.connections.get(key);
    return connection && 
           connection.socket.readyState === WebSocket.OPEN && 
           connection.isAlive;
  }

  getDebugInfo() {
    const info = {
      totalConnections: this.connections.size,
      activeConnections: 0,
      connections: {}
    };

    this.connections.forEach((connection, key) => {
      const status = this.getConnectionStatus(key);
      info.connections[key] = status;
      if (status.status === 'connected') {
        info.activeConnections++;
      }
    });

    return info;
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// FIXED: Enhanced notification WebSocket connection
export const connectNotificationWebSocket = (userId, token, dispatch, onNotification) => {
  if (!userId) {
    console.error('❌ Cannot connect to notifications: missing userId');
    return null;
  }
  
  if (!token) {
    console.error('❌ Cannot connect to notifications: missing token');
    return null;
  }

  if (!WS_URL) {
    console.error('❌ Cannot connect to notifications: VITE_WS_URL not configured');
    return null;
  }

  console.log(`🔔 Connecting notification WebSocket for user: ${userId}`);

  const key = wsManager.getConnectionKey('notifications', userId);
  // FIXED: Correct WebSocket URL format
  const url = `${WS_URL}/ws/notifications/${userId}/?token=${encodeURIComponent(token)}`;

  return wsManager.connect({
    key,
    url,
    token,
    userId,
    onOpen: () => {
      console.log(`🔔 Notification WebSocket connected successfully for user: ${userId}`);
    },
    onMessage: (data) => {
      console.log('📨 Notification WebSocket message:', data);
      
      if (data.type === 'notification') {
        const notification = data.payload;
        
        if (!notification || !notification.id || !notification.content) {
          console.warn('❌ Invalid notification data received:', data);
          return;
        }

        console.log('🔔 Processing notification:', notification.content);
        
        // Add to Redux store
        if (dispatch) {
          dispatch(addNotification(notification));
        }
        
        // Call callback if provided
        if (onNotification) {
          onNotification(notification);
        }
      } else if (data.type === 'error') {
        console.error('❌ Notification server error:', data.message);
      } else if (data.type === 'auth_success') {
        console.log('✅ Notification WebSocket authenticated');
      } else if (data.type === 'auth_error') {
        console.error('🔐 Notification WebSocket authentication failed:', data.message);
      }
    },
    onError: (error) => {
      console.error(`❌ Notification WebSocket error for user ${userId}:`, error);
    },
    onClose: (event) => {
      console.log(`🔔 Notification WebSocket closed for user ${userId}: ${event.code} - ${event.reason}`);
    }
  });
};

// FIXED: Chat WebSocket connection
export const connectChatWebSocket = (roomId, token, roomType = 'chat', onMessage, onError) => {
  if (!roomId || !token) {
    console.error('❌ Cannot connect to chat: missing roomId or token');
    return null;
  }

  const key = wsManager.getConnectionKey('chat', roomId, roomType);
  // FIXED: Correct WebSocket URL format
  const url = `${WS_URL}/ws/chat/${roomId}/?token=${encodeURIComponent(token)}&room_type=${roomType}`;

  return wsManager.connect({
    key,
    url,
    token,
    onOpen: () => {
      console.log(`📱 Chat WebSocket connected for ${roomType} room: ${roomId}`);
    },
    onMessage: (data) => {
      // FIXED: Handle message types correctly
      if (data.type === 'message') {
        const message = {
          id: data.message.id,
          content: data.message.content,
          file_url: data.message.file_url,
          sender: data.message.sender,
          timestamp: data.message.timestamp,
          [roomType === 'chat' ? 'chat_room' : 'community_chat_room']: { id: roomId },
        };
        onMessage(message);
      } else if (data.type === 'reaction_update') {
        onMessage({
          id: data.message_id,
          reactions: data.reactions,
        });
      }
    },
    onError: (error) => {
      console.error(`❌ Chat WebSocket error for room ${roomId}:`, error);
      if (onError) onError('Failed to connect to chat server');
    },
    onClose: (event) => {
      console.log(`📱 Chat WebSocket closed for room ${roomId}`);
    }
  });
};

// Send message through chat WebSocket
export const sendChatMessage = (roomId, roomType, message, file = null, fileName = null, fileType = null) => {
  const key = wsManager.getConnectionKey('chat', roomId, roomType);
  
  if (!wsManager.isConnected(key)) {
    console.error(`❌ Cannot send message: chat WebSocket not connected for room ${roomId}`);
    return false;
  }

  const messageData = {
    type: 'chat_message',
    message,
    timestamp: Date.now()
  };

  if (file && fileName) {
    messageData.file = file;
    messageData.file_name = fileName;
    messageData.file_type = fileType;
  }

  return wsManager.send(key, messageData);
};

// Disconnect functions
export const disconnectChatWebSocket = (roomId, roomType = 'chat') => {
  const key = wsManager.getConnectionKey('chat', roomId, roomType);
  wsManager.disconnect(key);
};

export const disconnectNotificationWebSocket = (userId) => {
  const key = wsManager.getConnectionKey('notifications', userId);
  wsManager.disconnect(key);
};

export const disconnectAllWebSockets = () => {
  wsManager.disconnectAll();
};

// Status functions
export const getWebSocketStatus = (type, id, roomType = null) => {
  const key = wsManager.getConnectionKey(type, id, roomType);
  return wsManager.getConnectionStatus(key);
};

export const isWebSocketConnected = (type, id, roomType = null) => {
  const key = wsManager.getConnectionKey(type, id, roomType);
  return wsManager.isConnected(key);
};

// Debug function
export const getWebSocketDebugInfo = () => {
  return wsManager.getDebugInfo();
};

// Existing API thunks (unchanged but with better error handling)
export const getChatRooms = createAsyncThunk(
  'chat/getChatRooms',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await axios.get(`${API_URL}/api/chats/rooms/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Get chat rooms error:', error);
      if (error.response) {
        return rejectWithValue(error.response.data?.error || `Server error: ${error.response.status}`);
      }
      return rejectWithValue(error.message || 'Failed to fetch chat rooms');
    }
  }
);

export const createChatRoom = createAsyncThunk(
  'chat/createChatRoom',
  async (memberId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      const user = state.auth.currentTrainer || state.auth.currentMember;
      
      if (!token) {
        throw new Error('No access token available');
      }

      if (!user) {
        throw new Error('No current user found');
      }

      const isTrainer = user.user_type === 'trainer';
      const requestData = isTrainer 
        ? { trainer_id: user.id, member_id: memberId } 
        : { trainer_id: memberId };

      const response = await axios.post(
        `${API_URL}/api/chats/rooms/`,
        requestData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Create chat room error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create chat room');
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async ({ roomId, roomType }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }

      const url = roomType === 'community'
        ? `${API_URL}/api/chats/community/${roomId}/messages/`
        : `${API_URL}/api/chats/rooms/${roomId}/messages/`;

      const response = await axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { roomId, roomType, messages: response.data };
    } catch (error) {
      console.error('Get messages error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch messages');
    }
  }
);

export const createCommunityChat = createAsyncThunk(
  'chat/createCommunityChat',
  async ({ trainerId, memberIds, roomName }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await axios.post(
        `${API_URL}/api/chats/community/`,
        {
          trainer_id: trainerId,
          member_ids: memberIds,
          name: roomName || `Community Chat - ${trainerId}`,
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Create community chat error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create community chat');
    }
  }
);

// Export the WebSocket manager
export { wsManager };