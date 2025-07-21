import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const response = await axios.get(`${API_URL}/api/chats/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  'notifications/markNotificationsAsRead',
  async (notificationIds, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token');
      const response = await axios.post(
        `${API_URL}/api/chats/notifications/`,
        { notification_ids: notificationIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { notificationIds, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark notifications as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      console.log('Adding notification:', action.payload);
      state.notifications.push(action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        state.notifications = state.notifications.map(n =>
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        );
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { addNotification, addNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;