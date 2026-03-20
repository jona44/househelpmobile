import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { User, Settings, CreditCard, ShieldCheck, LogOut, ChevronRight, MapPin, Phone, Star } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]);
    };

    if (!user) return null;

    const displayUser = {
        name: user.profile?.first_name ? `${user.profile.first_name} ${user.profile.last_name}` : user.username,
        email: user.email,
        phone: user.profile?.phone_number || 'No phone set',
        type: user.type === 'housewife' ? 'Housewife' : 'Helper',
        address: user.profile?.address && typeof user.profile.address === 'object' ? 
            [user.profile.address.suburb_name, user.profile.address.city_name].filter(Boolean).join(', ') : 
            (user.profile?.address || 'No address set'),
        credits: user.job_credits || 0,
        isVerified: user.profile?.kyc_status === 'VERIFIED',
        kycStatus: user.profile?.kyc_status || 'UNVERIFIED',
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            {user.profile?.photo ? (
                                <Image 
                                    source={{ uri: user.profile.photo }} 
                                    style={styles.avatarImage} 
                                />
                            ) : (
                                <Text style={styles.avatarInitials}>{displayUser.name[0]?.toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{displayUser.name}</Text>
                            <Text style={styles.userRole}>{displayUser.type}</Text>
                            {displayUser.isVerified && (
                                <View style={styles.badge}>
                                    <ShieldCheck size={12} color={Colors.primary} />
                                    <Text style={styles.badgeText}>Verified</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.editBtn} 
                        onPress={() => router.push('/edit-profile')}
                    >
                        <Settings size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{displayUser.credits}</Text>
                        <Text style={styles.statLabel}>Credits 💎</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>
                            {user.type === 'housewife' ? (user.profile?.jobs_posted_count || 0) : (user.profile?.jobs_completed_count || 0)}
                        </Text>
                        <Text style={styles.statLabel}>
                            {user.type === 'housewife' ? 'Jobs Posted' : 'Jobs Done'}
                        </Text>
                    </View>
                    {user.type === 'helper' && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={styles.statVal}>{user.profile?.average_rating || 0}</Text>
                                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                </View>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Contact Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact & Address</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Phone size={18} color={Colors.textMuted} />
                            <Text style={styles.infoText}>{displayUser.phone}</Text>
                        </View>
                        <View style={styles.dividerH} />
                        <View style={styles.infoRow}>
                            <MapPin size={18} color={Colors.textMuted} />
                            <Text style={styles.infoText} numberOfLines={2}>{displayUser.address}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <MenuItem icon={<CreditCard size={20} color={Colors.text} />} label="Billing & Payments" onPress={() => router.push('/credits')} />
                    {user.type === 'helper' && (
                        <MenuItem
                            icon={<ShieldCheck size={20} color={Colors.text} />}
                            label="Verify Identity"
                            onPress={() => router.push('/kyc')}
                            badge={displayUser.kycStatus}
                        />
                    )}
                    <MenuItem icon={<LogOut size={20} color={Colors.error} />} label="Logout" onPress={handleLogout} isDecline />
                </View>

                <Text style={styles.version}>House Help Mobile v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function MenuItem({ icon, label, onPress, isDecline, badge }) {
    const badgeColors = {
        VERIFIED: { bg: '#ECFDF5', text: '#059669' },
        PENDING: { bg: '#FEF3C7', text: '#D97706' },
        UNVERIFIED: { bg: '#F3F4F6', text: '#6B7280' },
        REJECTED: { bg: '#FEF2F2', text: '#EF4444' },
    };
    const badgeLabels = {
        VERIFIED: 'Verified',
        PENDING: 'Pending',
        UNVERIFIED: 'Unverified',
        REJECTED: 'Rejected',
    };
    const bc = badge ? (badgeColors[badge] || badgeColors.UNVERIFIED) : null;
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                {icon}
                <Text style={[styles.menuLabel, isDecline && { color: Colors.error }]}>{label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {badge && bc && (
                    <View style={[styles.kycBadge, { backgroundColor: bc.bg }]}>
                        <Text style={[styles.kycBadgeText, { color: bc.text }]}>{badgeLabels[badge] || badge}</Text>
                    </View>
                )}
                <ChevronRight size={18} color={Colors.border} />
            </View>
        </TouchableOpacity>
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
    profileCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitials: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
    },
    userInfo: {
        gap: 2,
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    userRole: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    editBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statVal: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 40,
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
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    menuSection: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 40,
    },
    kycBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    kycBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
