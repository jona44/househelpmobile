import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin, Phone, Briefcase, Star, ShieldCheck, MessageSquare, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api from '../services/api';

export default function HelperProfileScreen() {
    const router = useRouter();
    const { username } = useLocalSearchParams();
    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (username) {
            fetchProfile();
        }
    }, [username]);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`helpers/by_username/?username=${username}`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Failed to load helper profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone, name) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hi ${name}, I'm contacting you about a job on House Help.`);
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Profile not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnText}>
                    <Text style={{ color: Colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initials = (profile.first_name?.[0] || profile.user?.username?.[0] || '?').toUpperCase();
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.user?.username;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Helper Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.avatarLarge}>
                        {profile.photo ? (
                            <Image 
                                source={{ uri: profile.photo }} 
                                style={styles.avatarImageLarge} 
                            />
                        ) : (
                            <Text style={styles.avatarTextLarge}>{initials}</Text>
                        )}
                    </View>
                    <Text style={styles.profileName}>{fullName}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>Verified Helper</Text>
                        {profile.kyc_status === 'VERIFIED' && <ShieldCheck size={14} color="#fff" />}
                    </View>
                    
                    <View style={styles.contactFastActions}>
                        <TouchableOpacity 
                            style={[styles.fastActionBtn, { backgroundColor: '#3B82F6' }]}
                            onPress={() => handleCall(profile.phone_number)}
                        >
                            <Phone size={20} color="#fff" />
                            <Text style={styles.fastActionText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.fastActionBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => handleWhatsApp(profile.phone_number, fullName)}
                        >
                            <MessageSquare size={20} color="#fff" />
                            <Text style={styles.fastActionText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Star size={18} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.statVal}>{profile.average_rating || 0}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Briefcase size={18} color={Colors.primary} />
                            <Text style={styles.statVal}>{profile.experience || 'Not set'}</Text>
                            <Text style={styles.statLabel}>Experience</Text>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.bioText}>
                            {profile.bio || "No bio provided."}
                        </Text>
                    </View>
                </View>

                {/* Skills Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                        {(profile.skills || "").split(',').map((skill, idx) => (
                            <View key={idx} style={styles.skillBadge}>
                                <Text style={styles.skillText}>{skill.trim()}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.infoCard}>
                        {profile.date_of_birth && (
                            <>
                                <View style={styles.detailRow}>
                                    <User size={18} color={Colors.textMuted} />
                                    <Text style={styles.detailText}>Born on {new Date(profile.date_of_birth).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.dividerH} />
                            </>
                        )}
                        <View style={styles.detailRow}>
                            <MapPin size={18} color={Colors.textMuted} />
                            <Text style={styles.detailText}>
                                {profile.address && typeof profile.address === 'object' ? 
                                    [profile.address.suburb_name, profile.address.city_name].filter(Boolean).join(', ') : 
                                    (profile.address || profile.nationality || 'Location not set')
                                }
                            </Text>
                        </View>
                        <View style={styles.dividerH} />
                        <TouchableOpacity style={styles.detailRow} onPress={() => handleCall(profile.phone_number)}>
                            <Phone size={18} color={Colors.textMuted} />
                            <Text style={[styles.detailText, { color: Colors.primary }]}>{profile.phone_number || 'No contact info'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {profile.reviews && profile.reviews.length > 0 ? (
                        profile.reviews.map((rev) => (
                            <View key={rev.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerInfo}>
                                        <View style={styles.avatarSmall}>
                                            <Text style={styles.avatarSmallText}>{rev.reviewer_name?.[0]?.toUpperCase()}</Text>
                                        </View>
                                        <Text style={styles.reviewerName}>{rev.reviewer_name}</Text>
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
                                    <Text style={[styles.reviewComment, { fontStyle: 'italic', color: Colors.textMuted }]}>No comment left.</Text>
                                )}
                                <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.infoCard}>
                            <Text style={[styles.bioText, { textAlign: 'center', color: Colors.textMuted }]}>No reviews yet.</Text>
                        </View>
                    )}
                </View>
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
    headerCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary + '30',
        overflow: 'hidden',
    },
    avatarImageLarge: {
        width: '100%',
        height: '100%',
    },
    avatarTextLarge: {
        fontSize: 40,
        fontWeight: '800',
        color: Colors.primary,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 24,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    contactFastActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 24,
    },
    fastActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 48,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    fastActionText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statVal: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    dividerH: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
        fontWeight: '500',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    skillText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    reviewCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSmallText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewDate: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '500',
    },
});
