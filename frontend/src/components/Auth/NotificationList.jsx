// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchNotifications, markNotificationsAsRead } from '../../features/notification/notificationSlice';
// import { connectNotificationWebSocket, closeWebSocket } from '../../features/chat/chatApi';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const NotificationList = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth);
//   const { notifications, status, error } = useSelector((state) => state.notifications);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [anchorEl, setAnchorEl] = useState(null);

//   const currentUser = currentMember || currentTrainer;
//   const role = currentUser?.user_type;

//   useEffect(() => {
//     if (currentUser && accessToken) {
//       dispatch(fetchNotifications())
//         .unwrap()
//         .then((data) => console.log('Notifications fetched:', data))
//         .catch((err) => {
//           console.error('Failed to fetch notifications:', err);
//           toast.error(err?.message || 'Failed to load notifications');
//         });

//       const notificationSocket = connectNotificationWebSocket(
//         currentUser.id,
//         accessToken,
//         dispatch,
//         (notification) => {
//           console.log('New notification received:', notification);
//           toast.info(`New notification: ${notification.content}`);
//         }
//       );

//       return () => {
//         console.log('Closing notification WebSocket');
//         closeWebSocket();
//       };
//     }
//   }, [dispatch, currentUser?.id, accessToken]);

//   useEffect(() => {
//     const count = notifications.filter(n => !n.is_read).length;
//     setUnreadCount(count);
//   }, [notifications]);

//   const handleNotificationClick = (notification) => {
//     dispatch(markNotificationsAsRead([notification.id]))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchNotifications());
//         setUnreadCount(prev => Math.max(0, prev - 1));
//         const roomId = notification.related_room?.id || notification.related_community_room?.id;
//         const roomType = notification.related_room ? 'chat' : 'community';
//         if (notification.notification_type === 'chat' && roomId) {
//           navigate(`/dashboard?section=${roomType}&roomId=${roomId}&roomType=${roomType}`);
//         } else if (notification.notification_type === 'member_assigned' && role === 'trainer') {
//           navigate('/trainer/dashboard');
//         } else if (notification.notification_type === 'plan_expiring' && role === 'member') {
//           navigate('/member/dashboard');
//         }
//       })
//       .catch(err => console.error('Failed to mark notification as read:', err));
//   };

//   const handleBellClick = (event) => {
//     setAnchorEl(anchorEl ? null : event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const unreadNotifications = notifications.filter(n => !n.is_read);
//   const recentNotifications = [...notifications]
//     .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//     .slice(0, 20);

//   return (
//     <div className="relative">
//       <button
//         onClick={handleBellClick}
//         className="relative flex items-center justify-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
//       >
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//             {unreadCount}
//           </span>
//         )}
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-6 w-6 text-gray-700"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="2"
//             d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
//           />
//         </svg>
//       </button>

//       {anchorEl && (
//         <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
//           {status === 'loading' && (
//             <div className="px-4 py-3 text-gray-500 text-sm">Loading notifications...</div>
//           )}
//           {status === 'failed' && (
//             <div className="px-4 py-3 text-red-500 text-sm">{error || 'Failed to load notifications'}</div>
//           )}
//           {status === 'succeeded' && unreadNotifications.length === 0 && (
//             <div className="px-4 py-3 text-gray-500 text-sm">No new notifications</div>
//           )}
//           {status === 'succeeded' && unreadNotifications.length > 0 && (
//             unreadNotifications.map(notification => (
//               <div
//                 key={notification.id}
//                 onClick={() => handleNotificationClick(notification)}
//                 className={`px-4 py-2 cursor-pointer ${
//                   !notification.is_read ? 'bg-gray-200 font-bold' : 'bg-white'
//                 } hover:bg-gray-300`}
//               >
//                 <p className="text-sm">{notification.content}</p>
//                 <p className="text-xs text-gray-500">
//                   {new Date(notification.created_at).toLocaleString()}
//                 </p>
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationList;


