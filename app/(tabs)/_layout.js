import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Home, ClipboardList, User } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                headerStyle: {
                    backgroundColor: Colors.surface,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: Colors.text,
                },
                tabBarStyle: {
                    borderTopColor: Colors.border,
                    backgroundColor: Colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Jobs',
                    tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}
