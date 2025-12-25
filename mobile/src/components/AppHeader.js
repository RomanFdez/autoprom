import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader({ title, onSearchPress }) {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                {/* Left: Search (Conditional) */}
                {onSearchPress && (
                    <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
                        <Search color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                )}

                {/* Center: Title */}
                <View style={{ flex: 1 }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    iconBtn: {
        padding: 8,
        marginRight: 16,
    }
});
