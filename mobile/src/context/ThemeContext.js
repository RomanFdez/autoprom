import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', 'system'

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await SecureStore.getItemAsync('theme_preference');
            if (savedTheme) {
                setThemePreference(savedTheme);
            }
        } catch (e) {
            console.log('Error loading theme', e);
        }
    };

    const setTheme = async (pref) => {
        setThemePreference(pref);
        await SecureStore.setItemAsync('theme_preference', pref);
    };

    // Calculate actual theme based on preference and system setting
    const isDark = themePreference === 'system' ? systemScheme === 'dark' : themePreference === 'dark';

    const theme = {
        isDark,
        colors: isDark ? {
            background: '#121212',
            surface: '#1e1e1e',
            surfaceVariant: '#2c2c2c',
            text: '#ffffff',
            textSecondary: '#a0a0a0',
            border: '#333333',
            primary: '#90caf9',
            card: '#1e1e1e',
            tint: '#ffffff'
        } : {
            background: '#f5f5f5',
            surface: '#ffffff',
            surfaceVariant: '#f0f0f0',
            text: '#333333',
            textSecondary: '#666666',
            border: '#eeeeee',
            primary: '#2196f3',
            card: '#ffffff',
            tint: '#333333'
        }
    };

    return (
        <ThemeContext.Provider value={{ themePreference, setTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
