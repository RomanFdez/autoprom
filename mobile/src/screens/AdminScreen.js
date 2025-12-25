import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';

import { useTheme } from '../context/ThemeContext';
import { getIcon } from '../utils/icons';
import { Plus, Trash2, Edit2, X, Save, Lock, Download, Upload, LogOut, Check, Sun, Moon, Settings } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ... (Colors and Icons arrays remain same) ...
const COLORS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];
const ICONS = [
    'category', 'trending_up', 'description', 'landscape', 'construction',
    'home', 'chair', 'devices', 'handyman', 'security',
    'coffee', 'utensils', 'beer', 'wine',
    'shopping_cart', 'shopping_bag', 'gift',
    'money', 'heart', 'activity', 'person', 'briefcase',
    'film', 'tv', 'gamepad', 'music',
    'zap', 'droplet', 'wifi',
    'local_shipping', 'plane', 'bus', 'train',
    'school', 'book',
    'impuestos', 'documentos', 'notaria'
];

export default function AdminScreen() {
    const {
        categories, tags, settings,
        addCategory, updateCategory, removeCategory,
        addTag, updateTag, removeTag,
        updateSettings, importData, loading: dataLoading,
        transactions // needed for export
    } = useData();

    const { themePreference, setTheme, theme } = useTheme();

    // UI State
    const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'tags' | 'settings' | 'backup'
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#4caf50');
    const [icon, setIcon] = useState('category');
    const [debt, setDebt] = useState('0');

    // Settings State
    const [balanceInput, setBalanceInput] = useState(settings?.initialBalance?.toString() || '0');

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setName(item.name);
            setColor(item.color);
            if (activeTab === 'categories') {
                setIcon(item.icon);
                setDebt((item.debt || 0).toString());
            }
        } else {
            setName('');
            setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
            setIcon('category');
            setDebt('0');
        }
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        const payload = { id: editingItem?.id, name, color };

        if (activeTab === 'categories') {
            payload.icon = icon;
            payload.debt = parseFloat(debt) || 0;
            if (!editingItem) {
                payload.showInExpense = true;
                payload.showInIncome = true;
            } else {
                Object.assign(payload, {
                    showInExpense: editingItem.showInExpense,
                    showInIncome: editingItem.showInIncome,
                    isFixed: editingItem.isFixed
                });
            }
            if (editingItem) updateCategory(payload); else addCategory(payload);
        } else {
            if (editingItem) updateTag(payload); else addTag(payload);
        }
        setModalVisible(false);
    };

    const handleDelete = (id) => {
        Alert.alert('Eliminar', '¿Estás seguro?', [{ text: 'Cancelar' }, { text: 'Eliminar', style: 'destructive', onPress: () => activeTab === 'categories' ? removeCategory(id) : removeTag(id) }]);
    };

    const handleUpdateBalance = () => {
        updateSettings({ initialBalance: parseFloat(balanceInput) });
        Alert.alert('Éxito', 'Saldo inicial actualizado');
    };

    // ... (Backup/Restore handlers same) ...
    const handleBackup = async () => {
        try {
            const data = {
                transactions,
                categories,
                tags,
                settings
            };
            const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    UTI: 'public.json',
                    mimeType: 'application/json',
                    dialogTitle: 'Guardar copia de seguridad'
                });
            } else {
                Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
            }
        } catch (error) {
            console.error('Backup error:', error);
            Alert.alert('Error', 'Hubo un problema al generar la copia de seguridad');
        }
    };

    const handleRestore = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            if (result.canceled) return;

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);
            const data = JSON.parse(content);

            if (data.transactions && data.categories) {
                Alert.alert(
                    'Restaurar Datos',
                    'Esto sobrescribirá todos los datos actuales. ¿Continuar?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Restaurar',
                            style: 'destructive',
                            onPress: () => {
                                importData(data);
                                Alert.alert('Éxito', 'Datos restaurados correctamente');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', 'Formato de archivo inválido');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo leer el archivo');
        }
    };

    const renderCategoryItem = (item) => {
        // Calculate remaining debt
        const totalTx = transactions.filter(t => t.categoryId === item.id).reduce((acc, t) => acc + t.amount, 0);
        const initialDebt = item.debt || 0;
        const currentDebt = initialDebt + totalTx; // Expenses are negative, so they reduce the initial positive debt

        return (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.itemLeft}>
                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>{getIcon(item.icon, 20, item.color)}</View>
                    <View>
                        <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                        {initialDebt > 0 && (
                            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                                Deuda: {currentDebt.toFixed(2)}€ / {initialDebt.toFixed(0)}€
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}><Edit2 size={18} color={theme.colors.textSecondary} /></TouchableOpacity>
                    {!item.isFixed && <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}><Trash2 size={18} color="#f44336" /></TouchableOpacity>}
                </View>
            </View>
        );
    };

    const renderTagItem = (item) => (
        <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.itemLeft}>
                <View style={[styles.tagBadge, { backgroundColor: item.color }]}><Text style={styles.tagText}>{item.name}</Text></View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}><Edit2 size={18} color={theme.colors.textSecondary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}><Trash2 size={18} color="#f44336" /></TouchableOpacity>
            </View>
        </View>
    );

    const renderSettings = () => (
        <View style={styles.settingsContainer}>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Saldo Inicial</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text, borderColor: theme.colors.border }]}
                        value={balanceInput}
                        onChangeText={setBalanceInput}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleUpdateBalance}>
                        <Save size={18} color="white" />
                        <Text style={styles.btnText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Gestión de Datos</Text>
                <View style={styles.row}>
                    <TouchableOpacity style={[styles.btnOutline, { flex: 1, borderColor: theme.colors.border }]} onPress={handleBackup}>
                        <Download size={18} color={theme.colors.text} />
                        <Text style={[styles.btnOutlineText, { color: theme.colors.text }]}>Backup</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnOutline, { flex: 1, borderColor: theme.colors.border }]} onPress={handleRestore}>
                        <Upload size={18} color={theme.colors.text} />
                        <Text style={[styles.btnOutlineText, { color: theme.colors.text }]}>Restaurar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Apariencia</Text>
                <View style={styles.themeRow}>
                    <TouchableOpacity
                        style={[styles.themeOption, { backgroundColor: theme.colors.surfaceVariant }, themePreference === 'light' && styles.themeActive]}
                        onPress={() => setTheme('light')}
                    >
                        <Sun size={20} color={themePreference === 'light' ? 'white' : theme.colors.textSecondary} />
                        <Text style={[styles.themeText, themePreference === 'light' && styles.themeTextActive]}>Claro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.themeOption, { backgroundColor: theme.colors.surfaceVariant }, themePreference === 'dark' && styles.themeActive]}
                        onPress={() => setTheme('dark')}
                    >
                        <Moon size={20} color={themePreference === 'dark' ? 'white' : theme.colors.textSecondary} />
                        <Text style={[styles.themeText, themePreference === 'dark' && styles.themeTextActive]}>Oscuro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.themeOption, { backgroundColor: theme.colors.surfaceVariant }, themePreference === 'system' && styles.themeActive]}
                        onPress={() => setTheme('system')}
                    >
                        <Settings size={20} color={themePreference === 'system' ? 'white' : theme.colors.textSecondary} />
                        <Text style={[styles.themeText, themePreference === 'system' && styles.themeTextActive]}>Sistema</Text>
                    </TouchableOpacity>
                </View>
            </View>


        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Administración</Text>
            </View>

            <View style={styles.tabs}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={[styles.tab, { backgroundColor: theme.colors.surfaceVariant }, activeTab === 'categories' && { backgroundColor: theme.colors.primary }]} onPress={() => setActiveTab('categories')}>
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === 'categories' && styles.activeTabText]}>Categorías</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, { backgroundColor: theme.colors.surfaceVariant }, activeTab === 'tags' && { backgroundColor: theme.colors.primary }]} onPress={() => setActiveTab('tags')}>
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === 'tags' && styles.activeTabText]}>Etiquetas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, { backgroundColor: theme.colors.surfaceVariant }, activeTab === 'settings' && { backgroundColor: theme.colors.primary }]} onPress={() => setActiveTab('settings')}>
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, activeTab === 'settings' && styles.activeTabText]}>Configuración</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'categories' && categories.map(renderCategoryItem)}
                {activeTab === 'tags' && tags.map(renderTagItem)}
                {activeTab === 'settings' && renderSettings()}
            </ScrollView>

            {(activeTab === 'categories' || activeTab === 'tags') && (
                <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal(null)}>
                    <Plus color="white" size={32} />
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{editingItem ? 'Editar' : 'Nueva'} {activeTab === 'categories' ? 'Categoría' : 'Etiqueta'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={theme.colors.text} /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalForm}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text, borderColor: theme.colors.border }]}
                            value={name}
                            onChangeText={setName}
                        />

                        {activeTab === 'categories' && (
                            <>
                                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Deuda Inicial / Objetivo</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text, borderColor: theme.colors.border }]}
                                    value={debt}
                                    onChangeText={setDebt}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </>
                        )}

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Color</Text>
                        <View style={styles.colorGrid}>
                            {COLORS.map(c => (
                                <TouchableOpacity key={c} style={[styles.colorCircle, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: theme.colors.text }]} onPress={() => setColor(c)} />
                            ))}
                        </View>

                        {activeTab === 'categories' && (
                            <>
                                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Icono</Text>
                                <View style={styles.iconGrid}>
                                    {ICONS.map(ic => (
                                        <TouchableOpacity key={ic} style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceVariant }, icon === ic && { borderColor: color, backgroundColor: color + '20' }]} onPress={() => setIcon(ic)}>
                                            {getIcon(ic, 24, icon === ic ? color : theme.colors.textSecondary)}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>
                    <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveText}>Guardar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', padding: 10, gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10 },
    activeTab: { backgroundColor: '#333' },
    tabText: { fontWeight: '600' },
    activeTabText: { color: 'white' },
    content: { padding: 16, gap: 10, paddingBottom: 100 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 1 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: '500' },
    tagBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    tagText: { color: 'white', fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 16 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4caf50', justifyContent: 'center', alignItems: 'center', elevation: 6 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalForm: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: { padding: 12, borderRadius: 12, fontSize: 16, borderWidth: 1 },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    colorCircle: { width: 36, height: 36, borderRadius: 18 },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    modalFooter: { padding: 20, borderTopWidth: 1 },
    saveBtn: { backgroundColor: '#4caf50', padding: 16, borderRadius: 16, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    // Settings specific
    settingsContainer: { gap: 16 },
    card: { padding: 16, borderRadius: 16, gap: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    btnPrimary: { backgroundColor: '#4caf50', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    btnText: { color: 'white', fontWeight: 'bold' },
    btnOutline: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    btnOutlineText: { fontWeight: '500' },
    themeRow: { flexDirection: 'row', gap: 12 },
    themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    themeActive: { backgroundColor: '#333' },
    themeText: { fontWeight: '600', color: '#666' },
    themeTextActive: { color: 'white' }
});
