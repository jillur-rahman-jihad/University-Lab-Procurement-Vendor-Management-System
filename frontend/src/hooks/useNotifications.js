import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useNotifications Hook
 * Handles notification polling and state management
 * 
 * Features:
 * - Auto-refresh notifications every 30 seconds
 * - Get unread count
 * - Mark as read/delete notifications
 * - Loading and error states
 * - Configurable polling interval
 */
export const useNotifications = (options = {}) => {
  const {
    pollInterval = 30000, // 30 seconds default
    enabled = true,
    limit = 20,
    page = 1
  } = options;

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const token = userInfo?.token;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:5001/api/notifications/my?limit=${limit}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotifications(response.data.notifications || []);
      
      // Fetch unread count
      const countResponse = await axios.get(
        'http://localhost:5001/api/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnreadCount(countResponse.data.unreadCount || 0);
    } catch (err) {
      console.error('[useNotifications] Error fetching:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [token, enabled, limit, page]);

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !enabled) return;

    try {
      const response = await axios.get(
        'http://localhost:5001/api/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('[useNotifications] Error fetching unread count:', err.message);
    }
  }, [token, enabled]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Fetch updated count
      fetchUnreadCount();
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err.message);
    }
  }, [token, fetchUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch(
        'http://localhost:5001/api/notifications/read-all',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err.message);
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:5001/api/notifications/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.filter(n => n._id !== notificationId)
      );
      fetchUnreadCount();
    } catch (err) {
      console.error('[useNotifications] Error deleting:', err.message);
    }
  }, [token, fetchUnreadCount]);

  // Delete all notifications
  const clearAll = useCallback(async () => {
    try {
      await axios.delete(
        'http://localhost:5001/api/notifications/clear-all',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error clearing all:', err.message);
    }
  }, [token]);

  // Auto-refresh setup
  useEffect(() => {
    if (!enabled || !token) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchUnreadCount(); // Lightweight check on each poll
      // Full fetch less frequently
      if (Math.random() < 0.3) {
        fetchNotifications();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, token, pollInterval, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications
  };
};

export default useNotifications;
