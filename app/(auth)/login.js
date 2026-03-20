import React, { useState } from 'react';
// Triggering re-save to fix route recognition
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Mail, Lock, ChevronRight, ChevronLeft } from 'lucide-react-native';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!identifier || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');

        const res = await login(identifier, password);
        if (!res.success) {
            setError(res.message);
        } else {
            // Check if profile is incomplete for housewife
            const { userData } = res;
            const isHousewife = userData?.type === 'housewife';
            const isIncomplete = isHousewife && (!userData?.profile?.first_name || !userData?.profile?.phone_number || !userData?.profile?.address?.city);
            
            if (isIncomplete) {
                router.replace('/edit-profile');
            } else {
                router.replace('/(tabs)/home');
            }
        }
        setLoading(false);
    };

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
                    <Text style={styles.subtitle}>Connecting South Africa since 2026</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Login</Text>

                    <View style={styles.inputContainer}>
                        <Mail size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email or Username"
                            value={identifier}
                            onChangeText={setIdentifier}
                            autoCapitalize="none"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={styles.forgotLink}
                        onPress={() => router.push('/(auth)/forgot_password')}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/role_selection')}>
                            <Text style={styles.footerLink}>Register Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bypass}>
                    <Text style={styles.bypassText}>Test Bypass: email "admin@admin.com"</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
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
        marginBottom: 48,
    },
    logo: {
        width: 180,
        height: 80,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
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
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    loginBtn: {
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
    loginBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    forgotLink: {
        alignItems: 'flex-end',
        marginTop: -4,
    },
    forgotText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    bypass: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    bypassText: {
        fontSize: 12,
        color: Colors.textMuted,
        opacity: 0.5,
    },
});
