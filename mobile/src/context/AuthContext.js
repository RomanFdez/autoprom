import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        // Auto-login as requested
        setUser({ username: 'admin' });
        setLoading(false);
    };

    const login = async (username, password) => {
        try {
            const response = await client.post('/login', { username, password });
            if (response.data && response.data.token) {
                const { token, user } = response.data;
                await SecureStore.setItemAsync('authToken', token);
                await SecureStore.setItemAsync('authUser', JSON.stringify(user));
                setUser(user);
                return true;
            }
        } catch (e) {
            console.error('Login failed', e);
        }
        return false;
    };

    const logout = async () => {
        try {
            await client.post('/logout'); // Try to notify server
        } catch (e) {
            // Ignore error on logout
        }
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('authUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
