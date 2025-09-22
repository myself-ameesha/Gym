// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = `${import.meta.env.VITE_API_URL}`;

// export const fetchNotifications = createAsyncThunk(
//   'notifications/fetchNotifications',
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const response = await axios.get(`${API_URL}/api/chats/notifications/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
//     }
//   }
// );

// export const markNotificationsAsRead = createAsyncThunk(
//   'notifications/markNotificationsAsRead',
//   async (notificationIds, { getState, rejectWithValue }) => {
//     try {
//       const token = getState().auth.accessToken || localStorage.getItem('accessToken');
//       if (!token) throw new Error('No access token');
//       const response = await axios.post(
//         `${API_URL}/api/chats/notifications/`,
//         { notification_ids: notificationIds },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return { notificationIds, message: response.data.message };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to mark notifications as read');
//     }
//   }
// );

// const notificationSlice = createSlice({
//   name: 'notifications',
//   initialState: {
//     notifications: [],
//     status: 'idle',
//     error: null,
//   },
//   reducers: {
//     addNotification: (state, action) => {
//       console.log('Adding notification:', action.payload);
//       state.notifications.push(action.payload);
//     },
//     clearNotifications: (state) => {
//       state.notifications = [];
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchNotifications.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(fetchNotifications.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.notifications = action.payload;
//       })
//       .addCase(fetchNotifications.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload;
//       })
//       .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
//         const { notificationIds } = action.payload;
//         state.notifications = state.notifications.map(n =>
//           notificationIds.includes(n.id) ? { ...n, is_read: true } : n
//         );
//       })
//       .addCase(markNotificationsAsRead.rejected, (state, action) => {
//         state.error = action.payload;
//       });
//   },
// });

// export const { addNotification, addNotifications } = notificationSlice.actions;
// export default notificationSlice.reducer;


// notificationSlice.js - FIXED VERSION
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      console.log('Fetching notifications...');
      
      const response = await axios.get(`${API_URL}/api/chats/notifications/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('Fetched notifications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch notifications error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           error.response.data?.detail ||
                           `Server error: ${error.response.status}`;
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Network error: Unable to reach server');
      } else {
        return rejectWithValue(error.message || 'Failed to fetch notifications');
      }
    }
  }
);

// FIXED: Use the correct endpoint
export const markNotificationsAsRead = createAsyncThunk(
  'notifications/markNotificationsAsRead',
  async (notificationIds, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new Error('Invalid notification IDs provided');
      }
      
      console.log('Marking notifications as read:', notificationIds);
      
      // FIXED: Use the correct endpoint path
      const response = await axios.post(
        `${API_URL}/api/chats/notifications/mark-read/`,
        { notification_ids: notificationIds },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Mark as read response:', response.data);
      return { notificationIds, message: response.data.message || 'Notifications marked as read' };
    } catch (error) {
      console.error('Mark notifications as read error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message ||
                           error.response.data?.detail ||
                           `Server error: ${error.response.status}`;
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Network error: Unable to reach server');
      } else {
        return rejectWithValue(error.message || 'Failed to mark notifications as read');
      }
    }
  }
);

export const deleteNotifications = createAsyncThunk(
  'notifications/deleteNotifications',
  async (notificationIds, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      const response = await axios.delete(
        `${API_URL}/api/chats/notifications/`,
        {
          data: { notification_ids: notificationIds },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      return { notificationIds, message: response.data.message };
    } catch (error) {
      console.error('Delete notifications error:', error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to delete notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    status: 'idle',
    error: null,
    lastFetched: null,
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      console.log('Adding notification to Redux store:', action.payload);
      
      const newNotification = action.payload;
      
      if (!newNotification || !newNotification.id) {
        console.warn('Invalid notification received, skipping');
        return;
      }
      
      const existingIndex = state.notifications.findIndex(n => n.id === newNotification.id);
      
      if (existingIndex === -1) {
        state.notifications.unshift(newNotification);
        console.log('New notification added successfully');
      } else {
        state.notifications[existingIndex] = { ...state.notifications[existingIndex], ...newNotification };
        console.log('Existing notification updated');
      }
      
      state.unreadCount = state.notifications.filter(n => !n.is_read).length;
    },
    
    updateNotification: (state, action) => {
      const { id, updates } = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === id);
      
      if (notificationIndex !== -1) {
        state.notifications[notificationIndex] = { 
          ...state.notifications[notificationIndex], 
          ...updates 
        };
        state.unreadCount = state.notifications.filter(n => !n.is_read).length;
        console.log(`Notification ${id} updated successfully`);
      }
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const initialLength = state.notifications.length;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
      
      if (state.notifications.length !== initialLength) {
        console.log(`Notification ${notificationId} removed`);
        state.unreadCount = state.notifications.filter(n => !n.is_read).length;
      }
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.error = null;
      state.lastFetched = null;
      state.unreadCount = 0;
      console.log('All notifications cleared');
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.is_read).length;
    },
    
    markAsReadOptimistic: (state, action) => {
      const notificationIds = action.payload;
      state.notifications = state.notifications.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      );
      state.unreadCount = state.notifications.filter(n => !n.is_read).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.lastFetched = Date.now();
        
        const fetchedNotifications = Array.isArray(action.payload) ? action.payload : [];
        state.notifications = fetchedNotifications;
        state.unreadCount = fetchedNotifications.filter(n => !n.is_read).length;
        
        console.log(`Updated notifications in store: ${state.notifications.length} total, ${state.unreadCount} unread`);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch notifications';
        console.error('Fetch notifications failed:', action.payload);
      })
      
      .addCase(markNotificationsAsRead.pending, (state, action) => {
        const notificationIds = action.meta.arg;
        state.notifications = state.notifications.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        );
        state.unreadCount = state.notifications.filter(n => !n.is_read).length;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        
        state.notifications = state.notifications.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        );
        state.unreadCount = state.notifications.filter(n => !n.is_read).length;
        
        console.log(`Confirmed ${notificationIds.length} notifications marked as read`);
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark notifications as read';
        console.error('Mark notifications as read failed:', action.payload);
      })
      
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        state.notifications = state.notifications.filter(
          notification => !notificationIds.includes(notification.id)
        );
        state.unreadCount = state.notifications.filter(n => !n.is_read).length;
        console.log(`Deleted ${notificationIds.length} notifications`);
      })
      .addCase(deleteNotifications.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete notifications';
        console.error('Delete notifications failed:', action.payload);
      });
  },
});

export const { 
  addNotification, 
  updateNotification, 
  removeNotification, 
  clearNotifications, 
  clearError,
  updateUnreadCount,
  markAsReadOptimistic
} = notificationSlice.actions;

export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationStatus = (state) => state.notifications.status;
export const selectNotificationError = (state) => state.notifications.error;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectLastFetched = (state) => state.notifications.lastFetched;

export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(n => !n.is_read);

export const selectNotificationsByType = (type) => (state) =>
  state.notifications.notifications.filter(n => n.notification_type === type);

export const selectRecentNotifications = (limit = 10) => (state) =>
  [...state.notifications.notifications]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

export default notificationSlice.reducer;