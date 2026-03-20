import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Linking, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, UserX, Phone, MessageSquare, MapPin, Briefcase, UserCheck } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api from '../services/api';

export default function JobInterestedScreen() {
    const router = useRouter();
    const { jobId, jobTitle } = useLocalSearchParams();

    const [interested, setInterested] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [job, setJob] = useState(null);

    const fetchInterested = useCallback(async () => {
        try {
            const response = await api.get(`jobs/${jobId}/interested/`);
            setInterested(response.data);
            // Also fetch job details for title if not provided
            if (!jobTitle) {
                const jobResp = await api.get(`jobs/${jobId}/`);
                setJob(jobResp.data);
            }
        } catch (error) {
            console.error('Error fetching interested helpers:', error);
            Alert.alert('Error', 'Failed to load interested helpers.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [jobId, jobTitle]);

    useEffect(() => {
        fetchInterested();
    }, [fetchInterested]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInterested();
        setRefreshing(false);
    };

    const handleSelectHelper = async (helper) => {
        Alert.alert(
            'Select Helper',
            `Are you sure you want to select ${helper.username} for this job?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Select',
                    onPress: async () => {
                        try {
                            await api.post(`jobs/${jobId}/select_helper/`, { helper_id: helper.id });
                            Alert.alert('Success', `${helper.username} has been selected!`);
                            fetchInterested(); // Refresh to show selected state
                        } catch (error) {
                            console.error('Select helper error:', error);
                            Alert.alert('Error', error.response?.data?.detail || 'Failed to select helper.');
                        }
                    }
                }
            ]
        );
    };

    const handleCall = (phone) => {
        if (!phone) {
            Alert.alert('Error', 'Phone number not available.');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone, username) => {
        if (!phone) {
            Alert.alert('Error', 'Phone number not available.');
            return;
        }
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hi ${username}, I'm contacting you about my job posting on House Help.`);
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    };

    const renderHelper = ({ item }) => (
        <View style={[styles.helperCard, item.is_selected && styles.selectedCard]}>
            <View style={styles.helperHeader}>
                <View style={styles.avatar}>
                    {item.photo ? (
                        <RNImage source={{ uri: item.photo }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {(item.username?.[0] || '?').toUpperCase()}
                        </Text>
                    )}
                </View>

                <View style={styles.helperInfo}>
                    <Text style={styles.helperName}>
                        {item.first_name && item.last_name
                            ? `${item.first_name} ${item.last_name}`
                            : item.username}
                    </Text>
                    <View style={styles.metaGrid}>
                        {item.phone_number && (
                            <View style={styles.metaRow}>
                                <Phone size={12} color={Colors.textMuted} />
                                <Text style={styles.metaText}>{item.phone_number}</Text>
                            </View>
                        )}
                        {item.location && (
                            <View style={styles.metaRow}>
                                <MapPin size={12} color={Colors.textMuted} />
                                <Text style={styles.metaText}>{item.location}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {item.is_selected && (
                    <View style={styles.selectedBadge}>
                        <UserCheck size={16} color={Colors.secondary} />
                    </View>
                )}
            </View>

            {item.skills && (
                <View style={[styles.metaRow, { marginTop: 8, paddingHorizontal: 4 }]}>
                    <Briefcase size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>Skills: {item.skills}</Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity 
                    style={styles.viewProfileBtn}
                    onPress={() => router.push({ pathname: '/helper-profile', params: { username: item.username } })}
                >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>

                {item.is_selected ? (
                    <View style={styles.contactGroup}>
                        <TouchableOpacity 
                            style={[styles.smallContactBtn, styles.callBtn]} 
                            onPress={() => handleCall(item.phone_number)}
                        >
                            <Phone size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.smallContactBtn, styles.waBtn]} 
                            onPress={() => handleWhatsApp(item.phone_number, item.username)}
                        >
                            <MessageSquare size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.selectBtn}
                        onPress={() => handleSelectHelper(item)}
                    >
                        <Text style={styles.selectBtnText}>Select Helper</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.titleBlock}>
                    <Text style={styles.screenTitle}>Interested Helpers</Text>
                    <Text style={styles.screenSub} numberOfLines={1}>{jobTitle || job?.title}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={interested}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderHelper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <UserX size={48} color={Colors.border} />
                            <Text style={styles.emptyTitle}>No Helpers Yet</Text>
                            <Text style={styles.emptyText}>
                                No one has expressed interest in this job yet. Check back soon!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    screenSub: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    helperCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    selectedCard: {
        borderColor: Colors.secondary,
        backgroundColor: Colors.secondary + '05',
    },
    helperHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
    },
    helperInfo: {
        flex: 1,
    },
    helperName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    selectedBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.secondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 10,
    },
    viewProfileBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    viewProfileText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    contactGroup: {
        flex: 1.2,
        flexDirection: 'row',
        gap: 10,
    },
    smallContactBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callBtn: {
        backgroundColor: '#3B82F6',
    },
    waBtn: {
        backgroundColor: '#10B981',
    },
    selectBtn: {
        flex: 1.2,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    selectBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    emptyState: {
        paddingTop: 80,
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 22,
    },
});
