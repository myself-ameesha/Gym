import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ListGroup, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationsAsRead, addNotification } from '../../features/notification/notificationSlice';
import { connectNotificationWebSocket, closeWebSocket } from '../../features/chat/chatApi';
import { toast } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import { FaBell } from 'react-icons/fa';

const Notifications = ({ userType = 'member' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth);
  const { notifications, status, error } = useSelector((state) => state.notifications);

  const currentUser = currentMember || currentTrainer;
  const role = currentUser?.user_type;

  useEffect(() => {
    if (currentUser && accessToken) {
      dispatch(fetchNotifications())
        .unwrap()
        .then((data) => console.log('Notifications fetched:', data))
        .catch((err) => {
          console.error('Failed to fetch notifications:', err);
          toast.error(err?.message || 'Failed to load notifications');
        });

      const socket = connectNotificationWebSocket(
        currentUser.id,
        accessToken,
        dispatch,
        (notification) => {
          console.log('New notification received:', notification);
          dispatch(addNotification(notification)); // Add new notification to Redux store
          toast.info(`New notification: ${notification.content}`);
        }
      );

      return () => {
        console.log('Cleaning up WebSocket');
        closeWebSocket();
      };
    }
  }, [dispatch, currentUser?.id, accessToken]);

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationsAsRead([notification.id]))
      .unwrap()
      .then(() => {
        dispatch(fetchNotifications());
        const roomId = notification.related_room?.id || notification.related_community_room?.id;
        const roomType = notification.related_room ? 'chat' : 'community';
        if (notification.notification_type === 'chat' && roomId) {
          navigate(`/dashboard?section=${roomType}&roomId=${roomId}&roomType=${roomType}`);
        } else if (notification.notification_type === 'member_assigned' && role === 'trainer') {
          navigate('/trainer/dashboard');
        } else if (notification.notification_type === 'plan_expiring' && role === 'member') {
          navigate('/member/dashboard');
        }
      })
      .catch((err) => console.error('Failed to mark notification as read:', err));
  };

  const handleMarkAllRead = () => {
    const unreadNotificationIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadNotificationIds.length > 0) {
      dispatch(markNotificationsAsRead(unreadNotificationIds))
        .unwrap()
        .then(() => dispatch(fetchNotifications()))
        .catch((err) => console.error('Failed to mark all notifications as read:', err));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div style={{ backgroundColor: '#0c1427', minHeight: '100vh', padding: '20px' }}>
      <style>
        {`
          .notification-item:hover {
            background-color: #1a2a44 !important;
            cursor: pointer;
          }
          .notification-item {
            transition: background-color 0.2s ease;
          }
        `}
      </style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">
          <FaBell className="me-2" /> Notifications
        </h3>
        {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
          <Button
            variant="outline-info"
            size="sm"
            onClick={handleMarkAllRead}
            style={{ borderColor: '#0dcaf0', color: '#0dcaf0' }}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {status === 'loading' && (
        <div className="text-center mb-3">
          <Spinner animation="border" variant="light" />
          <p className="text-white mt-2">Loading notifications...</p>
        </div>
      )}

      {status === 'failed' && (
        <Alert variant="danger" className="mb-3">
          {error || 'Failed to load notifications'}
        </Alert>
      )}

      {status === 'succeeded' && notifications.length === 0 && (
        <p className="text-white">No notifications available.</p>
      )}

      {status === 'succeeded' && notifications.length > 0 && (
        <ListGroup>
          {notifications.map((notification) => (
            <ListGroup.Item
              key={notification.id}
              className="notification-item"
              style={{
                backgroundColor: notification.is_read ? '#101c36' : '#1a2a44',
                color: 'white',
                border: '1px solid #2a3b6a',
                borderRadius: '8px',
                marginBottom: '10px',
                padding: '15px',
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1" style={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                    {notification.content}
                  </p>
                  <small style={{ opacity: 0.7 }}>{formatDate(notification.created_at)}</small>
                </div>
                {!notification.is_read && (
                  <Badge bg="primary" pill>
                    New
                  </Badge>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default Notifications;


