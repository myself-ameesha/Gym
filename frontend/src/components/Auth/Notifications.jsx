// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { ListGroup, Badge, Button, Spinner, Alert } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
// import { fetchNotifications, markNotificationsAsRead, addNotification } from '../../features/notification/notificationSlice';
// import { connectNotificationWebSocket, closeWebSocket } from '../../features/chat/chatApi';
// import { toast } from 'react-hot-toast';
// import 'react-toastify/dist/ReactToastify.css';
// import { FaBell } from 'react-icons/fa';

// const Notifications = ({ userType = 'member' }) => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth);
//   const { notifications, status, error } = useSelector((state) => state.notifications);

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

//       const socket = connectNotificationWebSocket(
//         currentUser.id,
//         accessToken,
//         dispatch,
//         (notification) => {
//           console.log('New notification received:', notification);
//           dispatch(addNotification(notification));
//           toast.info(`New notification: ${notification.content}`);
//         }
//       );

//       return () => {
//         console.log('Cleaning up WebSocket');
//         closeWebSocket();
//       };
//     }
//   }, [dispatch, currentUser?.id, accessToken]);

//   const handleNotificationClick = (notification) => {
//     dispatch(markNotificationsAsRead([notification.id]))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchNotifications());
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
//       .catch((err) => console.error('Failed to mark notification as read:', err));
//   };

//   const handleMarkAllRead = () => {
//     const unreadNotificationIds = Array.isArray(notifications)
//       ? notifications.filter((n) => !n.is_read).map((n) => n.id)
//       : [];
//     if (unreadNotificationIds.length > 0) {
//       dispatch(markNotificationsAsRead(unreadNotificationIds))
//         .unwrap()
//         .then(() => dispatch(fetchNotifications()))
//         .catch((err) => console.error('Failed to mark all notifications as read:', err));
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not available';
//     const date = new Date(dateString);
//     return date.toLocaleString();
//   };

//   console.log('Notifications state:', notifications);
//   console.log('Type of notifications:', Array.isArray(notifications) ? 'Array' : typeof notifications);

//   return (
//     <div style={{ backgroundColor: '#0c1427', minHeight: '100vh', padding: '20px' }}>
//       <style>
//         {`
//           .notification-item:hover {
//             background-color: #1a2a44 !important;
//             cursor: pointer;
//           }
//           .notification-item {
//             transition: background-color 0.2s ease;
//           }
//         `}
//       </style>
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="text-white">
//           <FaBell className="me-2" /> Notifications
//         </h3>
//         {Array.isArray(notifications) && notifications.length > 0 && notifications.some((n) => !n.is_read) && (
//           <Button
//             variant="outline-info"
//             size="sm"
//             onClick={handleMarkAllRead}
//             style={{ borderColor: '#0dcaf0', color: '#0dcaf0' }}
//           >
//             Mark All as Read
//           </Button>
//         )}
//       </div>

//       {status === 'idle' && (
//         <p className="text-white">Initializing notifications...</p>
//       )}
//       {status === 'loading' && (
//         <div className="text-center mb-3">
//           <Spinner animation="border" variant="light" />
//           <p className="text-white mt-2">Loading notifications...</p>
//         </div>
//       )}
//       {status === 'failed' && (
//         <Alert variant="danger" className="mb-3">
//           {error || 'Failed to load notifications'}
//         </Alert>
//       )}
//       {status === 'succeeded' && (!Array.isArray(notifications) || notifications.length === 0) && (
//         <p className="text-white">No notifications available.</p>
//       )}
//       {status === 'succeeded' && Array.isArray(notifications) && notifications.length > 0 && (
//         <ListGroup>
//           {notifications.map((notification) => (
//             <ListGroup.Item
//               key={notification.id}
//               className="notification-item"
//               style={{
//                 backgroundColor: notification.is_read ? '#101c36' : '#1a2a44',
//                 color: 'white',
//                 border: '1px solid #2a3b6a',
//                 borderRadius: '8px',
//                 marginBottom: '10px',
//                 padding: '15px',
//               }}
//               onClick={() => handleNotificationClick(notification)}
//             >
//               <div className="d-flex justify-content-between align-items-center">
//                 <div>
//                   <p className="mb-1" style={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
//                     {notification.content}
//                   </p>
//                   <small style={{ opacity: 0.7 }}>{formatDate(notification.created_at)}</small>
//                 </div>
//                 {!notification.is_read && (
//                   <Badge bg="primary" pill>
//                     New
//                   </Badge>
//                 )}
//               </div>
//             </ListGroup.Item>
//           ))}
//         </ListGroup>
//       )}
//     </div>
//   );
// };

