import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.select({
    ios: 'http://192.168.88.184:8000/api/v1/', // Use actual machine IP for physical devices
    android: 'http://192.168.88.184:8000/api/v1/', // Use actual machine IP for physical devices
    default: 'http://192.168.88.184:8000/api/v1/',
});

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let logoutCallback = null;

export const setLogoutCallback = (cb) => {
    logoutCallback = cb;
};

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Response interceptor to handle session expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn('Session expired - 401 Unauthorized');
            if (logoutCallback) {
                logoutCallback();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
