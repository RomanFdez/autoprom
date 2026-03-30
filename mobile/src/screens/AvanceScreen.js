import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Plus, TrendingUp, ChevronDown, ChevronUp, Edit3, Trash2, Check, X } from 'lucide-react-native';

const CAPITULOS = [
    { id: 'cap-01', nombre: 'Acondicionamiento del terreno', peso: 5.39 },
    { id: 'cap-02', nombre: 'Cimentaciones', peso: 11.86 },
    { id: 'cap-03', nombre: 'Estructuras', peso: 10.33 },
    { id: 'cap-04', nombre: 'Fachadas y particiones', peso: 7.05 },
    { id: 'cap-05', nombre: 'Carpintería, cerrajería, vidrios y protecciones solares', peso: 7.45 },
    { id: 'cap-06', nombre: 'Remates y ayudas', peso: 3.60 },
    { id: 'cap-07', nombre: 'Instalaciones', peso: 5.95 },
    { id: 'cap-08', nombre: 'Aislamientos e impermeabilizaciones', peso: 8.77 },
    { id: 'cap-09', nombre: 'Cubiertas', peso: 1.82 },
    { id: 'cap-10', nombre: 'Revestimientos y trasdosados', peso: 22.04 },
    { id: 'cap-11', nombre: 'Señalización y equipamiento', peso: 1.32 },
    { id: 'cap-12', nombre: 'Urbanización interior de la parcela', peso: 11.67 },
    { id: 'cap-13', nombre: 'Dotación servicios urbanísticos', peso: 0.14 },
    { id: 'cap-14', nombre: 'Gestión de residuos', peso: 0.60 },
    { id: 'cap-15', nombre: 'Control de calidad y ensayos', peso: 0.21 },
    { id: 'cap-16', nombre: 'Seguridad y salud', peso: 1.81 },
];

