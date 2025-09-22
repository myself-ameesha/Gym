// EnhancedNotificationPopup.jsx
import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { markNotificationsAsRead, fetchNotifications } from '../../features/notification/notificationSlice';

// Enhanced notification popup component with better animations and interactivity
const EnhancedNotificationPopup = ({ notification, onNavigate }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getNotificationIcon = (type) => {
    const iconClasses = "w-6 h-6 text-white drop-shadow-sm";
    
    switch (type) {
      case 'chat':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      case 'member_assigned':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        );
      case 'plan_expiring':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'community':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
          </svg>
        );
    }
  };

  const getGradientColors = (type) => {
    switch (type) {
      case 'chat':
        return 'from-blue-500 to-cyan-500';
      case 'member_assigned':
        return 'from-green-500 to-emerald-500';
      case 'plan_expiring':
        return 'from-orange-500 to-red-500';
      case 'community':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'chat': 'New Message',
      'member_assigned': 'Member Assigned',
      'plan_expiring': 'Plan Expiring',
      'community': 'Community Update',
    };
    return labels[type] || 'Notification';
  };

  const handleNotificationClick = async () => {
    try {
      // Mark as read first
      if (!notification.is_read) {
        await dispatch(markNotificationsAsRead([notification.id])).unwrap();
        dispatch(fetchNotifications());
      }

      // Get current user role from notification data or localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const role = currentUser.user_type;

      // Navigate based on notification type and user role
      const roomId = notification.related_room?.id || notification.related_community_room?.id;
      const roomType = notification.related_room ? 'chat' : 'community';

      let navigationPath = '/dashboard';

      switch (notification.notification_type) {
        case 'chat':
          if (roomId) {
            if (role === 'trainer') {
              navigationPath = `/Trainer/TrainerDashboard?section=community&roomId=${roomId}&roomType=${roomType}`;
            } else {
              navigationPath = `/MemberDashboard?section=chat&roomId=${roomId}&roomType=${roomType}`;
            }
          } else {
            navigationPath = role === 'trainer' 
              ? '/Trainer/TrainerDashboard?section=community'
              : '/MemberDashboard?section=chat';
          }
          break;

        case 'member_assigned':
          navigationPath = role === 'trainer' 
            ? '/Trainer/TrainerMembers'
            : '/MemberDashboard?section=trainer';
          break;

        case 'plan_expiring':
          navigationPath = role === 'member' 
            ? '/MemberDashboard?section=membership'
            : '/Trainer/TrainerDashboard?section=members';
          break;

        case 'community':
          if (roomId) {
            navigationPath = role === 'trainer'
              ? `/Trainer/TrainerDashboard?section=community&roomId=${roomId}&roomType=community`
              : `/MemberDashboard?section=chat&roomId=${roomId}&roomType=community`;
          } else {
            navigationPath = role === 'trainer'
              ? '/Trainer/TrainerDashboard?section=community'
              : '/MemberDashboard?section=chat';
          }
          break;

        default:
          navigationPath = role === 'trainer' 
            ? '/Trainer/TrainerDashboard'
            : '/MemberDashboard';
          break;
      }

      console.log('Navigating to:', navigationPath);
      navigate(navigationPath);
      
      // Close toast after navigation
      toast.dismiss();
      
      // Show brief success feedback
      setTimeout(() => {
        toast.success('Opening notification...', {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
          style: {
            background: '#10B981',
            color: 'white',
            borderRadius: '8px',
          }
        });
      }, 100);

      if (onNavigate) {
        onNavigate(notification);
      }

    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to open notification. Please try again.', {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div 
      onClick={handleNotificationClick}
      className="enhanced-notification-popup"
      style={{
        cursor: 'pointer',
        padding: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: 'translateY(0)',
      }}
    >
      {/* Animated background gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${getGradientColors(notification.notification_type)} opacity-10 transition-opacity duration-300`}
        style={{
          background: `linear-gradient(45deg, ${getGradientColors(notification.notification_type).includes('blue') ? '#3B82F6, #06B6D4' : 
            getGradientColors(notification.notification_type).includes('green') ? '#10B981, #059669' :
            getGradientColors(notification.notification_type).includes('orange') ? '#F59E0B, #EF4444' :
            getGradientColors(notification.notification_type).includes('purple') ? '#8B5CF6, #EC4899' :
            '#6B7280, #475569'})`,
          opacity: 0.1,
        }}
      />

      <div className="flex items-start space-x-4 relative z-10">
        <div className="flex-shrink-0">
          <div className={`w-14 h-14 bg-gradient-to-br ${getGradientColors(notification.notification_type)} rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110`}>
            {getNotificationIcon(notification.notification_type)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-gray-800 shadow-sm border border-gray-200">
              {getTypeLabel(notification.notification_type)}
            </span>
            <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
          
          <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 leading-relaxed">
            {notification.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Click to view details</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-xs text-green-600 font-bold uppercase tracking-wide">New</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700 ease-out pointer-events-none" />
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-30 transition-opacity duration-300" style={{ 
        background: 'linear-gradient(45deg, transparent, transparent), linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899)',
        backgroundClip: 'padding-box, border-box',
      }} />

      <style jsx>{`
        .enhanced-notification-popup:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 12px 24px rgba(0,0,0,0.15);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        .enhanced-notification-popup {
          animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
};

// Enhanced notification display function with better error handling
export const showEnhancedNotification = (notification, navigate, dispatch) => {
  // Validate notification data
  if (!notification || !notification.id || !notification.content) {
    console.warn('Invalid notification data:', notification);
    return;
  }

  // Show the enhanced toast notification
  toast(
    <EnhancedNotificationPopup 
      notification={notification} 
      onNavigate={(notif) => {
        console.log('Notification clicked and navigated:', notif.content);
      }}
    />, 
    {
      position: "top-right",
      autoClose: 8000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      className: 'enhanced-notification-toast',
      bodyClassName: 'p-0',
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: '8px',
        minWidth: '380px',
        maxWidth: '480px',
      },
    }
  );

  // Play notification sound (optional)
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio play errors (browser restrictions)
    });
  } catch (error) {
    // Ignore audio errors
  }
};

// CSS styles for the enhanced notification system
export const enhancedNotificationStyles = `
  .enhanced-notification-toast {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }

  .enhanced-notification-toast .Toastify__toast-body {
    padding: 0 !important;
    margin: 0 !important;
  }

  .enhanced-notification-toast .Toastify__close-button {
    display: none !important;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .enhanced-notification-toast {
      margin: 0 8px !important;
      max-width: calc(100vw - 32px) !important;
      min-width: calc(100vw - 32px) !important;
    }
    
    .enhanced-notification-popup {
      padding: 16px !important;
    }
    
    .enhanced-notification-popup .w-14 {
      width: 48px !important;
      height: 48px !important;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .enhanced-notification-popup {
      background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%) !important;
      border: 1px solid rgba(75, 85, 99, 0.3) !important;
    }
    
    .enhanced-notification-popup .text-gray-900 {
      color: rgb(243, 244, 246) !important;
    }
    
    .enhanced-notification-popup .text-gray-600 {
      color: rgb(156, 163, 175) !important;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .enhanced-notification-popup {
      animation: none !important;
      transition: none !important;
    }
    
    .enhanced-notification-popup:hover {
      transform: none !important;
    }
  }
`;

export default EnhancedNotificationPopup;