import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayout() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/welcome');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)/home');
        }
    }, [user, loading, segments]);

    return (
        <NotificationProvider>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#fff',
                    },
                    headerTintColor: '#111827',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    headerShadowVisible: false,
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="post-job" options={{ headerShown: false }} />
                <Stack.Screen name="kyc" options={{ headerShown: false }} />
            </Stack>
        </NotificationProvider>
    );
}

export default function Layout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootLayout />
                <StatusBar style="dark" />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
