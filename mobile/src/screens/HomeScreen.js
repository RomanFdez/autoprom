import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-gifted-charts';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext'; // IMPORT THEME
import DrilldownModal from '../components/DrilldownModal';
import SearchModal from '../components/SearchModal'; // IMPORT SEARCH
import AppHeader from '../components/AppHeader';     // IMPORT HEADER
import TransactionFormScreen from './TransactionFormScreen'; // For editing result

export default function HomeScreen() {
    const { transactions, categories, tags, refreshData } = useData();
    const { theme } = useTheme(); // USE THEME

    const [viewType, setViewType] = useState('expense');
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [drilldownVisible, setDrilldownVisible] = useState(false);
    const [drilldownData, setDrilldownData] = useState({ title: '', transactions: [], color: '' });
    const [searchVisible, setSearchVisible] = useState(false);
    const [editTx, setEditTx] = useState(null);
    const [editVisible, setEditVisible] = useState(false);

    // State for interactive charts
    const [focusedSection, setFocusedSection] = useState(null);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    }, [refreshData]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (viewType === 'income') return t.amount > 0;
            return t.amount < 0;
        });
    }, [transactions, viewType]);

    const totalAmount = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    }, [filteredTransactions]);

    const categoryData = useMemo(() => {
        const grouped = {};
        filteredTransactions.forEach(t => {
            if (!t.categoryId) return;
            if (!grouped[t.categoryId]) {
                const cat = categories.find(c => c.id === t.categoryId) || { name: 'Desconocido', color: '#999', icon: 'help' };
                grouped[t.categoryId] = { ...cat, value: 0, transactions: [] };
            }
            grouped[t.categoryId].value += Math.abs(t.amount);
            grouped[t.categoryId].transactions.push(t);
        });
        return Object.values(grouped).sort((a, b) => b.value - a.value).map(item => ({
            ...item,
            text: '',
            color: item.color,
            // Gifted Charts props
            value: item.value,
            onPress: () => setFocusedSection({ ...item, type: 'category' }),
            focused: focusedSection?.id === item.id
        }));
    }, [filteredTransactions, categories, focusedSection]);

    const tagData = useMemo(() => {
        // Similar logic for Tags
        const grouped = {};
        let hasUntagged = false;
        const untaggedTxs = [];
        filteredTransactions.forEach(t => {
            if (!t.tagIds || t.tagIds.length === 0) {
                hasUntagged = true;
                untaggedTxs.push(t);
                return;
            }
            t.tagIds.forEach(tid => {
                if (!grouped[tid]) {
                    const tag = tags.find(tg => tg.id === tid) || { name: 'Desconocido', color: '#999' };
                    grouped[tid] = { ...tag, value: 0, transactions: [] };
                }
                grouped[tid].value += Math.abs(t.amount);
                grouped[tid].transactions.push(t);
            });
        });
        const result = Object.values(grouped);
        if (hasUntagged) result.push({ name: 'Sin Etiqueta', color: '#e0e0e0', value: untaggedTxs.reduce((acc, t) => acc + Math.abs(t.amount), 0), transactions: untaggedTxs, id: 'untagged' });

        return result.sort((a, b) => b.value - a.value).map(item => ({
            ...item,
            text: '',
            color: item.color,
            onPress: () => setFocusedSection({ ...item, type: 'tag' }),
            focused: focusedSection?.id === item.id
        }));
    }, [filteredTransactions, tags, focusedSection]);

    const handleDrilldown = (item) => {
        setDrilldownData({ title: item.name, color: item.color, transactions: item.transactions });
        setDrilldownVisible(true);
    };

    const renderChart = (data, title) => {
        if (data.length === 0) return (
            <View style={styles.chartContainer}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
                <View style={[styles.emptyChart, { backgroundColor: theme.colors.surface }]}>
                    <Text style={{ color: theme.colors.textSecondary }}>Sin datos</Text>
                </View>
            </View>
        );

        const centerLabel = focusedSection ? (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' }}>{focusedSection.name}</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>{focusedSection.value.toFixed(0)}€</Text>
            </View>
        ) : (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>TOTAL</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}>{totalAmount.toFixed(0)}€</Text>
            </View>
        );

        return (
            <View style={styles.chartContainer}>
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
                <TouchableWithoutFeedback onPress={() => setFocusedSection(null)}>
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <PieChart
                            data={data}
                            donut
                            showText={false}
                            radius={100}
                            innerRadius={70}
                            innerCircleColor={theme.colors.background}
                            centerLabelComponent={() => centerLabel}
                            focusOnPress
                            toggleFocusOnPress
                            onPress={(item) => setFocusedSection(item)}
                        />
                    </View>
                </TouchableWithoutFeedback>
                {/* Interactive Info Card */}
                {focusedSection && data.find(d => d.id === focusedSection.id) && (
                    <TouchableOpacity
                        style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: focusedSection.color }]}
                        onPress={() => handleDrilldown(focusedSection)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: focusedSection.color }} />
                            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{focusedSection.name}</Text>
                        </View>
                        <Text style={[styles.infoAmount, { color: theme.colors.text }]}>{focusedSection.value.toFixed(2)} €</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Toca para ver detalles</Text>
                    </TouchableOpacity>
                )}

                {/* List fallback if no selection */}
                {!focusedSection && (
                    <View style={[styles.legendContainer, { backgroundColor: theme.colors.surface }]}>
                        {data.map((item, index) => (
                            <TouchableOpacity key={index} style={[styles.legendItem, { borderBottomColor: theme.colors.border }]} onPress={() => handleDrilldown(item)}>
                                <View style={styles.legendLeft}>
                                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.legendName, { color: theme.colors.text }]}>{item.name}</Text>
                                </View>
                                <Text style={[styles.legendValue, { color: theme.colors.text }]}>{item.value.toFixed(0)} €</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

            {/* Header without Search */}
            <AppHeader title="Resumen" />

            <View style={styles.header}>
                <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewType === 'expense' && { backgroundColor: theme.colors.surface }]}
                        onPress={() => { setViewType('expense'); setFocusedSection(null); }}
                    >
                        <Text style={[styles.toggleText, viewType === 'expense' && { color: '#f44336', fontWeight: 'bold' }]}>Gastos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewType === 'income' && { backgroundColor: theme.colors.surface }]}
                        onPress={() => { setViewType('income'); setFocusedSection(null); }}
                    >
                        <Text style={[styles.toggleText, viewType === 'income' && { color: '#4caf50', fontWeight: 'bold' }]}>Ingresos</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
            >
                {renderChart(categoryData, 'Por Categoría')}
                {renderChart(tagData, 'Por Etiquetas')}
            </ScrollView>

            <DrilldownModal
                visible={drilldownVisible}
                onClose={() => setDrilldownVisible(false)}
                title={drilldownData.title}
                color={drilldownData.color}
                transactions={drilldownData.transactions}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16 },
    toggleContainer: { flexDirection: 'row', borderRadius: 30, padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 24 },
    toggleText: { color: '#999', fontWeight: '600' },
    scrollContent: { paddingBottom: 20 },
    chartContainer: { marginBottom: 24, paddingHorizontal: 16 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    legendContainer: { marginTop: 20, borderRadius: 16, padding: 8 },
    legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1 },
    legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendName: { fontSize: 14 },
    legendValue: { fontWeight: 'bold', fontSize: 14 },
    infoCard: {
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
        width: '100%'
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600'
    },
    infoAmount: {
        fontSize: 24,
        fontWeight: 'bold'
    }
});