import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationsAsRead, addNotification } from '../../features/notification/notificationSlice';
import { connectNotificationWebSocket, disconnectNotificationWebSocket, isWebSocketConnected } from '../../features/chat/chatApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth);
  const { notifications, status, error } = useSelector((state) => state.notifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const isInitialMount = useRef(true);

  const currentUser = currentMember || currentTrainer;
  const role = currentUser?.user_type;

  // Enhanced auth validation
  const validateAuth = useCallback(() => {
    let token = accessToken;
    let user = currentUser;

    if (!user || !token) {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('currentUser') ? 
        JSON.parse(localStorage.getItem('currentUser')) : null;
      
      token = token || storedToken;
      user = user || storedUser;
    }
    
    if (!user || !token || !user.id) {
      console.warn('NotificationList: Missing authentication data', { 
        user: !!user, 
        token: !!token,
        userId: user?.id 
      });
      return { isValid: false, user: null, token: null };
    }
    
    return { isValid: true, user, token };
  }, [currentUser, accessToken]);

  // Enhanced popup notification with better navigation
  const showNotificationPopup = useCallback((notification) => {
    const handleNotificationClick = () => {
      handleNotificationRedirect(notification);
      toast.dismiss();
    };

    const getNotificationIcon = (type) => {
      const iconProps = { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20" };
      
      switch (type) {
        case 'chat':
          return (
            <svg {...iconProps} className="w-5 h-5 text-blue-600">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          );
        case 'member_assigned':
          return (
            <svg {...iconProps} className="w-5 h-5 text-green-600">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          );
        case 'plan_expiring':
          return (
            <svg {...iconProps} className="w-5 h-5 text-orange-600">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          );
        default:
          return (
            <svg {...iconProps} className="w-5 h-5 text-purple-600">
              <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
            </svg>
          );
      }
    };

    const getTypeLabel = (type) => {
      switch (type) {
        case 'chat': return 'New Message';
        case 'member_assigned': return 'Member Assigned';
        case 'plan_expiring': return 'Plan Expiring';
        case 'community': return 'Community Update';
        default: return 'Notification';
      }
    };

    const notificationContent = (
      <div className="notification-popup-container" onClick={handleNotificationClick}>
        <div className="flex items-start space-x-3 cursor-pointer p-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              {getNotificationIcon(notification.notification_type)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getTypeLabel(notification.notification_type)}
              </span>
              <span className="text-xs text-gray-300 font-medium">
                Just now
              </span>
            </div>
            <p className="text-sm font-semibold text-white line-clamp-2 mb-2">
              {notification.content}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">
                Click to view details
              </p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">New</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    toast(notificationContent, {
      position: "top-right",
      autoClose: 8000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: 'notification-toast',
      bodyClassName: 'p-0',
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(20px)',
        padding: 0,
        overflow: 'hidden',
      }
    });
  }, []);

  // Enhanced notification redirect logic with proper navigation
  const handleNotificationRedirect = useCallback((notification) => {
    if (!notification) return;

    // Mark as read first
    if (!notification.is_read) {
      dispatch(markNotificationsAsRead([notification.id]))
        .unwrap()
        .then(() => {
          dispatch(fetchNotifications());
        })
        .catch(err => console.error('Failed to mark notification as read:', err));
    }

    const roomId = notification.related_room?.id || notification.related_community_room?.id;
    const roomType = notification.related_room ? 'chat' : 'community';
    
    try {
      let navigationPath = '/MemberDashboard';

      switch (notification.notification_type) {
        case 'chat':
          if (roomId) {
            // Navigate to appropriate dashboard with chat section
            if (role === 'trainer') {
              navigationPath = `/Trainer/TrainerDashboard?section=community&roomId=${roomId}&roomType=${roomType}`;
            } else {
              navigationPath = `/MemberDashboard?section=chat&roomId=${roomId}&roomType=${roomType}`;
            }
          } else {
            // Fallback to general chat section
            if (role === 'trainer') {
              navigationPath = '/Trainer/TrainerDashboard?section=community';
            } else {
              navigationPath = '/MemberDashboard?section=chat';
            }
          }
          break;

        case 'member_assigned':
          if (role === 'trainer') {
            navigationPath = '/Trainer/TrainerMembers';
          } else {
            navigationPath = '/MemberDashboard?section=trainer';
          }
          break;

        case 'plan_expiring':
          if (role === 'member') {
            navigationPath = '/MemberDashboard?section=membership';
          } else {
            navigationPath = '/Trainer/TrainerDashboard?section=members';
          }
          break;

        case 'community':
          if (roomId) {
            if (role === 'trainer') {
              navigationPath = `/Trainer/TrainerDashboard?section=community&roomId=${roomId}&roomType=community`;
            } else {
              navigationPath = `/MemberDashboard?section=chat&roomId=${roomId}&roomType=community`;
            }
          } else {
            if (role === 'trainer') {
              navigationPath = '/Trainer/TrainerDashboard?section=community';
            } else {
              navigationPath = '/MemberDashboard?section=chat';
            }
          }
          break;

        default:
          // Fallback navigation
          if (role === 'trainer') {
            navigationPath = '/Trainer/TrainerDashboard';
          } else {
            navigationPath = '/MemberDashboard';
          }
          break;
      }

      console.log('Navigating to:', navigationPath);
      navigate(navigationPath);
      
      // Show success message
      toast.success('Opening notification...', {
        position: "bottom-right",
        autoClose: 2000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '8px',
        }
      });

    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate. Please try again.', {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  }, [dispatch, navigate, role]);

  // WebSocket connection with retry logic
  const connectToNotifications = useCallback(() => {
    const { isValid, user, token } = validateAuth();
    
    if (!isValid) {
      console.error('NotificationList: Cannot connect - invalid auth');
      setIsConnected(false);
      return;
    }

    // Don't connect if already connected
    if (isWebSocketConnected('notifications', user.id)) {
      console.log('NotificationList: Already connected');
      setIsConnected(true);
      return;
    }

    console.log(`NotificationList: Connecting WebSocket for user ${user.id}`);

    try {
      const ws = connectNotificationWebSocket(
        user.id,
        token,
        dispatch,
        (notification) => {
          console.log('NotificationList: Received notification:', notification.content);
          
          // Show enhanced popup notification
          showNotificationPopup(notification);
        }
      );

      if (ws) {
        socketRef.current = ws;
        setIsConnected(true);
        setConnectionAttempts(0);
        console.log('NotificationList: WebSocket connected successfully');

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else {
        console.error('NotificationList: Failed to create WebSocket connection');
        handleReconnect();
      }
    } catch (error) {
      console.error('NotificationList: WebSocket connection error:', error);
      handleReconnect();
    }
  }, [validateAuth, dispatch, showNotificationPopup]);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (connectionAttempts >= maxReconnectAttempts) {
      console.error('NotificationList: Max reconnection attempts reached');
      setIsConnected(false);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
    console.log(`NotificationList: Reconnecting in ${delay}ms (attempt ${connectionAttempts + 1})`);
    
    setConnectionAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectToNotifications();
    }, delay);
  }, [connectionAttempts, connectToNotifications]);

  // Initialize notifications and WebSocket
  useEffect(() => {
    const initializeNotifications = async () => {
      const { isValid, user } = validateAuth();
      
      if (!isValid) {
        console.warn('NotificationList: Auth not ready, waiting...');
        
        // Set up a delayed retry for auth
        const authRetryTimeout = setTimeout(() => {
          const { isValid: retryValid } = validateAuth();
          if (retryValid) {
            initializeNotifications();
          }
        }, 2000);

        return () => clearTimeout(authRetryTimeout);
      }

      console.log('NotificationList: Initializing for user:', user.id);

      try {
        // Fetch existing notifications
        const data = await dispatch(fetchNotifications()).unwrap();
        console.log('NotificationList: Notifications fetched:', data?.length || 0);
        
        // Show welcome message on first load
        if (isInitialMount.current) {
          const unreadNotifications = Array.isArray(data) ? data.filter(n => !n.is_read) : [];
          if (unreadNotifications.length > 0) {
            toast.info(`Welcome back! You have ${unreadNotifications.length} unread notification(s)`, {
              position: "top-center",
              autoClose: 4000,
            });
          }
          isInitialMount.current = false;
        }
      } catch (err) {
        console.error('NotificationList: Failed to fetch notifications:', err);
        toast.error('Failed to load notifications. Please refresh.', {
          position: "top-center",
          autoClose: 5000,
        });
      }

      // Connect to WebSocket after a short delay to ensure auth is stable
      setTimeout(() => {
        connectToNotifications();
      }, 1000);
    };

    initializeNotifications();
  }, [dispatch, validateAuth, connectToNotifications]);

  // Monitor connection status
  useEffect(() => {
    if (!currentUser) return;

    const statusInterval = setInterval(() => {
      const connected = isWebSocketConnected('notifications', currentUser.id);
      if (connected !== isConnected) {
        console.log(`NotificationList: Connection status changed: ${connected}`);
        setIsConnected(connected);
        
        // Try to reconnect if disconnected
        if (!connected && connectionAttempts < maxReconnectAttempts) {
          console.log('NotificationList: Detected disconnection, attempting reconnect');
          handleReconnect();
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(statusInterval);
  }, [currentUser, isConnected, connectionAttempts, handleReconnect]);

  // Update unread count when notifications change
  useEffect(() => {
    if (Array.isArray(notifications)) {
      const count = notifications.filter(n => !n.is_read).length;
      setUnreadCount(count);
    }
  }, [notifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('NotificationList: Cleaning up');
      
      if (currentUser) {
        disconnectNotificationWebSocket(currentUser.id);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      setIsConnected(false);
    };
  }, [currentUser]);

  const handleNotificationClick = (notification) => {
    handleNotificationRedirect(notification);
    setAnchorEl(null); // Close the dropdown
  };

  const handleBellClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    const unreadNotificationIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (unreadNotificationIds.length > 0) {
      dispatch(markNotificationsAsRead(unreadNotificationIds))
        .unwrap()
        .then(() => {
          dispatch(fetchNotifications());
          toast.success('All notifications marked as read');
        })
        .catch(err => {
          console.error('Failed to mark all notifications as read:', err);
          toast.error('Failed to mark notifications as read');
        });
    }
  };

  const handleRetryConnection = () => {
    console.log('NotificationList: Manual retry connection');
    setConnectionAttempts(0);
    connectToNotifications();
  };

  // Show auth status instead of "waiting for authentication"
  if (!currentUser && status !== 'loading') {
    return (
      <div className="relative">
        <button
          onClick={() => toast.info('Please log in to receive notifications')}
          className="relative flex items-center justify-center p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors opacity-50 cursor-not-allowed"
          title="Login required for notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
      </div>
    );
  }

  const unreadNotifications = Array.isArray(notifications) 
    ? notifications.filter(n => !n.is_read) 
    : [];
  
  const recentNotifications = Array.isArray(notifications)
    ? [...notifications]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
    : [];

  return (
    <>
      {/* Enhanced CSS for notifications */}
      <style jsx>{`
        .notification-toast {
          border-radius: 16px !important;
          overflow: hidden !important;
          animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.320, 1.275) !important;
        }
        
        .notification-popup-container {
          transition: all 0.3s ease;
        }
        
        .notification-popup-container:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9)) !important;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative flex items-center justify-center p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
          title={`${unreadCount} unread notification(s) ${isConnected ? '(Connected)' : '(Disconnected)'}`}
        >
          {/* Connection indicator */}
          <div className={`absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          } ${!isConnected ? 'animate-pulse' : ''}`}></div>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse font-bold shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Bell icon with animation */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-gray-700 transition-transform duration-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {anchorEl && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  } ${!isConnected ? 'animate-pulse' : ''}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isConnected && (
                    <button
                      onClick={handleRetryConnection}
                      className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded-full transition-colors"
                      title="Retry connection"
                    >
                      Retry
                    </button>
                  )}
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              
              {/* Connection status */}
              {!isConnected && (
                <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <div className="w-1 h-1 bg-orange-600 rounded-full animate-pulse"></div>
                  Real-time notifications unavailable
                  {connectionAttempts > 0 && ` (${connectionAttempts}/${maxReconnectAttempts} retries)`}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {status === 'loading' && (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading notifications...
                </div>
              )}
              
              {status === 'failed' && (
                <div className="px-4 py-3">
                  <div className="text-red-500 text-sm text-center mb-2">
                    {error || 'Failed to load notifications'}
                  </div>
                  <button
                    onClick={() => dispatch(fetchNotifications())}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 py-1 border border-blue-300 rounded"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {status === 'succeeded' && recentNotifications.length === 0 && (
                <div className="px-4 py-6 text-gray-500 text-sm text-center">
                  <svg className="h-12 w-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  No notifications yet
                </div>
              )}
              
              {status === 'succeeded' && recentNotifications.length > 0 && (
                recentNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 ${
                      !notification.is_read 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            !notification.is_read 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {notification.notification_type?.toUpperCase().replace('_', ' ') || 'NOTIFICATION'}
                          </span>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-1 ${
                          !notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.content}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    navigate('/Notifications');
                    setAnchorEl(null);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}

        {/* Click outside to close */}
        {anchorEl && (
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          ></div>
        )}
      </div>
    </>
  );
};

export default NotificationList;