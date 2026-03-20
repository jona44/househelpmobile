import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { ChevronLeft, Gift, ShieldAlert, CreditCard } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { WebView } from 'react-native-webview';

export default function CreditsScreen() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    
    // Payment WebView props
    const [checkoutData, setCheckoutData] = useState(null);
    const [showWebView, setShowWebView] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await api.get('vouchers/packages/');
            
            // Expected response: array of {id, credits, amount, name}
            // Sort by amount
            const sorted = response.data.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
            setPackages(sorted);
        } catch (error) {
            console.error('Error fetching credit packages:', error);
            Alert.alert('Error', 'Failed to load credit packages.');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!redeemCode.trim()) {
            Alert.alert('Error', 'Please enter a voucher code.');
            return;
        }

        setRedeeming(true);
        try {
            // Assume default provider 'HOUSEHELP'
            const response = await api.post('vouchers/redeem/', { code: redeemCode.trim(), provider: 'HOUSEHELP' });
            if (response.data.success) {
                Alert.alert('Success', response.data.message);
                setRedeemCode('');
                refreshUser?.(); // Refresh user to get updated credits
            }
        } catch (error) {
            console.error('Redeem error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to redeem voucher.');
        } finally {
            setRedeeming(false);
        }
    };

    const handleBuy = async (pkg) => {
        setLoading(true);
        try {
            const response = await api.post('vouchers/buy/', { package: pkg.id });
            // Should return context dictionary with `payfast_url`, `merchant_id`, etc.
            setCheckoutData(response.data);
            setShowWebView(true);
        } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Error', 'Failed to initiate purchase. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewNavigationStateChange = (newNavState) => {
        const { url } = newNavState;
        if (!url) return;

        // Check if returned to app
        if (url.includes('vouchers/payfast/return')) {
            setShowWebView(false);
            Alert.alert('Payment Successful', 'Your credits should reflect shortly.', [
                { text: 'OK', onPress: () => refreshUser() }
            ]);
        } else if (url.includes('vouchers/payfast/cancel')) {
            setShowWebView(false);
            Alert.alert('Payment Cancelled', 'Your transaction was cancelled.');
        }
    };

    const renderCheckoutHtml = () => {
        if (!checkoutData) return '';
        
        let inputs = '';
        for (const [key, value] of Object.entries(checkoutData)) {
            if (key !== 'payfast_url' && value !== null && value !== '') {
                // simple escape to avoid breaking Quotes
                const safeVal = String(value).replace(/"/g, '&quot;');
                inputs += `<input type="hidden" name="${key}" value="${safeVal}" />\n`;
            }
        }

        return `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #f9fafb; color: #374151; }
                        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4F46E5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;}
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body onload="document.forms[0].submit()">
                    <div style="text-align: center;">
                        <div class="loader"></div>
                        <p>Redirecting to Secure Payment Gateway...</p>
                    </div>
                    <form action="${checkoutData.payfast_url}" method="post">
                        ${inputs}
                    </form>
                </body>
            </html>
        `;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Credits & Billing</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{user?.job_credits || 0}</Text>
                        <Text style={styles.currencyLabel}>Credits</Text>
                    </View>
                </View>

                {/* Redeem Voucher */}
                <Text style={styles.sectionTitle}>Redeem a Voucher</Text>
                <View style={styles.redeemContainer}>
                    <View style={styles.inputWrapper}>
                        <Gift size={20} color={Colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter voucher code"
                            value={redeemCode}
                            onChangeText={setRedeemCode}
                            autoCapitalize="characters"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.redeemBtn, !redeemCode.trim() && styles.redeemBtnDisabled]} 
                        onPress={handleRedeem}
                        disabled={!redeemCode.trim() || redeeming}
                    >
                        {redeeming ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.redeemBtnText}>Redeem</Text>}
                    </TouchableOpacity>
                </View>

                {/* Buy Credits Options */}
                <Text style={styles.sectionTitle}>Top Up Credits</Text>
                <View style={styles.packagesContainer}>
                    {loading && !packages.length ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={Colors.primary} />
                    ) : packages.map((pkg, idx) => (
                        <View key={pkg.id} style={styles.packageCard}>
                            <View style={styles.packageInfo}>
                                <Text style={styles.packageName}>{pkg.name}</Text>
                                <Text style={styles.packageAmount}>R{pkg.amount}</Text>
                            </View>
                            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(pkg)}>
                                <CreditCard size={18} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.buyBtnText}>Buy Now</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                
                <View style={styles.infoBox}>
                    <ShieldAlert size={20} color={Colors.textMuted} />
                    <Text style={styles.infoText}>
                        Payments are securely processed via PayFast. Your credits will be added to your account instantly upon successful payment.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Payment Modal */}
            <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowWebView(false)}>
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Secure Checkout</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    {checkoutData && (
                        <WebView 
                            source={{ html: renderCheckoutHtml() }}
                            onNavigationStateChange={handleWebViewNavigationStateChange}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
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
        marginLeft: -10,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        padding: 20,
    },
    balanceCard: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        marginBottom: 8,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    balanceValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
    },
    currencyLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    redeemContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: Colors.text,
    },
    redeemBtn: {
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    redeemBtnDisabled: {
        backgroundColor: Colors.border,
        shadowOpacity: 0,
    },
    redeemBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    packagesContainer: {
        gap: 16,
        marginBottom: 32,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    packageInfo: {
        flex: 1,
    },
    packageName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    packageAmount: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
    },
    buyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.text,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 100,
    },
    buyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textMuted,
        marginLeft: 12,
        lineHeight: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeBtn: {
        padding: 8,
    },
    closeBtnText: {
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
