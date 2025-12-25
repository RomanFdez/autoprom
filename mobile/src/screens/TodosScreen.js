import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { CheckSquare, Square, Trash2, Plus } from 'lucide-react-native';

export default function TodosScreen() {
    const { todos, addTodo, toggleTodo, deleteTodo } = useData();
    const { theme } = useTheme();
    const [newText, setNewText] = useState('');

    const handleAdd = () => {
        if (!newText.trim()) return;
        addTodo({ text: newText.trim(), done: false, createdAt: new Date().toISOString() });
        setNewText('');
    };

    const sortedTodos = [...(todos || [])].sort((a, b) => {
        if (a.done === b.done) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.done ? 1 : -1;
    });

    const renderItem = ({ item }) => (
        <View style={[styles.item, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
            <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.checkArea}>
                {item.done ?
                    <CheckSquare size={22} color="#4caf50" /> :
                    <Square size={22} color={theme.colors.textSecondary} />
                }
            </TouchableOpacity>
            <Text
                style={[
                    styles.itemText,
                    { color: theme.colors.text },
                    item.done && { textDecorationLine: 'line-through', color: theme.colors.textSecondary }
                ]}
                onPress={() => toggleTodo(item.id)}
            >
                {item.text}
            </Text>
            <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteBtn}>
                <Trash2 size={18} color="#f44336" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Lista de Tareas</Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Escribe una nueva tarea..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={newText}
                    onChangeText={setNewText}
                />
                <TouchableOpacity
                    style={[styles.addBtn, !newText.trim() && styles.addBtnDisabled]}
                    onPress={handleAdd}
                    disabled={!newText.trim()}
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sortedTodos}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No tienes tareas pendientes.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    addBtn: {
        backgroundColor: '#2196f3',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnDisabled: {
        backgroundColor: '#ccc',
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#eee', // Use theme border in real logic, but here hardcoded for simplicity modification or use theme.colors.border if accessible in styles (it is not directly, need to inject or inline).
        // Actually, I can rely on inline style for border/bg I added in renderItem, but here I define base structure.
        // Removing shadow and borderRadius for a cleaner "list" look as per "más limpia" usually implies flat list vs cards.
        gap: 12,
    },
    checkArea: {
        padding: 4,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
    },
    deleteBtn: {
        padding: 8,
    },
    empty: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: {
    }
});
