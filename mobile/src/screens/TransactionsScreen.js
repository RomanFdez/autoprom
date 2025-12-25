import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit2, Copy, Trash2, Calendar, Tag } from 'lucide-react-native';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getIcon } from '../utils/icons';
import TransactionFormScreen from './TransactionFormScreen';
import SearchModal from '../components/SearchModal';
import AppHeader from '../components/AppHeader';

export default function TransactionsScreen() {
    const { transactions, categories, tags, removeTransaction, addTransaction, settings } = useData();
    const { theme } = useTheme();

    const [filter, setFilter] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [editingTx, setEditingTx] = useState(null);

    // Calculate Balance
    const totalBalance = useMemo(() => {
        const initial = settings?.initialBalance || 0;
        const totalTx = transactions.reduce((acc, t) => acc + t.amount, 0);
        return initial + totalTx;
    }, [transactions, settings]);

    const filteredTransactions = useMemo(() => {
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filter === 'all') return sorted;
        return sorted.filter(t => {
            const date = parseISO(t.date);
            if (filter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
            if (filter === 'month') return isThisMonth(date);
            return true;
        });
    }, [transactions, filter]);

    const handleEdit = (tx) => {
        setEditingTx(tx);
        setModalVisible(true);
    };

    const handleDuplicate = (tx) => {
        Alert.alert('Duplicar', '¿Quieres duplicar esta transacción?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Duplicar',
                onPress: () => {
                    const { id, ...rest } = tx;
                    addTransaction({ ...rest, description: `${rest.description} (Copia)` });
                }
            }
        ]);
    };

    const handleDelete = (id) => {
        Alert.alert('Eliminar', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removeTransaction(id) }
        ]);
    };

    const handleSearchResult = (tx) => {
        setSearchVisible(false);
        handleEdit(tx);
    };

    const getCategoryDetails = (catId) => categories.find(c => c.id === catId) || { name: '?', color: '#999', icon: 'help' };

    const renderItem = ({ item }) => {
        const cat = getCategoryDetails(item.categoryId);
        const itemTags = (item.tagIds || []).map(tid => tags.find(t => t.id === tid)).filter(Boolean);
        const formattedDate = format(parseISO(item.date), 'dd MMM', { locale: es });

        return (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? 'transparent' : '#000' }]}>
                {/* Left: Icon */}
                <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
                    {getIcon(cat.icon, 18, cat.color)}
                </View>

                {/* Middle: Content */}
                <View style={styles.cardContent}>
                    <Text style={[styles.desc, { color: theme.colors.text }]} numberOfLines={1}>{item.description}</Text>

                    {/* Compact Meta Line: Category • Date */}
                    <View style={styles.metaLine}>
                        <Text style={[styles.metaText, { color: cat.color, fontWeight: '600' }]}>{cat.name}</Text>
                        <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}> • {formattedDate}</Text>
                    </View>

                    {/* Tags on new line, wrapping */}
                    {itemTags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {itemTags.map((t) => (
                                <View key={t.id} style={{ backgroundColor: t.color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{t.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Right: Amount & Actions Column */}
                <View style={styles.rightCol}>
                    <Text style={[styles.amount, { color: item.amount > 0 ? '#4caf50' : (item.amount < 0 ? '#f44336' : theme.colors.text) }]}>
                        {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(0)}€
                    </Text>
                </View>

                {/* Far Right: Vertical Actions Strip */}
                <View style={[styles.actionsStrip, { borderLeftColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.miniBtn}><Edit2 size={16} color={theme.colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDuplicate(item)} style={styles.miniBtn}><Copy size={16} color={theme.colors.textSecondary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.miniBtn}><Trash2 size={16} color="#f44336" /></TouchableOpacity>
                </View>
            </View>
        );
    };

    const FilterChip = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }, filter === value && { backgroundColor: theme.colors.primary }]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, filter === value && { color: 'white' }]}>{label}</Text>
        </TouchableOpacity>
    );

    const getBalanceColor = (bal) => {
        if (bal > 0) return '#4caf50';
        if (bal < 0) return '#f44336';
        return theme.colors.text;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

            {/* Header with Search */}
            <AppHeader title="Transacciones" onSearchPress={() => setSearchVisible(true)} />

            {/* Balance + Filters */}
            <View style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 8 }}>
                <View style={styles.balanceHeader}>
                    <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>Saldo Total</Text>
                    <Text style={[styles.balanceAmount, { color: getBalanceColor(totalBalance) }]}>{totalBalance.toFixed(2)} €</Text>
                </View>
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterScroll, { flexGrow: 1, justifyContent: 'center' }]}>
                        <FilterChip label="Esta semana" value="week" />
                        <FilterChip label="Este mes" value="month" />
                        <FilterChip label="Todo el tiempo" value="all" />
                    </ScrollView>
                </View>
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity style={styles.fab} onPress={() => { setEditingTx(null); setModalVisible(true); }}>
                <Plus color="white" size={32} />
            </TouchableOpacity>

            <TransactionFormScreen visible={modalVisible} onClose={() => setModalVisible(false)} initialData={editingTx} />
            <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} onSelectTransaction={handleSearchResult} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    balanceHeader: { alignItems: 'center', paddingVertical: 12 },
    balanceLabel: { fontSize: 12, fontWeight: '500' },
    balanceAmount: { fontSize: 24, fontWeight: 'bold' },
    filtersContainer: { paddingBottom: 12 },
    filterScroll: { paddingHorizontal: 16, gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
    chipText: { fontWeight: '500', fontSize: 12 },
    list: { padding: 12, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
        alignItems: 'center',
        height: 72, // Increased height
        overflow: 'hidden'
    },
    iconBox: {
        width: 40,
        height: 72, // Match card height
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 4,
        paddingVertical: 4
    },
    desc: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    metaLine: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 11 },
    rightCol: { paddingRight: 8, justifyContent: 'center', alignItems: 'flex-end', minWidth: 70 },
    amount: { fontSize: 15, fontWeight: 'bold' },
    actionsStrip: {
        width: 40, // Increased width for better touch target and visibility
        height: '100%',
        borderLeftWidth: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    miniBtn: { padding: 4 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4caf50', justifyContent: 'center', alignItems: 'center', elevation: 6 }
});
