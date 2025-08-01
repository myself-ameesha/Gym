let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 5000;

export const connectWebSocket = (roomId, token, onMessage, onError) => {
  // const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const WS_URL = import.meta.env.VITE_WS_URL;
  socket = new WebSocket(`${WS_URL}/ws/chat/${roomId}/?token=${token}`);

  socket.onopen = () => {
    console.log('Chat WebSocket connected');
    reconnectAttempts = 0;
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      onMessage(data.message);
    }
  };

  socket.onerror = (error) => {
    console.error('Chat WebSocket error:', error);
    onError?.(error);
  };

  socket.onclose = () => {
    console.log('Chat WebSocket closed');
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Reconnecting WebSocket... Attempt ${reconnectAttempts + 1}`);
        reconnectAttempts++;
        connectWebSocket(roomId, token, onMessage, onError);
      }, reconnectInterval);
    } else {
      onError?.('Max reconnect attempts reached');
    }
  };

  return socket;
};

export const connectNotificationWebSocket = (userId, token, dispatch, onNotification) => {
  // const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const WS_URL = import.meta.env.VITE_WS_URL;
  const notificationSocket = new WebSocket(`${WS_URL}/ws/notifications/${userId}/?token=${token}`);

  notificationSocket.onopen = () => {
    console.log('Notification WebSocket connected');
  };

  notificationSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'notification') {
      dispatch(addNotification(data.notification));
      onNotification?.(data.notification);
    }
  };

  notificationSocket.onerror = (error) => {
    console.error('Notification WebSocket error:', error);
  };

  notificationSocket.onclose = () => {
    console.log('Notification WebSocket closed');
  };

  return notificationSocket;
};

export const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ message }));
  }
};

export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};