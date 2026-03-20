import React, { useState, useEffect } from 'react'; // Re-bundle trigger
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    RefreshControl, 
    Alert, 
    Modal, 
    ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Search, SlidersHorizontal, Plus, X } from 'lucide-react-native';
import JobCard from '../../components/JobCard';
import JobSkeleton from '../../components/JobSkeleton';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const CATEGORIES = ['All', 'Cleaning', 'Cooking', 'Babysitting', 'Laundry', 'Other'];

export default function JobsScreen() {

    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    const isHousewife = user?.type === 'housewife';

    const fetchJobs = async () => {
        try {
            const response = await api.get('jobs/');
            if (isHousewife) {
                // Housewives see their own non-cancelled jobs
                const filtered = response.data.filter(j =>
                    j.posted_by?.id === user.id &&
                    j.status !== 'CANCELLED'
                );
                setJobs(filtered);
            } else {
                // Helpers see ALL open jobs
                const openJobs = response.data.filter(j => j.status === 'OPEN');
                setJobs(openJobs);
            }
        } catch (error) {
            console.error('Error fetching jobs', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) fetchJobs();
        else setLoading(false);
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    // ── Housewife actions ──────────────────────────────────────────────────
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
            Alert.alert(
                `Review for ${job.accepted_by?.username}`,
                `${'★'.repeat(job.review.rating)}${'☆'.repeat(5 - job.review.rating)}\n\n${job.review.comment}`
            );
        } else {
            Alert.alert('Review Details', 'Review data not available.');
        }
    };

    // ── Helper actions ─────────────────────────────────────────────────────
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
                            setProcessingId(job.id);
                            const res = await api.post(`jobs/${job.id}/withdraw/`);
                            const remaining = res.data.credits_remaining ?? '';
                            Alert.alert(
                                'Withdrawn',
                                `Interest withdrawn${remaining !== '' ? `. 1 credit refunded — ${remaining} remaining` : ''}.`
                            );
                            if (refreshUser) refreshUser();
                            fetchJobs();
                        } catch (error) {
                            const msg = error.response?.data?.error || 'Failed to withdraw interest.';
                            Alert.alert('Error', msg);
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    // ── Filtering ──────────────────────────────────────────────────────────
    const filteredJobs = jobs.filter(job => {
        const matchSearch =
            job.title.toLowerCase().includes(search.toLowerCase()) ||
            job.description?.toLowerCase().includes(search.toLowerCase()) ||
            job.category?.toLowerCase().includes(search.toLowerCase());

        const matchCategory =
            activeCategory === 'All' ||
            job.category?.toLowerCase() === activeCategory.toLowerCase();

        const price = parseFloat(job.remuneration) || 0;
        const matchMin = minPrice === '' || price >= parseFloat(minPrice);
        const matchMax = maxPrice === '' || price <= parseFloat(maxPrice);

        return matchSearch && matchCategory && matchMin && matchMax;
    });

    const resetFilters = () => {
        setActiveCategory('All');
        setMinPrice('');
        setMaxPrice('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Search size={20} color={Colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search jobs..."
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.filterBtn, (activeCategory !== 'All' || minPrice || maxPrice) && styles.filterBtnActive]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <SlidersHorizontal size={20} color={(activeCategory !== 'All' || minPrice || maxPrice) ? '#fff' : Colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Filter Modal */}
                <Modal
                    visible={isFilterVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsFilterVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filter Jobs</Text>
                                <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                    <X size={24} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.filterLabel}>Category</Text>
                                <View style={styles.categoryGrid}>
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
                                            onPress={() => setActiveCategory(cat)}
                                        >
                                            <Text style={[styles.catPillText, activeCategory === cat && styles.catPillTextActive]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.filterLabel}>Price Range (R)</Text>
                                <View style={styles.priceRow}>
                                    <View style={styles.priceInputBox}>
                                        <Text style={styles.pricePrefix}>Min</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            placeholder="0"
                                            keyboardType="numeric"
                                            value={minPrice}
                                            onChangeText={setMinPrice}
                                        />
                                    </View>
                                    <View style={styles.priceInputBox}>
                                        <Text style={styles.pricePrefix}>Max</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            placeholder="Any"
                                            keyboardType="numeric"
                                            value={maxPrice}
                                            onChangeText={setMaxPrice}
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                                        <Text style={styles.resetBtnText}>Reset All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.applyBtn} 
                                        onPress={() => setIsFilterVisible(false)}
                                    >
                                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {loading ? (
                    <View style={{ gap: 12 }}>
                        <JobSkeleton />
                        <JobSkeleton />
                        <JobSkeleton />
                        <JobSkeleton />
                        <JobSkeleton />
                    </View>
                ) : (
                    <FlatList
                        data={filteredJobs}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <JobCard
                                job={item}
                                onPress={() => {}}
                                isOwner={isHousewife && item.posted_by?.id === user?.id}
                                isHelper={!isHousewife}
                                currentUserId={user?.id}
                                busy={processingId === item.id}
                                onViewInterested={(job) => router.push({ pathname: '/job-interested', params: { jobId: job.id, jobTitle: job.title } })}
                                onEdit={handleEdit}
                                onCancel={handleCancel}
                                onComplete={handleComplete}
                                onReview={handleReview}
                                onViewReview={handleViewReview}
                                onExpressInterest={handleExpressInterest}
                                onWithdrawInterest={handleWithdrawInterest}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {search || activeCategory !== 'All' || minPrice || maxPrice
                                        ? 'No jobs match your filters.'
                                        : isHousewife
                                            ? 'No active jobs. Post your first job!'
                                            : 'No open jobs available right now.'}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* FAB for Housewives */}
                {isHousewife && (
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => router.push('/post-job')}
                    >
                        <Plus size={28} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 52,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
        fontFamily: 'PlusJakartaSans-Regular',
    },
    filterBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoriesRow: {
        marginBottom: 20,
        flexGrow: 0,
    },
    categoriesContent: {
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textMuted,
    },
    pillTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingBottom: 80,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        color: Colors.textMuted,
        fontWeight: '600',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
        marginTop: 8,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    catPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    catPillActive: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    catPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    catPillTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    priceInputBox: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
    },
    pricePrefix: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    priceInput: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 12,
    },
    resetBtn: {
        flex: 1,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    resetBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    applyBtn: {
        flex: 2,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: Colors.primary,
    },
    applyBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
});
