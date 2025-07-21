// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchNotifications, markNotificationsAsRead, addNotification } from '../../features/notification/notificationSlice';
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
//       // Fetch initial notifications
//       dispatch(fetchNotifications());

//       // Connect WebSocket
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
//     } else {
//         console.log('Waiting for currentUser or accessToken');
//       }
//     }, [dispatch, currentUser, accessToken]);

//   useEffect(() => {
//     // Calculate unread notifications count
//     const count = notifications.filter(n => !n.is_read).length;
//     setUnreadCount(count);
//   }, [notifications]);

//   const handleNotificationClick = (notification) => {
//     dispatch(markNotificationsAsRead([notification.id]))
//       .unwrap()
//       .then(() => {
//         dispatch(fetchNotifications()); // Refresh notifications
//         setUnreadCount(prev => Math.max(0, prev - 1));

//         // Navigate based on notification type
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
//       {/* Notification Bell Icon */}
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

//       {/* Notifications Dropdown */}
//       {anchorEl && (
//         <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
//           {unreadNotifications.length > 0 ? (
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
//           ) : (
//             <div className="px-4 py-3 text-gray-500 text-sm">No new notifications</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationList;


import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationsAsRead } from '../../features/notification/notificationSlice';
import { connectNotificationWebSocket, closeWebSocket } from '../../features/chat/chatApi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMember, currentTrainer, accessToken } = useSelector((state) => state.auth);
  const { notifications, status, error } = useSelector((state) => state.notifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

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

      const notificationSocket = connectNotificationWebSocket(
        currentUser.id,
        accessToken,
        dispatch,
        (notification) => {
          console.log('New notification received:', notification);
          toast.info(`New notification: ${notification.content}`);
        }
      );

      return () => {
        console.log('Closing notification WebSocket');
        closeWebSocket();
      };
    }
  }, [dispatch, currentUser?.id, accessToken]);

  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationsAsRead([notification.id]))
      .unwrap()
      .then(() => {
        dispatch(fetchNotifications());
        setUnreadCount(prev => Math.max(0, prev - 1));
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
      .catch(err => console.error('Failed to mark notification as read:', err));
  };

  const handleBellClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative flex items-center justify-center p-2 bg-gray-100 rounded-full hover:bg-gray-200"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
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
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {status === 'loading' && (
            <div className="px-4 py-3 text-gray-500 text-sm">Loading notifications...</div>
          )}
          {status === 'failed' && (
            <div className="px-4 py-3 text-red-500 text-sm">{error || 'Failed to load notifications'}</div>
          )}
          {status === 'succeeded' && unreadNotifications.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">No new notifications</div>
          )}
          {status === 'succeeded' && unreadNotifications.length > 0 && (
            unreadNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-2 cursor-pointer ${
                  !notification.is_read ? 'bg-gray-200 font-bold' : 'bg-white'
                } hover:bg-gray-300`}
              >
                <p className="text-sm">{notification.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationList;