import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, User, MapPin, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { role } = useLocalSearchParams();

    const handleRegister = async () => {
        if (!email || !username || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const payload = {
                email,
                username,
                password,
                is_housewife: role === 'housewife',
                is_helper: role === 'helper',
            };

            // Note: This endpoint must exist on backend. 
            // In Django typically you'd have a registration view/endpoint.
            await api.post('accounts/register/', payload);

            alert('Registration successful! Please login.');
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Registration Error:', error.response?.data);
            const data = error.response?.data;
            let msg = 'Registration failed. Try again.';
            
            if (data) {
                if (typeof data === 'string') {
                    msg = data;
                } else if (data.detail) {
                    msg = data.detail;
                } else if (data.error) {
                    msg = data.error;
                } else {
                    // Collect field validation errors
                    const errors = Object.values(data).flat();
                    if (errors.length > 0) msg = errors[0];
                }
            }
            
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/applogo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Join the House Help community today as a {role === 'helper' ? 'Helper' : 'Household'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input icon={<User size={18} />} placeholder="Username" value={username} onChangeText={setUsername} />
                        <Input icon={<Mail size={18} />} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
                        <Input icon={<Lock size={18} />} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity style={styles.regBtn} onPress={handleRegister} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.regBtnText}>Register</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Input({ icon, ...props }) {
    return (
        <View style={styles.inputContainer}>
            <View style={{ opacity: 0.5 }}>{icon}</View>
            <TextInput
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    header: {
        marginBottom: 32,
    },
    logo: {
        width: 160,
        height: 64,
        marginBottom: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: 4,
    },
    form: {
        gap: 16,
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
    regBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    regBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
