import React, { useState } from 'react';
// Triggering re-save to fix route recognition
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Calendar, Briefcase, CreditCard, ChevronDown, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/Colors';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
    { label: 'Cleaning', value: 'CLEANING' },
    { label: 'Cooking', value: 'COOKING' },
    { label: 'Babysitting', value: 'BABYSITTING' },
    { label: 'Laundry', value: 'LAUNDRY' },
    { label: 'Other', value: 'OTHER' },
];

export default function PostJobScreen() {
    const router = useRouter();
    const { jobId } = useLocalSearchParams();
    
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('CLEANING');
    const [remuneration, setRemuneration] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!jobId);
    
    // Profile completeness check
    React.useEffect(() => {
        if (user && user.type === 'housewife' && !jobId) {
            const hasName = user.profile?.first_name && user.profile?.last_name;
            const hasPhone = user.profile?.phone_number;
            const hasAddress = user.profile?.address?.city && user.profile?.address?.zip_code;

            if (!hasName || !hasPhone || !hasAddress) {
                Alert.alert(
                    "Complete Your Profile",
                    "Please finish setting up your profile before posting a job. Helpers need to see your name and contact info.",
                    [
                        { text: "Later", onPress: () => router.back() },
                        { text: "Setup Now", onPress: () => router.push('/edit-profile') }
                    ]
                );
            }
        }
    }, [user, jobId]);
    const [scheduledFor, setScheduledFor] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    React.useEffect(() => {
        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            const response = await api.get(`jobs/${jobId}/`);
            const job = response.data;
            setTitle(job.title);
            setDescription(job.description);
            setCategory(job.category?.toUpperCase());
            setRemuneration(job.remuneration.toString());
            if (job.scheduled_for) {
                setScheduledFor(new Date(job.scheduled_for));
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            Alert.alert('Error', 'Failed to load job details.');
        } finally {
            setInitialLoading(false);
        }
    };

    const handlePostJob = async () => {
        if (!title || !description || !remuneration) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                description,
                category,
                remuneration: parseFloat(remuneration),
                scheduled_for: scheduledFor.toISOString(),
            };

            if (jobId) {
                await api.patch(`jobs/${jobId}/`, payload);
            } else {
                await api.post('jobs/', payload);
            }

            Alert.alert('Success', `Job ${jobId ? 'updated' : 'posted'} successfully!`, [
                { text: 'OK', onPress: () => router.push('/(tabs)/jobs') }
            ]);
        } catch (error) {
            console.error('Job post error:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>{jobId ? 'Edit Job' : 'Post New Job'}</Text>
                    <View style={{ width: 44 }} />
                </View>

                {initialLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.pickerContainer}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity 
                                    key={cat.value} 
                                    style={[styles.catChip, category === cat.value && styles.catChipActive]}
                                    onPress={() => setCategory(cat.value)}
                                >
                                    <Text style={[styles.catText, category === cat.value && styles.catTextActive]}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Job Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Deep House Cleaning"
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor={Colors.textMuted}
                        />

                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe what needs to be done..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            placeholderTextColor={Colors.textMuted}
                        />

                        <Text style={styles.label}>Remuneration (ZAR) *</Text>
                        <View style={styles.iconInputContainer}>
                            <CreditCard size={20} color={Colors.textMuted} />
                            <TextInput
                                style={styles.iconInput}
                                placeholder="Amount in ZAR"
                                value={remuneration}
                                onChangeText={setRemuneration}
                                keyboardType="numeric"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <Text style={styles.label}>Scheduled For *</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity 
                                style={styles.datePickerBtn} 
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                                <Text style={{ color: Colors.text, fontSize: 16 }}>
                                    {scheduledFor.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.datePickerBtn} 
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Clock size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                                <Text style={{ color: Colors.text, fontSize: 16 }}>
                                    {scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={scheduledFor}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') setShowDatePicker(false);
                                    if (selectedDate) {
                                        const newDate = new Date(scheduledFor);
                                        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                                        setScheduledFor(newDate);
                                    } else if (event.type === 'dismissed') {
                                        setShowDatePicker(false);
                                    }
                                }}
                                minimumDate={new Date()}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={scheduledFor}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') setShowTimePicker(false);
                                    if (selectedDate) {
                                        const newDate = new Date(scheduledFor);
                                        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                                        setScheduledFor(newDate);
                                    } else if (event.type === 'dismissed') {
                                        setShowTimePicker(false);
                                    }
                                }}
                            />
                        )}
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && styles.disabledBtn]} 
                        onPress={handlePostJob}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{jobId ? 'Update Job' : 'Publish Job'}</Text>}
                    </TouchableOpacity>
                </ScrollView>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollContent: {
        padding: 20,
    },
    formSection: {
        gap: 12,
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textMuted,
        marginTop: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: Colors.text,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    catChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    catText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    catTextActive: {
        color: '#fff',
    },
    iconInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
    },
    iconInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        flex: 1,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
