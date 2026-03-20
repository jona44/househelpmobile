import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Bell, ChevronLeft, Briefcase, Star, Info } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, markAllAsRead, markAsRead, fetchNotifications, loading } = useNotifications();

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
            // Optional: mark all as read when opening
            markAllAsRead();
        }, [])
    );

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
                <Text style={styles.body}>{item.body}</Text>
            </View>
        </TouchableOpacity>
    );

    const getIcon = (type) => {
        switch (type) {
            case 'job': return <Briefcase size={20} color={Colors.primary} />;
            case 'review': return <Star size={20} color="#F59E0B" />;
            case 'interest': return <Bell size={20} color={Colors.secondary} />;
            default: return <Info size={20} color={Colors.textMuted} />;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'job': return Colors.primaryLight;
            case 'review': return '#FEF3C7';
            case 'interest': return Colors.secondaryLight;
            default: return '#F3F4F6';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={fetchNotifications} 
                        colors={[Colors.primary]} 
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Bell size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No notifications yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    unreadCard: {
        backgroundColor: Colors.primaryLight + '20', // subtle tint
        borderColor: Colors.primary + '30',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    body: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '600',
    },
});
