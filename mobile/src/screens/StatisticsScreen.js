import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { computeStatistics } from '../utils/statisticsData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

export default function StatisticsScreen() {
    const { transactions, categories, refreshData } = useData();
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    }, [refreshData]);

    const { budgetVsActual, cumulativeSpending, totalBudget } = useMemo(
        () => computeStatistics(transactions, categories),
        [transactions, categories]
    );

    const formatEur = (v) => `${Math.round(v).toLocaleString('es-ES')} €`;

    // Budget vs Actual bar data (grouped bars)
    const budgetBarData = useMemo(() => {
        const data = [];
        budgetVsActual.forEach((item) => {
            data.push({
                value: item.budget,
                frontColor: theme.isDark ? '#555' : '#ccc',
                label: item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name,
                spacing: 2,
                labelWidth: 60,
                labelTextStyle: { color: theme.colors.textSecondary, fontSize: 9 },
            });
            data.push({
                value: item.spent,
                frontColor: item.spent > item.budget ? '#f44336' : item.color,
                spacing: 16,
            });
        });
        return data;
    }, [budgetVsActual, theme]);

    // Cumulative area chart data
    const cumulativeData = useMemo(() => {
        return cumulativeSpending.map((item) => ({
            value: item.cumulative,
            label: item.month,
            labelTextStyle: { color: theme.colors.textSecondary, fontSize: 9, width: 40 },
        }));
    }, [cumulativeSpending, theme]);

    const maxCumulative = cumulativeData.length > 0
        ? Math.max(...cumulativeData.map(d => d.value), totalBudget)
        : totalBudget;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <AppHeader title="Estadísticas" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
            >
                {/* Budget vs Actual */}
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Presupuesto vs Real</Text>
                    {budgetVsActual.length === 0 ? (
                        <View style={[styles.emptyChart, { backgroundColor: theme.colors.surface }]}>
                            <Text style={{ color: theme.colors.textSecondary }}>Sin presupuestos definidos</Text>
                        </View>
                    ) : (
                        <>
                            <View style={{ alignItems: 'center' }}>
                                <BarChart
                                    data={budgetBarData}
                                    barWidth={16}
                                    spacing={2}
                                    noOfSections={4}
                                    width={CHART_WIDTH}
                                    height={200}
                                    yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                                    xAxisColor={theme.colors.border}
                                    yAxisColor={theme.colors.border}
                                    backgroundColor="transparent"
                                    isAnimated
                                    formatYLabel={(v) => `${Math.round(v / 1000)}k`}
                                />
                            </View>

                            {/* Legend */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: theme.isDark ? '#555' : '#ccc' }} />
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Presupuesto</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#4caf50' }} />
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Gastado</Text>
                                </View>
                            </View>

                            {/* Detail list */}
                            <View style={[styles.listContainer, { backgroundColor: theme.colors.surface }]}>
                                {budgetVsActual.map((item) => (
                                    <View key={item.id} style={[styles.listItem, { borderBottomColor: theme.colors.border }]}>
                                        <View style={styles.listLeft}>
                                            <View style={[styles.dot, { backgroundColor: item.spent > item.budget ? '#f44336' : item.color }]} />
                                            <Text style={[styles.listName, { color: theme.colors.text }]}>{item.name}</Text>
                                        </View>
                                        <View style={styles.listRight}>
                                            <Text style={[styles.listSpent, { color: theme.colors.text }]}>{formatEur(item.spent)}</Text>
                                            <Text style={[styles.listBudget, { color: theme.colors.textSecondary }]}> / {formatEur(item.budget)}</Text>
                                            <View style={[styles.pctBadge, item.percentUsed > 100 && styles.pctOver]}>
                                                <Text style={[styles.pctText, item.percentUsed > 100 && { color: '#fff' }]}>
                                                    {item.percentUsed.toFixed(0)}%
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* Cumulative Spending */}
                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Gasto Acumulado</Text>
                    {cumulativeData.length === 0 ? (
                        <View style={[styles.emptyChart, { backgroundColor: theme.colors.surface }]}>
                            <Text style={{ color: theme.colors.textSecondary }}>Sin datos</Text>
                        </View>
                    ) : (
                        <>
                            <View style={{ alignItems: 'center' }}>
                                <LineChart
                                    data={cumulativeData}
                                    areaChart
                                    width={CHART_WIDTH}
                                    height={200}
                                    spacing={CHART_WIDTH / Math.max(cumulativeData.length - 1, 1)}
                                    color="#4caf50"
                                    startFillColor="rgba(76,175,80,0.3)"
                                    endFillColor="rgba(76,175,80,0.05)"
                                    thickness={2}
                                    startOpacity={0.3}
                                    endOpacity={0.05}
                                    noOfSections={4}
                                    yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                                    xAxisColor={theme.colors.border}
                                    yAxisColor={theme.colors.border}
                                    backgroundColor="transparent"
                                    isAnimated
                                    curved
                                    formatYLabel={(v) => `${Math.round(v / 1000)}k`}
                                    maxValue={maxCumulative * 1.1}
                                    showReferenceLine1={totalBudget > 0}
                                    referenceLine1Position={totalBudget}
                                    referenceLine1Config={{ color: '#f44336', dashWidth: 5, dashGap: 3 }}
                                    dataPointsColor="#4caf50"
                                    dataPointsRadius={3}
                                />
                            </View>

                            {/* Summary cards */}
                            <View style={styles.summaryRow}>
                                <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>TOTAL GASTADO</Text>
                                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                                        {formatEur(cumulativeSpending[cumulativeSpending.length - 1]?.cumulative || 0)}
                                    </Text>
                                </View>
                                {totalBudget > 0 && (
                                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
                                        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>PRESUPUESTO</Text>
                                        <Text style={[styles.summaryValue, { color: '#f44336' }]}>{formatEur(totalBudget)}</Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    chartContainer: { marginBottom: 24, paddingHorizontal: 16 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
    emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    listContainer: { marginTop: 16, borderRadius: 16, padding: 8 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1 },
    listLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    listName: { fontSize: 14 },
    listRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    listSpent: { fontWeight: '600', fontSize: 13 },
    listBudget: { fontSize: 12 },
    pctBadge: { backgroundColor: '#e0e0e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 4 },
    pctOver: { backgroundColor: '#f44336' },
    pctText: { fontSize: 11, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
    summaryLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: 'bold' },
});
