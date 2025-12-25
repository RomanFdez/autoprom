import React from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

export default function DrilldownModal({ visible, onClose, title, transactions, color }) {

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.itemInfo}>
                <Text style={styles.desc}>{item.description || 'Sin descripción'}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={[styles.amount, { color: item.amount >= 0 ? '#4caf50' : '#f44336' }]}>
                {item.amount.toFixed(2)} €
            </Text>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <View style={[styles.indicator, { backgroundColor: color || '#666' }]} />
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X color="#333" size={24} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text>No hay transacciones</Text>
                        </View>
                    }
                />
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    list: {
        padding: 20,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemInfo: {
        gap: 4,
    },
    desc: {
        fontSize: 16,
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    empty: {
        padding: 20,
        alignItems: 'center',
    }
});
