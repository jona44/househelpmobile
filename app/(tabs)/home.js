import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Plus, Search, MapPin, Star, Bell, User, ChevronRight } from 'lucide-react-native';
import JobCard from '../../components/JobCard';
import JobSkeleton from '../../components/JobSkeleton';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useRouter } from 'expo-router';
import api from '../../services/api';


export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { unreadCount } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recentJobs, setRecentJobs] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    const isHousewife = user?.type === 'housewife';
    const isProfileIncomplete = isHousewife && (!user?.profile?.first_name || !user?.profile?.phone_number || !user?.profile?.address?.city);

    const userType = user?.type || 'housewife';
    const userName = user?.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name?.charAt(0)}.`
        : (user?.username || 'Guest');

    const fetchJobs = async () => {
        try {
            const response = await api.get('jobs/');
            // filter for housewife's own jobs, or show active interests for helpers
            if (userType === 'housewife' && user?.id) {
                const myJobs = response.data.filter(j => 
                    j.posted_by?.id === user.id && 
                    j.status !== 'CANCELLED'
                );
                setRecentJobs(myJobs.slice(0, 3));
            } else if (userType === 'helper' && user?.id) {
                const myInterests = response.data.filter(j => 
                    (j.status === 'OPEN' || j.status === 'IN_PROGRESS') &&
                    j.interested_helpers?.includes(user.id)
                );
                setRecentJobs(myInterests.slice(0, 3));
            } else {
                setRecentJobs(response.data.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching jobs', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEdit = (job) => {
        router.push({ pathname: '/post-job', params: { jobId: job.id } });
    };

    const handleCancel = (job) => {
        Alert.alert(
            'Cancel Job',
            'Are you sure you want to cancel this job? You will be refunded 1 credit.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingId(job.id);
                            await api.post(`jobs/${job.id}/cancel/`);
                            Alert.alert('Cancelled', 'Job has been cancelled and credit refunded.');
                            fetchJobs();
                        } catch (error) {
                            console.error('Cancel error:', error);
                            Alert.alert('Error', 'Failed to cancel job.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleComplete = async (job) => {
        Alert.alert(
            'Complete Job',
            'Has this job been finished successfully?',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes, Finished', 
                    onPress: async () => {
                        try {
                            setProcessingId(job.id);
                            await api.post(`jobs/${job.id}/complete/`);
                            Alert.alert('Success', 'Job marked as completed. Please leave a review for the helper.');
                            fetchJobs();
                        } catch (error) {
                            console.error('Complete job error:', error);
                            Alert.alert('Error', 'Failed to mark job as completed.');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleReview = (job) => {
        router.push({
            pathname: '/submit-review',
            params: { 
                jobId: job.id, 
                jobTitle: job.title,
                helperName: job.accepted_by?.username || 'Helper'
            }
        });
    };

    const handleViewReview = (job) => {
        if (job.review) {
            Alert.alert(`Review for ${job.accepted_by?.username}`, `${'★'.repeat(job.review.rating)}${'☆'.repeat(5 - job.review.rating)}\n\n${job.review.comment}`);
        } else {
            Alert.alert('Review Details', 'Review data not available.');
        }
    };

    const handleExpressInterest = (job) => {
        Alert.alert(
            'Express Interest',
            `Apply for "${job.title}"?\n\nThis will use 1 credit from your account.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Apply (1 credit)',
                    onPress: async () => {
                        try {
                            setProcessingId(job.id);
                            const res = await api.post(`jobs/${job.id}/interest/`);
                            const remaining = res.data.credits_remaining ?? '';
                            Alert.alert(
                                '✅ Applied!',
                                `You've expressed interest in "${job.title}". 1 credit used${remaining !== '' ? ` — ${remaining} remaining` : ''}.`
                            );
                            if (refreshUser) refreshUser();
                            fetchJobs();
                        } catch (error) {
                            const msg = error.response?.data?.error || 'Failed to apply for job.';
                            Alert.alert('Error', msg);
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleWithdrawInterest = (job) => {
        Alert.alert(
            'Withdraw Interest',
            `Withdraw your application for "${job.title}"?\n\nYou will be refunded 1 credit.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Withdraw',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`jobs/${job.id}/withdraw/`);
                            Alert.alert('Withdrawn', 'Interest withdrawn. 1 credit refunded.');
                            fetchJobs();
                        } catch (error) {
                            const msg = error.response?.data?.error || 'Failed to withdraw interest.';
                            Alert.alert('Error', msg);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (user) fetchJobs();
        else setLoading(false);
    }, [user, userType]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Image
                            source={require('../../assets/applogo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{userName}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
                        <Bell size={24} color={Colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profile Incomplete Banner */}
                {isProfileIncomplete && (
                    <TouchableOpacity 
                        style={styles.incompleteBanner} 
                        onPress={() => router.push('/edit-profile')}
                    >
                        <View style={styles.bannerIcon}>
                            <User size={20} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerTitle}>Complete Your Profile</Text>
                            <Text style={styles.bannerSubtitle}>Finish setup to start posting jobs.</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.primary} />
                    </TouchableOpacity>
                )}

                {/* Hero Section */}
                <View style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>
                            {userType === 'housewife' ? 'Find the Perfect Helper' : 'Find Your Next Job'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {userType === 'housewife' ? 'Post a job and get responses in minutes.' : 'Join thousands of helpers across South Africa.'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.heroBtn, { backgroundColor: userType === 'housewife' ? Colors.primary : Colors.secondary }]}
                            onPress={() => router.push(userType === 'housewife' ? '/post-job' : '/(tabs)/jobs')}
                        >
                            <Text style={styles.heroBtnText}>
                                {userType === 'housewife' ? 'Post a New Job' : 'Browse Available Jobs'}
                            </Text>
                            {userType === 'housewife' ? <Plus size={18} color="#fff" /> : <Search size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Action Grid (Secondary Actions) */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity 
                        style={styles.actionItem}
                        onPress={() => {
                            if (userType === 'helper' && user?.username) {
                                router.push({ pathname: '/my-reviews', params: { username: user.username } });
                            } else {
                                Alert.alert('Reviews', 'You can leave reviews when jobs are completed.');
                            }
                        }}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                            <Star size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Reviews</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/credits')}>
                        <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
                            <Text style={{ fontSize: 18 }}>💎</Text>
                        </View>
                        <Text style={styles.actionLabel}>Credits</Text>
                    </TouchableOpacity>

                </View>

                {/* Job List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {userType === 'housewife' ? 'Your Recent Postings' : 'Active Interests'}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentJobs.length > 0 ? (
                    recentJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onPress={() => {}}
                            isOwner={userType === 'housewife' && job.posted_by?.id === user?.id}
                            isHelper={userType === 'helper'}
                            currentUserId={user?.id}
                            onViewInterested={(job) => router.push({ pathname: '/job-interested', params: { jobId: job.id, jobTitle: job.title } })}
                            onEdit={handleEdit}
                            onCancel={handleCancel}
                            onComplete={handleComplete}
                            onReview={handleReview}
                            onViewReview={handleViewReview}
                            onExpressInterest={handleExpressInterest}
                            onWithdrawInterest={handleWithdrawInterest}
                            busy={processingId === job.id}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No active jobs found.</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}><Text style={styles.emptyStateLink}>Get Started</Text></TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 20,
    },
    incompleteBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10', // Light primary
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
    },
    bannerSubtitle: {
        fontSize: 13,
        color: Colors.text,
        opacity: 0.7,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 120,
        height: 40,
        marginBottom: 8,
        marginLeft: -4,
    },
    greeting: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        backgroundColor: Colors.error,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeCount: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        lineHeight: 14,
    },
    heroCard: {
        backgroundColor: '#1E1B4B', // Dark Indigo
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 20,
        lineHeight: 20,
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 100,
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    heroBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionItem: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    viewAll: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border,
    },
    emptyStateText: {
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyStateLink: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
