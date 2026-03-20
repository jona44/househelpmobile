import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken, setLogoutCallback } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
        } catch (e) {
            console.error('Logout error clearing tokens:', e);
        }
        setAuthToken(null);
        setUser(null);
    };

    useEffect(() => {
        // Register auto-logout on 401
        setLogoutCallback(() => {
            logout();
        });

        // Check for stored token on load
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (token) {
                setAuthToken(token);
                // Attempt to restore profile
                await fetchUserProfile();
            }
        } catch (e) {
            console.error('Failed to restore session:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        let profileData = null;
        let userType = '';

        try {
            // Check housewife first
            const hwResponse = await api.get('housewives/me/');
            profileData = hwResponse.data;
            userType = 'housewife';
        } catch (hwError) {
            // Check helper if not housewife
            if (hwError.response?.status === 404 || hwError.response?.status !== 401) {
                try {
                    const hResponse = await api.get('helpers/me/');
                    profileData = hResponse.data;
                    userType = 'helper';
                } catch (hError) {
                    console.log('No specific profile found');
                }
            }
        }

        if (profileData) {
            const userData = {
                ...profileData.user,
                profile: profileData,
                type: userType,
            };
            setUser(userData);
            return userData;
        }
        return null;
    };

    const login = async (username, password) => {
        try {
            const response = await api.post('token/', { username, password });
            const { access, refresh } = response.data;
            
            // Persist tokens
            await SecureStore.setItemAsync('access_token', access);
            await SecureStore.setItemAsync('refresh_token', refresh);
            
            setAuthToken(access);

            // Get profile
            const userData = await fetchUserProfile();
            
            if (!userData) {
                // Fallback for user without profile yet
                setUser({ username, type: 'unknown' });
            }

            return { success: true, userData };
        } catch (error) {
            return { success: false, message: error.response?.data?.detail || 'Login failed. Check your credentials.' };
        }
    };

    const updateUser = (updatedProfile, userType) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                ...updatedProfile.user,
                profile: updatedProfile,
                type: userType || prevUser.type,
            };
        });
    };

    const refreshUser = async () => {
        await fetchUserProfile();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
