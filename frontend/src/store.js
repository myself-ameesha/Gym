import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import chatReducer from './features/chat/chatSlice';
import notificationReducer from './features/notification/notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,  // Manages authentication (login, token handling)
    chat: chatReducer,
    notifications: notificationReducer,
  },
});

export default store;
