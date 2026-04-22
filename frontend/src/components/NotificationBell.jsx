import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * NotificationBell Component
 * Displays notification count in header and dropdown with recent notifications
 * Features:
 * - Real-time unread count
 * - Dropdown with last 5 notifications
 * - Mark as read on click
 * - Deep links to resources
 * - Auto-refresh every 30 seconds
 */
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo'));
  } catch (error) {
    userInfo = null;
  }
  const token = userInfo?.token;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/notifications/my?unreadOnly=true&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = response.data;
      setNotifications(data.notifications || []);

      // Fetch unread count separately
      const countResponse = await axios.get(
        `${API_URL}/api/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnreadCount(countResponse.data.unreadCount || 0);
    } catch (error) {
      console.error('[NOTIFICATION-BELL] Error fetching notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.patch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error('[NOTIFICATION-BELL] Error marking as read:', error.message);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      quotation: 'receipt',
      consultant: 'person',
      deadline: 'schedule',
      approval: 'check_circle',
      subscription: 'card_membership'
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type) => {
    const colors = {
      quotation: '#2563eb',
      consultant: '#7c3aed',
      deadline: '#f59e0b',
      approval: '#10b981',
      subscription: '#ef4444'
    };
    return colors[type] || '#2563eb';
  };

  const getNotificationBgColor = (type) => {
    const colors = {
      quotation: '#eff6ff',
      consultant: '#faf5ff',
      deadline: '#fffbeb',
      approval: '#ecfdf5',
      subscription: '#fef2f2'
    };
    return colors[type] || '#f3f4f6';
  };

  if (!token) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Icon Button */}
      <button
        ref={bellRef}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={`${unreadCount} unread notifications`}
      >
        <span
          className="material-icons"
          style={{
            fontSize: '24px',
            color: '#374151'
          }}
        >
          notifications
        </span>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid white'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            width: '380px',
            maxHeight: '500px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Notifications
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: '#6b7280',
                background: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {unreadCount} new
            </span>
          </div>

          {/* Notifications List */}
          <div style={{ overflow: 'auto', maxHeight: '350px' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}
              >
                <span className="material-icons" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
                  notifications_none
                </span>
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    background: notification.isRead ? 'white' : getNotificationBgColor(notification.type),
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    if (!notification.isRead) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!notification.isRead) {
                      e.currentTarget.style.background = getNotificationBgColor(notification.type);
                    }
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      background: getNotificationColor(notification.type),
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{
                        fontSize: '16px',
                        color: 'white'
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        fontWeight: notification.isRead ? '400' : '600',
                        color: '#111827',
                        lineHeight: '1.4'
                      }}
                    >
                      {notification.message}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#9ca3af'
                      }}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2563eb',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Mark as read"
                    >
                      <span className="material-icons" style={{ fontSize: '18px' }}>
                        check
                      </span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}
          >
            <a
              href="/notification-center"
              style={{
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: '500',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              View all notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
