import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Star, MessageSquare } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api from '../services/api';

export default function SubmitReviewScreen() {
    const router = useRouter();
    const { jobId, jobTitle, helperName } = useLocalSearchParams();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Selection Required', 'Please select a star rating.');
            return;
        }

        setLoading(true);
        try {
            await api.post('reviews/', {
                job_id: jobId,
                rating: rating,
                comment: comment
            });
            Alert.alert('Success', 'Thank you for your review!');
            router.back();
        } catch (error) {
            console.error('Submit review error:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Review Helper</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.jobTitle}>{jobTitle}</Text>
                    <Text style={styles.helperSub}>Rate your experience with {helperName}</Text>
                </View>

                <View style={styles.ratingSection}>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity 
                                key={star} 
                                onPress={() => setRating(star)}
                                style={styles.starBtn}
                            >
                                <Star 
                                    size={40} 
                                    color={star <= rating ? '#F59E0B' : Colors.border} 
                                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.ratingLabel}>
                        {rating === 1 ? 'Poor' :
                         rating === 2 ? 'Fair' :
                         rating === 3 ? 'Good' :
                         rating === 4 ? 'Very Good' :
                         rating === 5 ? 'Excellent' : 'Tap to rate'}
                    </Text>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>Your Feedback (Optional)</Text>
                    <View style={styles.inputWrapper}>
                        <MessageSquare size={20} color={Colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Share your experience working with this helper..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, (loading || rating === 0) && styles.disabledBtn]} 
                    onPress={handleSubmit}
                    disabled={loading || rating === 0}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
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
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    helperSub: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    starBtn: {
        padding: 4,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },
    inputSection: {
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        minHeight: 120,
    },
    inputIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
        paddingTop: 0,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