// export default Notifications;





import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ListGroup, Badge, Button, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationsAsRead, addNotification, selectNotifications, selectNotificationStatus, selectNotificationError } from '../../features/notification/notificationSlice';
import { connectNotificationWebSocket, disconnectNotificationWebSocket } from '../../features/chat/chatApi';
import { toast } from 'react-hot-toast';
import { FaBell, FaCheck, FaEye, FaArrowRight, FaUser, FaCommentDots, FaExclamationTriangle } from 'react-icons/fa';

const Notifications = ({ userType = 'member' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux selectors with fallbacks
  const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth || {});
  const notifications = useSelector(selectNotifications) || [];
  const status = useSelector(selectNotificationStatus);
  const error = useSelector(selectNotificationError);
  
  // Local state
  const [authReady, setAuthReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  
  // Refs
  const socketRef = useRef(null);
  const isInitialMount = useRef(true);
  const authCheckTimeout = useRef(null);

  // Get current user with better validation
  const currentUser = React.useMemo(() => {
    // Try Redux state first
    let user = currentMember || currentTrainer;
    
    // Fallback to localStorage
    if (!user) {
      try {
        const storedUser = localStorage.getItem('currentUser');
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    if (!user) {
      console.warn('No current user found in auth state or localStorage');
      return null;
    }
    
    return user;
  }, [currentMember, currentTrainer]);

  const role = currentUser?.user_type;

  // Enhanced auth state checker
  const checkAuthState = useCallback(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null;
    const token = accessToken || storedToken;
    const user = currentUser || storedUser;
    
    if (!user || !token || !user.id) {
      setAuthReady(false);
      return { isReady: false, user: null, token: null };
    }
    
    setAuthReady(true);
    return { isReady: true, user, token };
  }, [currentUser, accessToken]);

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

    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate, role]);

  // WebSocket connection manager (simplified without error messages)
  const connectToNotifications = useCallback(() => {
    const { isReady, user, token } = checkAuthState();
    
    if (!isReady) {
      setIsConnected(false);
      return;
    }

    try {
      console.log(`Connecting notification WebSocket for user: ${user.id}`);
      
      const ws = connectNotificationWebSocket(
        user.id,
        token,
        dispatch,
        (notification) => {
          console.log('Received real-time notification:', notification.content);
          
          // Show toast notification without connection messages
          toast.success(
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaBell className="text-blue-500" />
              </div>
              <div>
                <div className="font-semibold text-sm">New Notification</div>
                <div className="text-xs text-gray-600 line-clamp-2">{notification.content}</div>
              </div>
            </div>,
            {
              duration: 6000,
              position: 'top-right',
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '16px',
              },
            }
          );
          
          setIsConnected(true);
        }
      );

      if (ws) {
        socketRef.current = ws;
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [checkAuthState, dispatch]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (currentUser) {
      disconnectNotificationWebSocket(currentUser.id);
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [currentUser]);

  // Initialize component
  useEffect(() => {
    const initializeComponent = () => {
      const { isReady } = checkAuthState();
      
      if (isReady) {
        console.log('Auth ready, initializing notifications');
        
        // Fetch notifications
        dispatch(fetchNotifications())
          .unwrap()
          .then((data) => {
            console.log(`Fetched ${data?.length || 0} notifications`);
            
            if (isInitialMount.current) {
              const unreadCount = Array.isArray(data) ? data.filter(n => !n.is_read).length : 0;
              if (unreadCount > 0) {
                toast.success(`Welcome back! You have ${unreadCount} unread notification(s)`, {
                  duration: 4000,
                  position: 'top-center',
                });
              }
              isInitialMount.current = false;
            }
          })
          .catch((err) => {
            console.error('Failed to fetch notifications:', err);
          });

        // Connect WebSocket
        setTimeout(() => {
          connectToNotifications();
        }, 1000);
      } else {
        // Set up auth polling if not ready
        const authInterval = setInterval(() => {
          const { isReady: retryReady } = checkAuthState();
          if (retryReady) {
            clearInterval(authInterval);
            initializeComponent();
          }
        }, 1000);

        authCheckTimeout.current = setTimeout(() => {
          clearInterval(authInterval);
          console.warn('Auth check timeout - user may need to login again');
        }, 30000);

        return () => {
          clearInterval(authInterval);
          if (authCheckTimeout.current) {
            clearTimeout(authCheckTimeout.current);
          }
        };
      }
    };

    initializeComponent();

    return () => {
      disconnectWebSocket();
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
    };
  }, [checkAuthState, dispatch, connectToNotifications, disconnectWebSocket]);

  // Notification handlers
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.is_read) {
        await dispatch(markNotificationsAsRead([notification.id])).unwrap();
        dispatch(fetchNotifications());
      }

      // Navigate to appropriate page
      handleNotificationRedirect(notification);
      
    } catch (err) {
      console.error('Error processing notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotificationIds = Array.isArray(notifications)
      ? notifications.filter((n) => !n.is_read).map((n) => n.id)
      : [];
    
    if (unreadNotificationIds.length === 0) {
      toast.success('No unread notifications to mark');
      return;
    }

    try {
      await dispatch(markNotificationsAsRead(unreadNotificationIds)).unwrap();
      dispatch(fetchNotifications());
      toast.success(`${unreadNotificationIds.length} notifications marked as read`);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications to mark as read');
      return;
    }

    try {
      await dispatch(markNotificationsAsRead(selectedNotifications)).unwrap();
      dispatch(fetchNotifications());
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notifications marked as read`);
    } catch (err) {
      toast.error('Failed to mark selected notifications as read');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
        return <FaCommentDots className="text-blue-500" />;
      case 'member_assigned':
        return <FaUser className="text-green-500" />;
      case 'plan_expiring':
        return <FaExclamationTriangle className="text-orange-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    
    let filtered = [...notifications];
    
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [notifications, filterType]);

  // Computed values
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;
  const totalCount = Array.isArray(notifications) ? notifications.length : 0;

  // Show loading state for auth
  if (!authReady && status !== 'failed') {
    return (
      <Container fluid style={{ backgroundColor: '#0c1427', minHeight: '100vh', padding: '20px' }}>
        <div className="text-center py-5">
          <Spinner animation="border" variant="light" size="lg" />
          <h5 className="text-white mt-3">Initializing notifications...</h5>
          <p className="text-muted">Please wait while we load your notifications</p>
        </div>
      </Container>
    );
  }

  // Show error state if no user
  if (!currentUser) {
    return (
      <Container fluid style={{ backgroundColor: '#0c1427', minHeight: '100vh', padding: '20px' }}>
        <Alert variant="warning" className="text-center">
          <h5>Authentication Required</h5>
          <p>Please log in to view your notifications.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid style={{ backgroundColor: '#0c1427', minHeight: '100vh', padding: '20px' }}>
      <style jsx>{`
        .notification-item:hover {
          background-color: #1a2a44 !important;
          cursor: pointer;
          transform: translateX(4px);
        }
        .notification-item {
          transition: all 0.2s ease;
          position: relative;
        }
        .notification-unread {
          border-left: 4px solid #0dcaf0;
          background: linear-gradient(90deg, rgba(13, 202, 240, 0.1) 0%, transparent 100%);
        }
        .notification-selected {
          background-color: #2a3b6a !important;
          border: 2px solid #0dcaf0;
        }
        .filter-button {
          transition: all 0.2s ease;
        }
        .filter-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transform: scale(1.05);
        }
      `}</style>

      <Row className="mb-4">
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <h3 className="text-white d-flex align-items-center mb-0">
                <FaBell className="me-2" /> 
                Notifications
                {unreadCount > 0 && (
                  <Badge bg="danger" className="ms-2 animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </h3>
            </div>
            
            <div className="d-flex gap-2">
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => dispatch(fetchNotifications())}
                disabled={status === 'loading'}
                style={{ borderColor: '#0dcaf0', color: '#0dcaf0' }}
              >
                <FaEye className="me-1" />
                {status === 'loading' ? 'Loading...' : 'Refresh'}
              </Button>
              
              {selectedNotifications.length > 0 && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleBulkMarkRead}
                  style={{ borderColor: '#28a745', color: '#28a745' }}
                >
                  <FaCheck className="me-1" />
                  Mark Selected ({selectedNotifications.length})
                </Button>
              )}
              
              {unreadCount > 0 && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={status === 'loading'}
                  style={{ borderColor: '#28a745', color: '#28a745' }}
                >
                  <FaCheck className="me-1" />
                  Mark All Read ({unreadCount})
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar - Only All and Unread */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {['all', 'unread'].map(filter => (
              <Button
                key={filter}
                size="sm"
                variant={filterType === filter ? "primary" : "outline-secondary"}
                onClick={() => setFilterType(filter)}
                className={`filter-button ${filterType === filter ? 'active' : ''}`}
                style={{
                  borderRadius: '20px',
                  textTransform: 'capitalize',
                }}
              >
                {filter === 'all' ? `All (${totalCount})` : `Unread (${unreadCount})`}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* Loading State */}
      {status === 'loading' && (
        <div className="text-center mb-4">
          <Spinner animation="border" variant="light" size="lg" />
          <p className="text-white mt-3">Loading notifications...</p>
        </div>
      )}

      {/* Error State */}
      {status === 'failed' && (
        <Alert variant="danger" className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Error:</strong> {error || 'Failed to load notifications'}
            </div>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => dispatch(fetchNotifications())}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      )}

      {/* Empty State */}
      {status === 'succeeded' && filteredNotifications.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-4">
            <FaBell size={64} style={{ color: '#6c757d', opacity: 0.5 }} />
          </div>
          <h4 className="text-white mb-3">
            {filterType === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h4>
          <p className="text-muted mb-4">
            {filterType === 'unread' 
              ? 'All caught up! No unread notifications to show.'
              : 'You\'ll see notifications here when you receive messages or updates'
            }
          </p>
          {filterType !== 'all' && (
            <Button variant="outline-info" onClick={() => setFilterType('all')}>
              View All Notifications
            </Button>
          )}
        </div>
      )}

      {/* Notifications List */}
      {status === 'succeeded' && filteredNotifications.length > 0 && (
        <Row>
          <Col>
            <ListGroup>
              {filteredNotifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'notification-unread' : ''} ${
                    selectedNotifications.includes(notification.id) ? 'notification-selected' : ''
                  }`}
                  style={{
                    backgroundColor: notification.is_read ? '#101c36' : '#1a2a44',
                    color: 'white',
                    border: '1px solid #2a3b6a',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start flex-grow-1">
                      {/* Checkbox for selection */}
                      <input
                        type="checkbox"
                        className="me-3 mt-1"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedNotifications(prev => [...prev, notification.id]);
                          } else {
                            setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                          }
                        }}
                        style={{ transform: 'scale(1.2)' }}
                      />

                      {/* Notification Icon */}
                      <div className="me-3 mt-1">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: !notification.is_read ? '#0dcaf0' : '#6c757d',
                            opacity: notification.is_read ? 0.6 : 1,
                          }}
                        >
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <Badge 
                            bg={!notification.is_read ? 'primary' : 'secondary'} 
                            className="me-2"
                          >
                            {notification.notification_type?.toUpperCase().replace('_', ' ') || 'NOTIFICATION'}
                          </Badge>
                          
                          {!notification.is_read && (
                            <Badge bg="danger" pill className="me-2 animate-pulse">
                              New
                            </Badge>
                          )}
                          
                          <small className="text-muted">
                            {formatDate(notification.created_at)}
                          </small>
                        </div>
                        
                        <h6
                          className="mb-2"
                          style={{
                            fontWeight: notification.is_read ? 'normal' : 'bold',
                            color: notification.is_read ? '#adb5bd' : 'white',
                            fontSize: '16px',
                            lineHeight: '1.4',
                          }}
                        >
                          {notification.content}
                        </h6>
                        
                        {/* Additional context */}
                        {(notification.related_room || notification.related_community_room) && (
                          <small className="text-info d-flex align-items-center">
                            <FaArrowRight className="me-1" />
                            Click to open {notification.related_room ? 'chat' : 'community'}
                          </small>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="d-flex flex-column align-items-end ms-3">
                      {!notification.is_read && (
                        <Button
                          variant="outline-light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(markNotificationsAsRead([notification.id]))
                              .then(() => dispatch(fetchNotifications()));
                          }}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            marginBottom: '8px',
                          }}
                          title="Mark as read"
                        >
                          <FaCheck />
                        </Button>
                      )}
                      
                      {/* Status indicator */}
                      <div
                        className={`rounded-circle ${
                          !notification.is_read ? 'bg-primary' : 'bg-secondary'
                        }`}
                        style={{
                          width: '8px',
                          height: '8px',
                          opacity: notification.is_read ? 0.3 : 1,
                        }}
                      ></div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>

            {/* Load More Button */}
            {filteredNotifications.length > 0 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline-info"
                  onClick={() => dispatch(fetchNotifications())}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <FaEye className="me-2" />
                      Refresh Notifications
                    </>
                  )}
                </Button>
              </div>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Notifications;

