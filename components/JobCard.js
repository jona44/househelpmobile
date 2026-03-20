import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { MapPin, Clock, Pencil, Trash2, Phone, MessageSquare, CheckCircle, Star, Hand, X, DollarSign, Tag } from 'lucide-react-native';

export default function JobCard({
    job,
    onPress,
    isOwner,
    isHelper,
    currentUserId,
    onViewInterested,
    onEdit,
    onCancel,
    onComplete,
    onReview,
    onViewReview,
    onExpressInterest,
    onWithdrawInterest,
    busy = false,
}) {
    const statusColor =
        job.status === 'OPEN' ? Colors.secondary :
        job.status === 'IN_PROGRESS' ? '#3B82F6' :
        job.status === 'COMPLETED' ? '#10B981' : Colors.textMuted;

    // Has the current helper already applied?
    const hasExpressedInterest = isHelper && Array.isArray(job.interested_helpers)
        ? job.interested_helpers.includes(currentUserId)
        : false;

    const handleCall = (phone) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone, title) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hi, I'm contacting you about the '${title}' job on House Help.`);
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    };

    const formatScheduledDate = (isoString) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-ZA', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return null;
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(job)} activeOpacity={0.7}>
            {/* Header row */}
            <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{job.status.replace('_', ' ')}</Text>
                </View>
                {job.remuneration ? (
                    <View style={styles.remunerationBadge}>
                        <DollarSign size={12} color={Colors.primary} />
                        <Text style={styles.remunerationText}>R{parseFloat(job.remuneration).toFixed(0)}</Text>
                    </View>
                ) : null}
            </View>

            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{job.description}</Text>

            <View style={styles.footer}>
                <View style={styles.meta}>
                    <MapPin size={16} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{job.location || 'No location'}</Text>
                </View>
                <View style={styles.meta}>
                    <Tag size={16} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{job.category || 'General'}</Text>
                </View>
            </View>

            {/* Scheduled date/time */}
            {job.scheduled_for && formatScheduledDate(job.scheduled_for) ? (
                <View style={styles.scheduledRow}>
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.scheduledText}>
                        {formatScheduledDate(job.scheduled_for)}
                    </Text>
                </View>
            ) : null}

            {/* Full address shown for IN_PROGRESS jobs */}
            {job.status === 'IN_PROGRESS' && job.full_address && (
                <View style={styles.addressSection}>
                    <MapPin size={14} color={Colors.primary} />
                    <Text style={styles.addressText}>
                        {[
                            job.full_address.house_number && job.full_address.street_name
                                ? `${job.full_address.house_number} ${job.full_address.street_name}`
                                : job.full_address.street_name,
                            job.full_address.suburb_name,
                            job.full_address.city_name,
                            job.full_address.zip_code,
                        ].filter(Boolean).join(', ')}
                    </Text>
                </View>
            )}

            {/* ── Helper actions (for browse view) ── */}
            {isHelper && job.status === 'OPEN' && (
                <View style={styles.helperActions}>
                    {hasExpressedInterest ? (
                        <View style={styles.appliedRow}>
                            <View style={styles.appliedBadge}>
                                <CheckCircle size={14} color="#10B981" />
                                <Text style={styles.appliedText}>Applied</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.withdrawBtn}
                                onPress={() => onWithdrawInterest && onWithdrawInterest(job)}
                                disabled={busy}
                            >
                                {busy ? <ActivityIndicator size="small" color={Colors.error} /> : (
                                    <>
                                        <X size={14} color={Colors.error} />
                                        <Text style={styles.withdrawText}>Withdraw</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.expressInterestBtn}
                            onPress={() => onExpressInterest && onExpressInterest(job)}
                            disabled={busy}
                        >
                            {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                                <>
                                    <Hand size={16} color="#fff" />
                                    <Text style={styles.expressInterestText}>I'm Interested  •  1 credit</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ── Owner (housewife) actions ── */}
            {isOwner && (
                <View style={styles.ownerActions}>
                    {job.status === 'OPEN' ? (
                        <>
                            <TouchableOpacity
                                style={styles.viewInterestedBtn}
                                onPress={() => onViewInterested(job)}
                                disabled={busy}
                            >
                                {busy ? <ActivityIndicator size="small" color={Colors.primary} /> : (
                                    <Text style={styles.viewInterestedText}>
                                        View Interested ({job.interested_helpers?.length || 0})
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.secondaryActions}>
                                <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(job)}>
                                    <Pencil size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={() => onCancel(job)}>
                                    <Trash2 size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : job.status === 'IN_PROGRESS' && job.accepted_by ? (
                        <View style={styles.contactActions}>
                            <Text style={styles.contactLabel}>Assigned to: {job.accepted_by.username}</Text>
                            <View style={styles.contactBtns}>
                                <TouchableOpacity
                                    style={[styles.contactBtn, styles.callBtn]}
                                    onPress={() => handleCall(job.accepted_by.phone_number)}
                                >
                                    <Phone size={16} color="#fff" />
                                    <Text style={styles.contactBtnText}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.contactBtn, styles.waBtn]}
                                    onPress={() => handleWhatsApp(job.accepted_by.phone_number, job.title)}
                                >
                                    <MessageSquare size={16} color="#fff" />
                                    <Text style={styles.contactBtnText}>WhatsApp</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.contactBtn, styles.completeBtn]}
                                    onPress={() => onComplete(job)}
                                    disabled={busy}
                                >
                                    {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                                        <>
                                            <CheckCircle size={16} color="#fff" />
                                            <Text style={styles.contactBtnText}>Done</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : job.status === 'COMPLETED' ? (
                        !job.review ? (
                            <TouchableOpacity
                                style={styles.reviewBtn}
                                onPress={() => onReview(job)}
                                disabled={busy}
                            >
                                {busy ? <ActivityIndicator size="small" color="#fff" /> : (
                                    <>
                                        <Star size={18} color="#fff" fill="#fff" />
                                        <Text style={styles.reviewBtnText}>Leave a Review</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.reviewedBadge} onPress={() => onViewReview && onViewReview(job)}>
                                <CheckCircle size={14} color="#10B981" />
                                <Text style={styles.reviewedText}>Reviewed</Text>
                            </TouchableOpacity>
                        )
                    ) : null}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    remunerationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    remunerationText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
    },
    title: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 12,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    addressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary + '10',
        padding: 10,
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    addressText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
        flex: 1,
    },
    scheduledRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        backgroundColor: Colors.primary + '0D',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    scheduledText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '700',
    },

    // ── Helper interest actions ───────────────────────────────────────────
    helperActions: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    expressInterestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 46,
        borderRadius: 12,
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    expressInterestText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    appliedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    appliedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#10B98115',
    },
    appliedText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
    },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.error + '60',
        backgroundColor: Colors.error + '10',
    },
    withdrawText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.error,
    },

    // ── Owner actions ─────────────────────────────────────────────────────
    ownerActions: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contactActions: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 8,
    },
    contactBtns: {
        flexDirection: 'row',
        gap: 12,
    },
    contactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 40,
        borderRadius: 10,
    },
    callBtn: {
        backgroundColor: '#3B82F6',
    },
    waBtn: {
        backgroundColor: '#10B981',
    },
    contactBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    completeBtn: {
        backgroundColor: Colors.primary,
    },
    reviewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
    },
    reviewBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    reviewedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#10B98115',
    },
    reviewedText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    viewInterestedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '12',
    },
    viewInterestedText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    deleteBtn: {},
});
