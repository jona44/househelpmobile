import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ChevronLeft, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('accounts/password-reset/request/', { email: email.trim().toLowerCase() });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>

                <View style={styles.successContainer}>
                    <View style={styles.successIconWrap}>
                        <Send size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Check your inbox</Text>
                    <Text style={styles.successBody}>
                        We've sent a password reset email to{'\n'}
                        <Text style={styles.successEmail}>{email}</Text>
                        {'\n\n'}Open the email and copy the <Text style={styles.bold}>UID</Text> and <Text style={styles.bold}>Token</Text> shown there, then tap the button below.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.push({ pathname: '/(auth)/reset_password', params: { email } })}
                    >
                        <Text style={styles.primaryBtnText}>Enter Reset Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSent(false)} style={styles.resendLink}>
                        <Text style={styles.resendText}>Didn't get it? Resend email</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/applogo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <Mail size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your registered email address and we'll send you a reset link.
                    </Text>

                    <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                        <Mail size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Your email address"
                            placeholderTextColor={Colors.textMuted}
                            value={email}
                            onChangeText={v => { setEmail(v); setError(''); }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleSend}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.primaryBtnText}>Send Reset Email</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                        <Text style={styles.backLinkText}>← Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 24,
        left: 24,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.surface || '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: Colors.border || '#E5E7EB',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 160,
        height: 70,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        gap: 16,
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 56,
    },
    inputError: {
        borderColor: Colors.error,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        fontWeight: '600',
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        marginTop: 4,
    },
    primaryBtnDisabled: {
        opacity: 0.7,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    backLink: {
        alignItems: 'center',
        paddingTop: 4,
    },
    backLinkText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    // Success state
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 20,
    },
    successIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    successBody: {
        fontSize: 15,
        color: Colors.textMuted,
        lineHeight: 24,
        textAlign: 'center',
    },
    successEmail: {
        color: Colors.primary,
        fontWeight: '700',
    },
    bold: {
        fontWeight: '700',
        color: Colors.text,
    },
    resendLink: {
        paddingVertical: 8,
    },
    resendText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
