import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/applogo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Welcome to House Help</Text>
                    <Text style={styles.subtitle}>
                        The best platform connecting households with reliable helpers across South Africa.
                    </Text>
                </View>

                <View style={styles.illustrationContainer}>
                    {/* Placeholder for future illustration if needed */}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.primaryBtnText}>Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => router.push('/(auth)/role_selection')}
                    >
                        <Text style={styles.secondaryBtnText}>Create an Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    logo: {
        width: width * 0.6,
        height: 100,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    illustrationContainer: {
        flex: 1,
    },
    footer: {
        width: '100%',
        gap: 16,
        marginBottom: 20,
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
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    secondaryBtn: {
        backgroundColor: Colors.surface || '#F9FAFB',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primaryLight || '#DBEAFE',
    },
    secondaryBtnText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '800',
    },
});
