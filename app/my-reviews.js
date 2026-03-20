import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Star } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api from '../services/api';

export default function MyReviewsScreen() {
    const router = useRouter();
    const { username } = useLocalSearchParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (username) {
            fetchReviews();
        }
    }, [username]);

    const fetchReviews = async () => {
        try {
            const response = await api.get(`helpers/by_username/?username=${username}`);
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>My Reviews</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {reviews.length > 0 ? (
                    reviews.map((rev) => (
                        <View key={rev.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewerInfo}>
                                    <View style={styles.avatarSmall}>
                                        <Text style={styles.avatarSmallText}>
                                            {rev.reviewer_name?.[0]?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewerName}>{rev.reviewer_name || 'Anonymous'}</Text>
                                </View>
                                <View style={styles.reviewStars}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={12} 
                                            color={i < rev.rating ? '#F59E0B' : Colors.border} 
                                            fill={i < rev.rating ? '#F59E0B' : 'transparent'} 
                                        />
                                    ))}
                                </View>
                            </View>
                            {rev.comment ? (
                                <Text style={styles.reviewComment}>{rev.comment}</Text>
                            ) : (
                                <Text style={[styles.reviewComment, { fontStyle: 'italic', color: Colors.textMuted }]}>
                                    No comment left.
                                </Text>
                            )}
                            <Text style={styles.reviewDate}>
                                {new Date(rev.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No reviews yet.</Text>
                    </View>
                )}
            </ScrollView>
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
        backgroundColor: '#fff',
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
    scrollContent: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSmallText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
        marginBottom: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyStateText: {
        color: Colors.textMuted,
        fontWeight: '600',
        fontSize: 15,
    },
});