export default function AvanceScreen() {
    const { certificaciones, addCertificacion, updateCertificacion, deleteCertificacion } = useData();
    const { theme } = useTheme();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [formNombre, setFormNombre] = useState('');
    const [expandedCert, setExpandedCert] = useState(null);

    const sortedCerts = [...(certificaciones || [])].sort((a, b) => (a.numero || 0) - (b.numero || 0));

    const getLatestValue = (capId) => {
        if (sortedCerts.length === 0) return 0;
        const last = sortedCerts[sortedCerts.length - 1];
        return last.valores?.[capId] || 0;
    };

    const totalAvance = CAPITULOS.reduce((sum, cap) => sum + getLatestValue(cap.id), 0);

    const getCapProgress = (cap) => {
        const val = getLatestValue(cap.id);
        if (cap.peso === 0) return 0;
        return Math.min((val / cap.peso) * 100, 100);
    };

    const formatPct = (val) => {
        return typeof val === 'number' ? val.toFixed(2).replace('.', ',') + '%' : '0,00%';
    };

    const handleNewCert = () => {
        const nextNum = sortedCerts.length + 1;
        setFormNombre(`Certificación ${nextNum}`);
        const lastCert = sortedCerts[sortedCerts.length - 1];
        const initial = {};
        CAPITULOS.forEach(cap => {
            initial[cap.id] = (lastCert?.valores?.[cap.id] || 0).toString();
        });
        setFormValues(initial);
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditCert = (cert) => {
        setFormNombre(cert.nombre);
        const vals = {};
        CAPITULOS.forEach(cap => {
            vals[cap.id] = (cert.valores?.[cap.id] || 0).toString();
        });
        setFormValues(vals);
        setEditingId(cert.id);
        setShowForm(true);
    };

    const handleSave = () => {
        for (const cap of CAPITULOS) {
            const val = parseFloat(formValues[cap.id]) || 0;
            if (val < 0 || val > cap.peso) {
                Alert.alert('Error', `${cap.nombre}: valor debe estar entre 0 y ${cap.peso}%`);
                return;
            }
        }

        const certData = {
            nombre: formNombre,
            numero: editingId
                ? sortedCerts.find(c => c.id === editingId)?.numero || sortedCerts.length
                : sortedCerts.length + 1,
            fecha: new Date().toISOString(),
            valores: {},
        };

        CAPITULOS.forEach(cap => {
            certData.valores[cap.id] = parseFloat(formValues[cap.id]) || 0;
        });

        if (editingId) {
            updateCertificacion({ ...certData, id: editingId });
        } else {
            addCertificacion(certData);
        }

        setShowForm(false);
    };

    const handleDeleteCert = (id) => {
        Alert.alert('Eliminar', '¿Eliminar esta certificación?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => deleteCertificacion(id) },
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Avance de Obra</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleNewCert}>
                    <Plus color="white" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Global Progress */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.globalHeader}>
                        <TrendingUp color={theme.colors.text} size={20} />
                        <Text style={[styles.globalLabel, { color: theme.colors.text }]}>Avance Global</Text>
                        <Text style={styles.globalPct}>{formatPct(totalAvance)}</Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                        <View style={[styles.progressFill, { width: `${Math.min(totalAvance, 100)}%` }]} />
                    </View>
                    {sortedCerts.length > 0 && (
                        <Text style={[styles.certCount, { color: theme.colors.textSecondary }]}>
                            {sortedCerts.length} certificación{sortedCerts.length !== 1 ? 'es' : ''}
                        </Text>
                    )}
                </View>

                {/* Chapters */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Capítulos</Text>
                    {CAPITULOS.map(cap => {
                        const progress = getCapProgress(cap);
                        return (
                            <View key={cap.id} style={[styles.capRow, { borderBottomColor: theme.colors.border }]}>
                                <Text style={[styles.capName, { color: theme.colors.text }]} numberOfLines={2}>{cap.nombre}</Text>
                                <Text style={[styles.capPeso, { color: theme.colors.textSecondary }]}>{formatPct(cap.peso)}</Text>
                                <Text style={[styles.capCert, { color: theme.colors.text }]}>{formatPct(getLatestValue(cap.id))}</Text>
                                <View style={styles.capProgressWrap}>
                                    <View style={[styles.miniBar, { backgroundColor: theme.colors.border }]}>
                                        <View style={[styles.miniFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#2196f3' : '#4caf50' }]} />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                    <View style={[styles.capRow, styles.totalRow]}>
                        <Text style={[styles.capName, { color: theme.colors.text, fontWeight: '700' }]}>TOTAL</Text>
                        <Text style={[styles.capPeso, { fontWeight: '700', color: theme.colors.text }]}>100%</Text>
                        <Text style={[styles.capCert, { fontWeight: '700', color: theme.colors.text }]}>{formatPct(totalAvance)}</Text>
                        <View style={styles.capProgressWrap} />
                    </View>
                </View>

                {/* Certifications */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Certificaciones</Text>
                    {sortedCerts.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            No hay certificaciones registradas.
                        </Text>
                    ) : (
                        sortedCerts.map(cert => {
                            const certTotal = CAPITULOS.reduce((sum, cap) => sum + (cert.valores?.[cap.id] || 0), 0);
                            const isExpanded = expandedCert === cert.id;
                            return (
                                <View key={cert.id} style={[styles.certItem, { borderColor: theme.colors.border }]}>
                                    <TouchableOpacity
                                        style={styles.certHeader}
                                        onPress={() => setExpandedCert(isExpanded ? null : cert.id)}
                                    >
                                        <View>
                                            <Text style={[styles.certName, { color: theme.colors.text }]}>{cert.nombre}</Text>
                                            <Text style={[styles.certDate, { color: theme.colors.textSecondary }]}>
                                                {new Date(cert.fecha).toLocaleDateString('es-ES')}
                                            </Text>
                                        </View>
                                        <View style={styles.certRight}>
                                            <Text style={styles.certTotal}>{formatPct(certTotal)}</Text>
                                            {isExpanded ? <ChevronUp size={18} color={theme.colors.textSecondary} /> : <ChevronDown size={18} color={theme.colors.textSecondary} />}
                                        </View>
                                    </TouchableOpacity>
                                    {isExpanded && (
                                        <View style={[styles.certDetail, { borderTopColor: theme.colors.border }]}>
                                            {CAPITULOS.filter(cap => (cert.valores?.[cap.id] || 0) > 0).map(cap => (
                                                <View key={cap.id} style={styles.detailRow}>
                                                    <Text style={[styles.detailName, { color: theme.colors.text }]}>{cap.nombre}</Text>
                                                    <Text style={[styles.detailVal, { color: theme.colors.text }]}>{formatPct(cert.valores[cap.id])}</Text>
                                                </View>
                                            ))}
                                            <View style={styles.certActions}>
                                                <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.border }]} onPress={() => handleEditCert(cert)}>
                                                    <Edit3 size={16} color={theme.colors.text} />
                                                    <Text style={{ color: theme.colors.text, fontSize: 13 }}>Editar</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#f44336' }]} onPress={() => handleDeleteCert(cert.id)}>
                                                    <Trash2 size={16} color="#f44336" />
                                                    <Text style={{ color: '#f44336', fontSize: 13 }}>Eliminar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Modal */}
            <Modal visible={showForm} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                {editingId ? 'Editar Certificación' : 'Nueva Certificación'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <X size={22} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.formLabel, { color: theme.colors.text }]}>Nombre</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={formNombre}
                                onChangeText={setFormNombre}
                                placeholder="Ej: Certificación 3"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                            {CAPITULOS.map(cap => (
                                <View key={cap.id} style={[styles.formRow, { borderBottomColor: theme.colors.border }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.formCapName, { color: theme.colors.text }]} numberOfLines={1}>{cap.nombre}</Text>
                                        <Text style={[styles.formCapPeso, { color: theme.colors.textSecondary }]}>Peso: {formatPct(cap.peso)}</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.formInputSmall, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                        value={formValues[cap.id] || ''}
                                        onChangeText={(v) => setFormValues(prev => ({ ...prev, [cap.id]: v }))}
                                        keyboardType="decimal-pad"
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                        <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.colors.border }]} onPress={() => setShowForm(false)}>
                                <Text style={{ color: theme.colors.text }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Check color="white" size={18} />
                                <Text style={{ color: 'white', fontWeight: '600' }}>{editingId ? 'Actualizar' : 'Guardar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: { fontSize: 24, fontWeight: 'bold' },
    addBtn: {
        backgroundColor: '#2196f3',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 16 },
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    globalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    globalLabel: { fontWeight: '600', fontSize: 15 },
    globalPct: { marginLeft: 'auto', fontSize: 20, fontWeight: '700', color: '#2196f3' },
    progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#4caf50' },
    certCount: { marginTop: 8, fontSize: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    capRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        gap: 6,
    },
    totalRow: { borderBottomWidth: 0, borderTopWidth: 2, borderTopColor: '#2196f3', marginTop: 4, paddingTop: 10 },
    capName: { flex: 1, fontSize: 12 },
    capPeso: { width: 50, textAlign: 'right', fontSize: 11 },
    capCert: { width: 50, textAlign: 'right', fontSize: 11 },
    capProgressWrap: { width: 60 },
    miniBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 2 },
    emptyText: { textAlign: 'center', paddingVertical: 20 },
    certItem: { borderWidth: 1, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
    certHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    certName: { fontWeight: '600', fontSize: 15 },
    certDate: { fontSize: 12, marginTop: 2 },
    certRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    certTotal: { fontWeight: '700', fontSize: 16, color: '#2196f3' },
    certDetail: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    detailName: { fontSize: 13, flex: 1 },
    detailVal: { fontSize: 13, fontWeight: '500' },
    certActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalBody: { padding: 20 },
    formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
    formInput: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 15,
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 8,
    },
    formCapName: { fontSize: 13 },
    formCapPeso: { fontSize: 11 },
    formInputSmall: {
        width: 70,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        fontSize: 14,
        textAlign: 'right',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        padding: 16,
        borderTopWidth: 1,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#2196f3',
    },
});
