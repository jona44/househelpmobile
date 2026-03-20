import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import {
    ChevronLeft,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Clock,
    ScanFace,
    CreditCard,
    Zap,
    ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { WebView } from 'react-native-webview';

// Status display config
const KYC_STATUS_CONFIG = {
    UNVERIFIED: {
        icon: ShieldAlert,
        color: Colors.warning,
        bg: '#FEF3C7',
        label: 'Not Verified',
        description: 'Your identity has not been verified yet. Complete verification to unlock all features and build trust with clients.',
    },
    PENDING: {
        icon: Clock,
        color: '#6366F1',
        bg: '#EEF2FF',
        label: 'Verification Pending',
        description: 'Your verification is being processed. This usually takes a few minutes. You will be updated once complete.',
    },
    VERIFIED: {
        icon: ShieldCheck,
        color: Colors.secondary,
        bg: Colors.secondaryLight,
        label: 'Verified ✓',
        description: 'Your identity has been successfully verified. Clients can trust that you are who you say you are.',
    },
    REJECTED: {
        icon: ShieldX,
        color: Colors.error,
        bg: '#FEF2F2',
        label: 'Verification Rejected',
        description: 'Your verification was unsuccessful. Please try again with a clear photo ID and good lighting.',
    },
};

const STEPS = [
    { icon: ScanFace, text: 'Take a quick selfie (liveness check)' },
    { icon: CreditCard, text: 'Scan your SA ID card or Passport' },
    { icon: Zap, text: 'Automated verification (takes ~2 min)' },
];

export default function KYCScreen() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [kycData, setKycData] = useState(null);
    const [showWebView, setShowWebView] = useState(false);
    const webViewRef = useRef(null);

    const kycStatus = user?.profile?.kyc_status || 'UNVERIFIED';
    const statusConfig = KYC_STATUS_CONFIG[kycStatus] || KYC_STATUS_CONFIG.UNVERIFIED;
    const StatusIcon = statusConfig.icon;

    const canInitiate = kycStatus === 'UNVERIFIED' || kycStatus === 'REJECTED';

    const handleStartVerification = async () => {
        setLoading(true);
        try {
            const response = await api.post('accounts/kyc/initiate/');
            setKycData(response.data);
            setShowWebView(true);
        } catch (error) {
            const msg = error.response?.data?.detail || 'Could not start verification. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'kyc_success') {
                setShowWebView(false);
                Alert.alert(
                    '✅ Verification Submitted',
                    'Your identity documents have been submitted. Verification typically completes within a few minutes.',
                    [{ text: 'OK', onPress: () => refreshUser() }]
                );
            } else if (data.type === 'kyc_error') {
                setShowWebView(false);
                Alert.alert('Verification Failed', data.message || 'Please try again with a clear photo ID.');
                refreshUser();
            } else if (data.type === 'kyc_close') {
                setShowWebView(false);
                refreshUser();
            }
        } catch (_) {
            // ignore non-JSON messages from WebView
        }
    };

    const buildSmileIdHtml = () => {
        if (!kycData) return '';
        const { token, partner_id } = kycData;
        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F9FAFB;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        #smile-id-hosted-web { width: 100%; min-height: 500px; }
        .error-box {
            text-align: center;
            padding: 32px;
            background: #fff;
            border-radius: 16px;
            border: 1px solid #E5E7EB;
        }
        .error-box h2 { color: #EF4444; margin-bottom: 12px; }
        .error-box p { color: #6B7280; font-size: 14px; line-height: 1.5; }
    </style>
</head>
<body>
    <div id="smile-id-hosted-web"></div>

    <script src="https://cdn.smileidentity.com/inline/v1/js/script.min.js"></script>
    <script>
        function notifyApp(type, message) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
            }
        }

        try {
            const smid = new SmileIdentity({
                token: ${JSON.stringify(token)},
                partner_id: ${JSON.stringify(String(partner_id))},
                container_id: 'smile-id-hosted-web',
                onSuccess: function(response) {
                    notifyApp('kyc_success', 'Verification submitted successfully.');
                },
                onError: function(error) {
                    notifyApp('kyc_error', error && error.message ? error.message : 'Verification failed.');
                },
                onClose: function() {
                    notifyApp('kyc_close', 'Closed');
                }
            });
            smid.start();
        } catch(e) {
            document.getElementById('smile-id-hosted-web').innerHTML =
                '<div class="error-box"><h2>Initialization Error</h2><p>Could not load the verification interface. Please go back and try again.</p></div>';
            notifyApp('kyc_error', e.message || 'SDK initialization failed.');
        }
    </script>
</body>
</html>`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Identity Verification</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '40' }]}>
                    <View style={[styles.statusIconWrap, { backgroundColor: statusConfig.color + '20' }]}>
                        <StatusIcon size={36} color={statusConfig.color} />
                    </View>
                    <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    <Text style={styles.statusDesc}>{statusConfig.description}</Text>
                </View>

                {/* What to Expect */}
                {canInitiate && (
                    <>
                        <Text style={styles.sectionTitle}>What to Expect</Text>
                        <View style={styles.stepsCard}>
                            {STEPS.map(({ icon: Icon, text }, idx) => (
                                <React.Fragment key={idx}>
                                    <View style={styles.stepRow}>
                                        <View style={styles.stepIconWrap}>
                                            <Icon size={20} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.stepText}>{text}</Text>
                                    </View>
                                    {idx < STEPS.length - 1 && <View style={styles.stepDivider} />}
                                </React.Fragment>
                            ))}
                        </View>

                        <View style={styles.tipsCard}>
                            <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
                            <Text style={styles.tipItem}>• Be in a well-lit area — avoid harsh backlighting</Text>
                            <Text style={styles.tipItem}>• Hold your ID flat and ensure all text is readable</Text>
                            <Text style={styles.tipItem}>• Remove glasses for the selfie step</Text>
                            <Text style={styles.tipItem}>• Use your South African ID book, smart card, or Passport</Text>
                        </View>
                    </>
                )}

                {kycStatus === 'VERIFIED' && (
                    <View style={styles.verifiedBox}>
                        <ShieldCheck size={24} color={Colors.secondary} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.verifiedTitle}>You're all set!</Text>
                            <Text style={styles.verifiedDesc}>Your profile displays a verified badge. Clients can see you're verified when browsing helpers.</Text>
                        </View>
                    </View>
                )}

                {kycStatus === 'PENDING' && (
                    <View style={styles.pendingNoticeBox}>
                        <Clock size={20} color='#6366F1' />
                        <Text style={styles.pendingNoticeText}>
                            Results are typically available within 2–5 minutes. Pull to refresh your profile to see the latest status.
                        </Text>
                    </View>
                )}

                {/* Privacy Note */}
                <View style={styles.privacyNote}>
                    <ShieldCheck size={16} color={Colors.textMuted} />
                    <Text style={styles.privacyText}>
                        Powered by{' '}
                        <Text style={{ fontWeight: '700', color: Colors.text }}>Smile Identity</Text>.
                        Your biometric data is encrypted and processed in accordance with{' '}
                        <Text style={{ fontWeight: '700' }}>POPIA</Text> regulations. House Help does not store raw biometric data.
                    </Text>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* CTA Button */}
            {canInitiate && (
                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
                        onPress={handleStartVerification}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <ExternalLink size={20} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.ctaBtnText}>
                                    {kycStatus === 'REJECTED' ? 'Retry Verification' : 'Start Verification'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Smile ID WebView Modal */}
            <Modal visible={showWebView} animationType="slide" onRequestClose={() => { setShowWebView(false); refreshUser(); }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => { setShowWebView(false); refreshUser(); }}
                        >
                            <Text style={styles.modalCloseBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Identity Verification</Text>
                        <View style={{ width: 70 }} />
                    </View>
                    {kycData && (
                        <WebView
                            ref={webViewRef}
                            source={{ html: buildSmileIdHtml() }}
                            onMessage={handleWebViewMessage}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            style={{ flex: 1 }}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        padding: 20,
    },
    statusCard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginBottom: 28,
        borderWidth: 1.5,
    },
    statusIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusLabel: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    statusDesc: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 21,
        fontWeight: '500',
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
    stepsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 20,
        marginBottom: 20,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    stepIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600',
        lineHeight: 20,
    },
    stepDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 14,
    },
    tipsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 20,
        marginBottom: 20,
        gap: 10,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    tipItem: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
        fontWeight: '500',
    },
    verifiedBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.secondaryLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.secondary + '40',
        padding: 20,
        marginBottom: 20,
    },
    verifiedTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    verifiedDesc: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    pendingNoticeBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        padding: 16,
        gap: 12,
        marginBottom: 20,
    },
    pendingNoticeText: {
        flex: 1,
        fontSize: 14,
        color: '#4338CA',
        lineHeight: 20,
        fontWeight: '500',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        gap: 10,
    },
    privacyText: {
        flex: 1,
        fontSize: 12,
        color: Colors.textMuted,
        lineHeight: 18,
    },
    ctaContainer: {
        padding: 20,
        paddingTop: 12,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaBtnDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    ctaBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 17,
        letterSpacing: 0.3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalCloseBtn: {
        padding: 8,
    },
    modalCloseBtnText: {
        color: Colors.error,
        fontWeight: '600',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
});
