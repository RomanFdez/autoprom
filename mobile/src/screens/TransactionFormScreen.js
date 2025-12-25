import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, Switch,
    TouchableOpacity, ScrollView, Modal, Platform
} from 'react-native';
import { useData } from '../context/DataContext';
import { getIcon } from '../utils/icons';
import { X, Pin } from 'lucide-react-native';

export default function TransactionFormScreen({ visible, onClose, initialData = null }) {
    const { categories, tags, addTransaction, updateTransaction } = useData();

    // Form State
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    // Simple date handling for now (YYYY-MM-DD string)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setType(initialData.amount >= 0 ? 'income' : 'expense');
                setAmount(Math.abs(initialData.amount).toString());
                setDescription(initialData.description || '');
                setDate(initialData.date.split('T')[0]);
                setCategoryId(initialData.categoryId || '');
                setSelectedTagIds(initialData.tagIds || []);
                setIsPinned(!!initialData.isPinned);
            } else {
                // Reset defaults
                setType('expense');
                setAmount('');
                setDescription('');
                setDate(new Date().toISOString().split('T')[0]);
                setSelectedTagIds([]);
                setIsPinned(false);

                // Select first valid category
                const firstExp = categories.find(c => c.showInExpense !== false);
                if (firstExp) setCategoryId(firstExp.id);
            }
        }
    }, [visible, initialData]);

    const handleTypeChange = (newType) => {
        setType(newType);
        // Switch category if current invalid
        const currentCat = categories.find(c => c.id === categoryId);
        const isValid = currentCat && (newType === 'income' ? currentCat.showInIncome !== false : currentCat.showInExpense !== false);

        if (!isValid) {
            const firstValid = categories.find(c => {
                if (newType === 'income') return c.showInIncome !== false;
                return c.showInExpense !== false;
            });
            if (firstValid) setCategoryId(firstValid.id);
        }
    };

    const toggleTag = (id) => {
        if (selectedTagIds.includes(id)) {
            setSelectedTagIds(selectedTagIds.filter(tid => tid !== id));
        } else {
            setSelectedTagIds([...selectedTagIds, id]);
        }
    };

    const handleSubmit = () => {
        if (!amount || !categoryId) return;

        const finalAmount = parseFloat(amount) * (type === 'expense' ? -1 : 1);
        const transaction = {
            id: initialData?.id,
            amount: finalAmount,
            description,
            date,
            categoryId,
            tagIds: selectedTagIds,
            isPinned
        };

        if (initialData) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{initialData ? 'Editar' : 'Nueva'} Transacción</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X color="#333" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.form}>
                    {/* Type Toggle */}
                    <View style={styles.typeContainer}>
                        <TouchableOpacity
                            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                            onPress={() => handleTypeChange('expense')}
                        >
                            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Gasto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                            onPress={() => handleTypeChange('income')}
                        >
                            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Ingreso</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Importe</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            keyboardType="numeric"
                            autoFocus={!initialData}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Concepto</Text>
                        <TextInput
                            style={styles.input}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ej. Supermercado"
                        />
                    </View>

                    {/* Date & Pin */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.pinBtn, isPinned && styles.pinBtnActive]}
                            onPress={() => setIsPinned(!isPinned)}
                        >
                            <Pin color={isPinned ? '#2196f3' : '#666'} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Categories */}
                    <Text style={styles.sectionTitle}>Categoría</Text>
                    <View style={styles.grid}>
                        {categories.map(cat => {
                            // Helper logic duplicated from web
                            if (type === 'income' && cat.showInIncome === false) return null;
                            if (type === 'expense' && cat.showInExpense === false) return null;

                            const isSelected = categoryId === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.catItem,
                                        isSelected && { backgroundColor: cat.color + '20', borderColor: cat.color }
                                    ]}
                                    onPress={() => setCategoryId(cat.id)}
                                >
                                    <View style={[styles.iconWrapper, { backgroundColor: isSelected ? cat.color : '#f0f0f0' }]}>
                                        {getIcon(cat.icon, 20, isSelected ? 'white' : '#666')}
                                    </View>
                                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Tags */}
                    <Text style={styles.sectionTitle}>Etiquetas</Text>
                    <View style={styles.tagsContainer}>
                        {tags.map(tag => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.tagChip,
                                        isSelected && { backgroundColor: tag.color }
                                    ]}
                                    onPress={() => toggleTag(tag.id)}
                                >
                                    <Text style={[styles.tagText, isSelected && { color: 'white' }]}>{tag.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    form: {
        padding: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeBtnActiveExpense: {
        backgroundColor: '#fff',
        shadowColor: '#f44336',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    typeBtnActiveIncome: {
        backgroundColor: '#fff',
        shadowColor: '#4caf50',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    typeText: {
        fontWeight: '600',
        color: '#666',
    },
    typeTextActive: {
        color: '#333',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 8,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    pinBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginTop: 18, // Align with input
    },
    pinBtnActive: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    catItem: {
        width: '30%',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: '#f9f9f9',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    catName: {
        fontSize: 11,
        textAlign: 'center',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 40,
    },
    tagChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
    },
    tagText: {
        fontSize: 14,
        color: '#333',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    submitBtn: {
        backgroundColor: '#4caf50',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
