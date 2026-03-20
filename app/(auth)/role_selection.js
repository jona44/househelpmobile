import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Briefcase } from 'lucide-react-native';

export default function RoleSelectionScreen() {
    const router = useRouter();

    const handleSelectRole = (role) => {
        router.push({ pathname: '/(auth)/register', params: { role } });
    };

    return (
        <SafeAreaView style={styles.container}>
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
                    <Text style={styles.title}>Choose Your Role</Text>
                    <Text style={styles.subtitle}>
                        How would you like to use House Help today?
                    </Text>
                </View>

                <View style={styles.cardsContainer}>
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('housewife')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight || '#E0E7FF' }]}>
                            <User size={32} color={Colors.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>I'm a Household</Text>
                            <Text style={styles.cardSubtitle}>I want to find and hire reliable helpers for my home.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('helper')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: Colors.secondaryLight || '#FEF3C7' }]}>
                            <Briefcase size={32} color={Colors.secondary || '#D97706'} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>I'm a Helper</Text>
                            <Text style={styles.cardSubtitle}>I am looking for job opportunities and clients.</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
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
        backgroundColor: Colors.surface || '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Colors.border || '#E5E7EB',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 140,
        height: 60,
        marginBottom: 20,
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
    },
    cardsContainer: {
        gap: 20,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface || '#F9FAFB',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.border || '#E5E7EB',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
    },
});
