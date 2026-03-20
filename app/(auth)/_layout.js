import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="role_selection" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot_password" />
            <Stack.Screen name="reset_password" />
        </Stack>
    );
}
