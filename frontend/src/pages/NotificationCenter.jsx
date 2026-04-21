import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationCenter Page
 * Full notification management interface
 * Features:
 * - View all notifications (paginated)
 * - Filter by type
 * - Search functionality
 * - Mark as read/delete
 * - Bulk actions (mark all read, delete all)
 */
const NotificationCenter = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const notificationTypes = [
    { value: 'all', label: 'All Notifications' },
    { value: 'quotation', label: 'Quotations' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'deadline', label: 'Deadlines' },
    { value: 'approval', label: 'Approvals' },
    { value: 'subscription', label: 'Subscriptions' }
  ];

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        limit: pageSize,
        page
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await axios.get(
        `http://localhost:5001/api/notifications/my?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
      console.error('[NOTIFICATION-CENTER] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, filterType, page]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error('[NOTIFICATION-CENTER] Error marking as read:', err.message);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await axios.delete(
          `http://localhost:5001/api/notifications/${notificationId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        fetchNotifications();
      } catch (err) {
        console.error('[NOTIFICATION-CENTER] Error deleting:', err.message);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(
        'http://localhost:5001/api/notifications/read-all',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error('[NOTIFICATION-CENTER] Error marking all as read:', err.message);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      try {
        await axios.delete(
          'http://localhost:5001/api/notifications/clear-all',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setNotifications([]);
        setUnreadCount(0);
      } catch (err) {
        console.error('[NOTIFICATION-CENTER] Error clearing all:', err.message);
      }
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getNotificationTypeLabel = (type) => {
    const label = notificationTypes.find(t => t.value === type);
    return label?.label || type;
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-icons" style={{ fontSize: '32px', color: '#2563eb' }}>
            notifications_active
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Notifications</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#374151',
            fontWeight: '500'
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          Back to Dashboard
        </button>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {notificationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Actions */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Mark All Read
          </button>
        )}

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '10px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #fecaca'
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'inline-block', fontSize: '14px', color: '#6b7280' }}>
            Loading notifications...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <span className="material-icons" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '12px' }}>
            notifications_none
          </span>
          <p style={{ color: '#6b7280', margin: '12px 0 0 0' }}>
            {searchTerm
              ? 'No notifications match your search'
              : filterType !== 'all'
              ? `No ${filterType} notifications`
              : 'All caught up! No notifications yet'}
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && filteredNotifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map(notification => (
            <div
              key={notification._id}
              style={{
                background: notification.isRead ? 'white' : '#f0f9ff',
                border: `1px solid ${notification.isRead ? '#e5e7eb' : '#bfdbfe'}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'all 0.2s'
              }}
            >
              {/* Icon */}
              <div
                style={{
                  background: getNotificationColor(notification.type),
                  borderRadius: '8px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: '20px',
                    color: 'white'
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          background: getNotificationColor(notification.type),
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444'
                          }}
                        />
                      )}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#111827',
                        fontWeight: notification.isRead ? '400' : '600',
                        lineHeight: '1.5',
                        marginBottom: '8px'
                      }}
                    >
                      {notification.message}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
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
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification._id)}
                    title="Mark as read"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#2563eb',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '20px' }}>
                      check
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notification._id)}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredNotifications.length > 0 && (
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: page === 1 ? '#f3f4f6' : 'white',
              cursor: page === 1 ? 'default' : 'pointer',
              color: page === 1 ? '#9ca3af' : '#374151',
              fontSize: '14px'
            }}
          >
            Previous
          </button>

          <span
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            Page {page}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={filteredNotifications.length < pageSize}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: filteredNotifications.length < pageSize ? '#f3f4f6' : 'white',
              cursor: filteredNotifications.length < pageSize ? 'default' : 'pointer',
              color: filteredNotifications.length < pageSize ? '#9ca3af' : '#374151',
              fontSize: '14px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
