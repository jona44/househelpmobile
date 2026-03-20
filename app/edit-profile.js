import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image as RNImage, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, User, Phone, MapPin, Briefcase, Info, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState(user?.profile?.photo || null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState(() => {
        if (user?.profile?.date_of_birth) {
            return new Date(user.profile.date_of_birth);
        }
        return new Date();
    });

    const [formData, setFormData] = useState({
        first_name: user?.profile?.first_name || '',
        last_name: user?.profile?.last_name || '',
        phone_number: user?.profile?.phone_number || '',
        address: {
            street_address: user?.profile?.address?.street_address || '',
            city: user?.profile?.address?.city || null,
            suburb: user?.profile?.address?.suburb || null,
            zip_code: user?.profile?.address?.zip_code || '',
        },
        // Helper specific
        date_of_birth: user?.profile?.date_of_birth || '',
        bio: user?.profile?.bio || '',
        skills: user?.profile?.skills || '',
        experience: user?.profile?.experience || '',
        nationality: user?.profile?.nationality || '',
    });

    const [cities, setCities] = useState([]);
    const [suburbs, setSuburbs] = useState([]);

    React.useEffect(() => {
        fetchCities();
    }, []);

    React.useEffect(() => {
        if (formData.address.city) {
            fetchSuburbs(formData.address.city);
        } else {
            setSuburbs([]);
        }
    }, [formData.address.city]);

    const fetchCities = async () => {
        try {
            const response = await api.get('cities/');
            setCities(response.data);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    const fetchSuburbs = async (cityId) => {
        try {
            const response = await api.get(`suburbs/?city=${cityId}`);
            setSuburbs(response.data);
        } catch (error) {
            console.error('Error fetching suburbs:', error);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Needed', 'We need access to your gallery to change the profile photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const endpoint = user?.type === 'housewife' ? 'housewives/me/' : 'helpers/me/';
            
            // Prepare FormData if there's an image to upload
            let data;
            let headers = {};

            if (imageUri && !imageUri.startsWith('http')) {
                data = new FormData();
                // Append all text fields
                Object.keys(formData).forEach(key => {
                    if (key === 'address') {
                        // Nested address needs special handling for FormData
                        Object.keys(formData.address).forEach(addrKey => {
                            if (formData.address[addrKey] !== null) {
                                data.append(`address.${addrKey}`, formData.address[addrKey]);
                            }
                        });
                    } else {
                        data.append(key, formData[key]);
                    }
                });
                
                // Append photo
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                
                data.append('photo', {
                    uri: imageUri,
                    name: filename,
                    type,
                });
                
                // Do not manually set Content-Type: multipart/form-data; 
                // Axios and the React Native Fetch implementation will 
                // automatically set it WITH the correct boundary.
                headers = {};
            } else {
                data = formData;
            }

            const response = await api.patch(endpoint, data, { headers });
            updateUser(response.data);
            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error) {
            console.error('Update profile error:', error);
            const detail = error.response?.data?.detail || 
                         (error.response?.data ? JSON.stringify(error.response.data) : null) || 
                         'Failed to update profile.';
            Alert.alert('Error', detail);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const isHelper = user?.type === 'helper';
    const profileInitials = (formData.first_name?.[0] || user?.username?.[0] || '?').toUpperCase();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Edit Profile</Text>
                <TouchableOpacity 
                    style={[styles.saveBtn, loading && styles.disabledBtn]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Save size={24} color={Colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Photo Upload Section */}
                <View style={styles.photoSection}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        {imageUri ? (
                            <RNImage source={{ uri: imageUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>{profileInitials}</Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Camera size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoTip}>Tap to change profile picture</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.first_name}
                                onChangeText={(val) => setFormData({ ...formData, first_name: val })}
                                placeholder="Enter first name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.last_name}
                                onChangeText={(val) => setFormData({ ...formData, last_name: val })}
                                placeholder="Enter last name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <Phone size={18} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.phone_number}
                                onChangeText={(val) => setFormData({ ...formData, phone_number: val })}
                                placeholder="e.g. +233..."
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {isHelper && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity 
                                style={[styles.inputWrapper, { paddingVertical: 14 }]} 
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 15, color: formData.date_of_birth ? Colors.text : 'rgba(0,0,0,0.4)', fontWeight: '500' }}>
                                        {formData.date_of_birth ? formData.date_of_birth : "YYYY-MM-DD"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateOfBirth}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowDatePicker(false);
                                        }
                                        if (selectedDate) {
                                            setDateOfBirth(selectedDate);
                                            const year = selectedDate.getFullYear();
                                            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                            const day = String(selectedDate.getDate()).padStart(2, '0');
                                            setFormData({ ...formData, date_of_birth: `${year}-${month}-${day}` });
                                        } else if (event.type === 'dismissed') {
                                            setShowDatePicker(false);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location Information</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Street Address</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={18} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.address.street_address}
                                onChangeText={(val) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, street_address: val } 
                                })}
                                placeholder="e.g. 123 Main Street"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City</Text>
                        <View style={styles.pickerContainer}>
                            {cities.map((city) => (
                                <TouchableOpacity 
                                    key={city.id} 
                                    style={[styles.catChip, formData.address.city === city.id && styles.catChipActive]}
                                    onPress={() => setFormData({ 
                                        ...formData, 
                                        address: { ...formData.address, city: city.id, suburb: null } 
                                    })}
                                >
                                    <Text style={[styles.catText, formData.address.city === city.id && styles.catTextActive]}>
                                        {city.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {formData.address.city && suburbs.length > 0 && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Suburb</Text>
                            <View style={styles.pickerContainer}>
                                {suburbs.map((suburb) => (
                                    <TouchableOpacity 
                                        key={suburb.id} 
                                        style={[styles.catChip, formData.address.suburb === suburb.id && styles.catChipActive]}
                                        onPress={() => setFormData({ 
                                            ...formData, 
                                            address: { ...formData.address, suburb: suburb.id } 
                                        })}
                                    >
                                        <Text style={[styles.catText, formData.address.suburb === suburb.id && styles.catTextActive]}>
                                            {suburb.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Zip Code</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={18} color={Colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={formData.address.zip_code}
                                onChangeText={(val) => setFormData({ 
                                    ...formData, 
                                    address: { ...formData.address, zip_code: val } 
                                })}
                                placeholder="e.g. 1234"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {isHelper && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Info (Helper)</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nationality</Text>
                            <View style={styles.inputWrapper}>
                                <Info size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.nationality}
                                    onChangeText={(val) => setFormData({ ...formData, nationality: val })}
                                    placeholder="Enter your nationality"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio / Background</Text>
                            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                                <Info size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                    value={formData.bio}
                                    onChangeText={(val) => setFormData({ ...formData, bio: val })}
                                    placeholder="Tell families about your experience..."
                                    multiline
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Skills (comma separated)</Text>
                            <View style={styles.inputWrapper}>
                                <Briefcase size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.skills}
                                    onChangeText={(val) => setFormData({ ...formData, skills: val })}
                                    placeholder="e.g. Cleaning, Cooking, Babysitting"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Experience</Text>
                            <View style={styles.inputWrapper}>
                                <Briefcase size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={formData.experience}
                                    onChangeText={(val) => setFormData({ ...formData, experience: val })}
                                    placeholder="e.g. 3 years as a Nanny"
                                />
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.fullSaveBtn, loading && styles.disabledBtn]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.fullSaveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
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
    saveBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary + '15',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    photoTip: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
        marginTop: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    fullSaveBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 12,
    },
    fullSaveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    catChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    catChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    catText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    catTextActive: {
        color: '#fff',
    },
});
