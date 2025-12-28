import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Calendar, Tag } from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getIcon } from '../utils/icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SearchModal({ visible, onClose, onSelectTransaction }) {
    const { transactions, categories, tags } = useData();
    const { theme } = useTheme();
    const [query, setQuery] = useState('');

    const filteredTransactions = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQ = query.toLowerCase();

        return transactions.filter(t => {
            // Find related data
            const cat = categories.find(c => c.id === t.categoryId);
            const tTags = (t.tagIds || []).map(tid => tags.find(tg => tg.id === tid)).filter(Boolean);

            // Check Description
            if (t.description?.toLowerCase().includes(lowerQ)) return true;

            // Check Amount
            if (t.amount.toString().includes(lowerQ)) return true;

            // Check Category Name
            if (cat?.name.toLowerCase().includes(lowerQ)) return true;

            // Check Date
            if (t.date.includes(lowerQ)) return true;

            // Check Tags
            if (tTags.some(tag => tag.name.toLowerCase().includes(lowerQ))) return true;

            return false;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [query, transactions, categories, tags]);

    const renderItem = ({ item }) => {
        const cat = categories.find(c => c.id === item.categoryId) || { name: '?', color: '#999', icon: 'help' };

        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: theme.colors.border }]}
                onPress={() => onSelectTransaction(item)}
            >
                <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
                    {getIcon(cat.icon, 18, cat.color)}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={[styles.desc, { color: theme.colors.text }]}>{item.description}</Text>
                    <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
                        {format(parseISO(item.date), 'dd MMM yyyy', { locale: es })} • {cat.name}
                    </Text>
                </View>
                <Text style={[styles.amount, { color: item.amount >= 0 ? '#4caf50' : '#f44336' }]}>
                    {item.amount.toFixed(2)} €
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Search size={20} color={theme.colors.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.text }]}
                            placeholder="Buscar transacciones..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <X size={18} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Cancelar</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredTransactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        query.trim() ? (
                            <View style={styles.empty}>
                                <Text style={{ color: theme.colors.textSecondary }}>No se encontraron resultados</Text>
                            </View>
                        ) : null
                    }
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    cancelBtn: {
        padding: 4,
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    desc: {
        fontSize: 16,
        fontWeight: '500',
    },
    sub: {
        fontSize: 12,
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    empty: {
        marginTop: 40,
        alignItems: 'center',
    }
});
