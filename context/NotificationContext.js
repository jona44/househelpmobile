import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { usePathname } from 'expo-router';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const pathname = usePathname();
    const pollInterval = useRef(null);
    const appState = useRef(AppState.currentState);

    const fetchNotifications = async () => {
        if (!user || loading) return;
        setLoading(true);
        try {
            const response = await api.get('notifications/');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        if (user) {
            fetchNotifications();
            pollInterval.current = setInterval(fetchNotifications, 30000); // 30s
        } else {
            setNotifications([]);
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [user]);

    // Refresh on screen focus (navigation)
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [pathname, user]);

    // Refresh when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                if (user) {
                    fetchNotifications();
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user]);

    const markAllAsRead = async () => {
        try {
            await api.post('notifications/read-all/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`notifications/${id}/read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.is_read).length;
    }, [notifications]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, markAsRead, fetchNotifications, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
