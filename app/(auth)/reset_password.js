import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lock, Hash, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import api from '../../services/api';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();

    const [uid, setUid] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleReset = async () => {
        if (!uid.trim() || !token.trim() || !newPassword || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('accounts/password-reset/confirm/', {
                uid: uid.trim(),
                token: token.trim(),
                new_password: newPassword,
            });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────────
    if (done) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconWrap}>
                        <CheckCircle size={40} color={Colors.secondary} />
                    </View>
                    <Text style={styles.successTitle}>Password Reset!</Text>
                    <Text style={styles.successBody}>
                        Your password has been changed successfully.{'\n'}You can now log in with your new password.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.primaryBtnText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Reset form ──────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.icon}>
                        <Lock size={28} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Paste the <Text style={styles.bold}>UID</Text> and <Text style={styles.bold}>Token</Text> from your reset email, then choose a new password.
                        {email ? `\n\nEmail: ${email}` : ''}
                    </Text>

                    {/* UID field */}
                    <Text style={styles.label}>UID</Text>
                    <View style={[styles.inputContainer, error && !uid ? styles.inputError : null]}>
                        <Hash size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Paste UID from email"
                            placeholderTextColor={Colors.textMuted}
                            value={uid}
                            onChangeText={v => { setUid(v); setError(''); }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Token field */}
                    <Text style={styles.label}>Token</Text>
                    <View style={[styles.inputContainer, error && !token ? styles.inputError : null]}>
                        <Hash size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Paste Token from email"
                            placeholderTextColor={Colors.textMuted}
                            value={token}
                            onChangeText={v => { setToken(v); setError(''); }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* New Password */}
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputContainer}>
                        <Lock size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="At least 8 characters"
                            placeholderTextColor={Colors.textMuted}
                            value={newPassword}
                            onChangeText={v => { setNewPassword(v); setError(''); }}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} hitSlop={8}>
                            {showPassword
                                ? <EyeOff size={18} color={Colors.textMuted} />
                                : <Eye size={18} color={Colors.textMuted} />
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.inputContainer, newPassword && confirmPassword && newPassword !== confirmPassword ? styles.inputError : null]}>
                        <Lock size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Repeat new password"
                            placeholderTextColor={Colors.textMuted}
                            value={confirmPassword}
                            onChangeText={v => { setConfirmPassword(v); setError(''); }}
                            secureTextEntry={!showConfirm}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(p => !p)} hitSlop={8}>
                            {showConfirm
                                ? <EyeOff size={18} color={Colors.textMuted} />
                                : <Eye size={18} color={Colors.textMuted} />
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Strength hint */}
                    {newPassword.length > 0 && newPassword.length < 8 && (
                        <Text style={styles.hintText}>Password is too short (min. 8 chars)</Text>
                    )}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.primaryBtnText}>Reset Password</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/(auth)/login')}
                        style={styles.backLink}
                    >
                        <Text style={styles.backLinkText}>← Back to Login</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        flexGrow: 1,
        padding: 28,
        paddingTop: 80,
        gap: 12,
    },
    backBtn: {
        position: 'absolute',
        top: 16,
        left: 28,
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
    icon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 22,
        marginBottom: 8,
    },
    bold: {
        fontWeight: '700',
        color: Colors.text,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: -4,
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
        textAlign: 'center',
    },
    hintText: {
        color: Colors.warning,
        fontSize: 12,
        marginTop: -4,
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
        marginTop: 8,
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
        paddingVertical: 12,
    },
    backLinkText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    // Success
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
        backgroundColor: Colors.secondaryLight || '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    successBody: {
        fontSize: 15,
        color: Colors.textMuted,
        lineHeight: 26,
        textAlign: 'center',
    },
});
