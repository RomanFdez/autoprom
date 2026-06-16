import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Edit2, Trash2, Phone } from 'lucide-react-native';
import { useSeguros } from '../context/SegurosContext';
import {
  TIPOS, PERIODICIDADES, ESTADOS, tipoColor, tipoLabel, BRAND,
} from '../seguros/constants';
import { importeMensual, getEstadisticas } from '../seguros/calc';

const fmtEur = (v) => `${(Number(v) || 0).toFixed(2)} €`;

export default function SegurosScreen() {
  const { seguros } = useSeguros();
  const [tab, setTab] = useState('resumen'); // 'resumen' (por defecto) | 'listado'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'resumen' && styles.tabActive]} onPress={() => setTab('resumen')}>
          <Text style={[styles.tabText, tab === 'resumen' && styles.tabTextActive]}>Resumen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'listado' && styles.tabActive]} onPress={() => setTab('listado')}>
          <Text style={[styles.tabText, tab === 'listado' && styles.tabTextActive]}>Listado</Text>
        </TouchableOpacity>
      </View>
      {tab === 'resumen'
        ? <Resumen data={seguros} />
        : <Listado data={seguros} />}
    </SafeAreaView>
  );
}

function Resumen({ data }) {
  const st = useMemo(() => getEstadisticas(data), [data]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.cards}>
        <Card label="Coste mensual" value={fmtEur(st.costeMensual)} bg={BRAND.balanceBg} color={BRAND.balanceText} />
        <Card label="Coste anual" value={fmtEur(st.costeAnual)} bg={BRAND.expenseBg} color={BRAND.expenseText} />
        <Card label="Nº seguros" value={String(st.total)} bg={BRAND.incomeBg} color={BRAND.incomeText} />
      </View>

      <Text style={styles.h4}>Por tipo</Text>
      <View style={styles.section}>
        {st.porTipo.map(r => {
          const c = tipoColor(r.tipo);
          return (
            <View key={r.tipo} style={styles.statRow}>
              <View style={[styles.badge, { backgroundColor: c.bg }]}>
                <Text style={{ color: c.fg, fontSize: 11 }}>{tipoLabel(r.tipo)}</Text>
              </View>
              <Text style={styles.statCount}>{r.count}</Text>
              <Text style={styles.statCost}>{fmtEur(r.costeMensual)}/mes</Text>
            </View>
          );
        })}
        {st.porTipo.length === 0 && <Text style={styles.empty}>Sin seguros</Text>}
      </View>

      {st.proximasRenovaciones.length > 0 && (
        <>
          <Text style={styles.h4}>Próximas renovaciones</Text>
          <View style={styles.section}>
            {st.proximasRenovaciones.map(s => {
              const c = tipoColor(s.tipo);
              return (
                <View key={s.id} style={styles.statRow}>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={{ color: c.fg, fontSize: 11 }}>{tipoLabel(s.tipo)}</Text>
                  </View>
                  <Text style={styles.statCount}>{s.compania}</Text>
                  <Text style={styles.statCost}>{s.fechaVencimiento}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Card({ label, value, bg, color }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={[styles.cardLabel, { color }]}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

function Listado({ data }) {
  const { addSeguro, updateSeguro, removeSeguro } = useSeguros();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fTipo, setFTipo] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  const rows = useMemo(() => data
    .filter(s => !fTipo || s.tipo === fTipo)
    .filter(s => !soloActivos || s.estado !== 'cancelada'),
    [data, fTipo, soloActivos]);

  const confirmDelete = (s) => {
    Alert.alert(
      'Eliminar seguro',
      `¿Eliminar el seguro de ${tipoLabel(s.tipo)} de ${s.compania || '—'} (póliza ${s.numeroPoliza || '—'})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeSeguro(s.id) },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setFTipo('')}
            style={[styles.chip, fTipo === '' && styles.chipActive]}>
            <Text style={[styles.chipText, fTipo === '' && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {TIPOS.map(t => (
            <TouchableOpacity key={t.value} onPress={() => setFTipo(t.value)}
              style={[styles.chip, fTipo === t.value && styles.chipActive]}>
              <Text style={[styles.chipText, fTipo === t.value && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.toggle} onPress={() => setSoloActivos(v => !v)}>
        <View style={[styles.checkbox, soloActivos && styles.checkboxOn]}>
          {soloActivos && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.toggleLabel}>Solo activos</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }}>
        {rows.map(s => {
          const c = tipoColor(s.tipo);
          const cancelada = s.estado === 'cancelada';
          return (
            <View key={s.id} style={[styles.row, cancelada && styles.rowCancelada]}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowMeta}>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={{ color: c.fg, fontSize: 11 }}>{tipoLabel(s.tipo)}</Text>
                  </View>
                  <Text style={styles.compania}>{s.compania || '—'}</Text>
                </View>
                {!!s.asegurado && <Text style={styles.metaText}>{s.asegurado}</Text>}
                {!!s.telefono && (
                  <TouchableOpacity style={styles.telBtn} onPress={() => Linking.openURL('tel:' + s.telefono)}>
                    <Phone size={12} color={BRAND.blue} />
                    <Text style={styles.telText}>{s.telefono}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.mensual}>{(Number(s.importeMensual) || 0).toFixed(2)} €/mes</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => { setEditing(s); setFormOpen(true); }} style={styles.actionBtn}>
                    <Edit2 size={16} color="#6E6E73" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(s)} style={styles.actionBtn}>
                    <Trash2 size={16} color="#C0392B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        {rows.length === 0 && <Text style={styles.empty}>Sin seguros</Text>}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setFormOpen(true); }}>
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <SeguroForm visible={formOpen} onClose={() => setFormOpen(false)} initialData={editing}
        addSeguro={addSeguro} updateSeguro={updateSeguro} />
    </View>
  );
}

function SeguroForm({ visible, onClose, initialData, addSeguro, updateSeguro }) {
  const editing = !!initialData;
  const [tipo, setTipo] = useState(TIPOS[0].value);
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [compania, setCompania] = useState('');
  const [tomador, setTomador] = useState('');
  const [asegurado, setAsegurado] = useState('');
  const [telefono, setTelefono] = useState('');
  const [importe, setImporte] = useState('');
  const [periodicidad, setPeriodicidad] = useState('anual');
  const [fechaEfecto, setFechaEfecto] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [estado, setEstado] = useState('activa');
  const [coberturas, setCoberturas] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setTipo(initialData.tipo || TIPOS[0].value);
      setNumeroPoliza(initialData.numeroPoliza || '');
      setCompania(initialData.compania || '');
      setTomador(initialData.tomador || '');
      setAsegurado(initialData.asegurado || '');
      setTelefono(initialData.telefono || '');
      setImporte(initialData.importe != null ? String(initialData.importe) : '');
      setPeriodicidad(initialData.periodicidad || 'anual');
      setFechaEfecto(initialData.fechaEfecto || new Date().toISOString().slice(0, 10));
      setFechaVencimiento(initialData.fechaVencimiento || '');
      setEstado(initialData.estado || 'activa');
      setCoberturas(initialData.coberturas || '');
    } else {
      setTipo(TIPOS[0].value); setNumeroPoliza(''); setCompania(''); setTomador('');
      setAsegurado(''); setTelefono(''); setImporte(''); setPeriodicidad('anual');
      setFechaEfecto(new Date().toISOString().slice(0, 10)); setFechaVencimiento('');
      setEstado('activa'); setCoberturas('');
    }
  }, [visible, initialData]);

  const mensual = useMemo(() => importeMensual(importe, periodicidad), [importe, periodicidad]);

  const save = async () => {
    const docData = {
      ...(initialData || {}),
      tipo, numeroPoliza, compania, tomador, asegurado, telefono,
      importe: parseFloat(importe) || 0,
      periodicidad, fechaEfecto, fechaVencimiento, estado, coberturas,
      importeMensual: mensual,
    };
    if (editing) await updateSeguro(docData); else await addSeguro(docData);
    onClose();
  };

  // Selector de opciones (chips horizontales), mismo patrón que FinanzasScreen.
  const Chips = ({ options, value, onChange }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {options.map(o => (
        <TouchableOpacity key={o.value} onPress={() => onChange(o.value)}
          style={[styles.chip, value === o.value && styles.chipActive]}>
          <Text style={[styles.chipText, value === o.value && styles.chipTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar seguro' : 'Nuevo seguro'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#6E6E73" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Tipo</Text>
            <Chips options={TIPOS} value={tipo} onChange={setTipo} />

            <Text style={styles.label}>Nº de póliza</Text>
            <TextInput style={styles.input} value={numeroPoliza} onChangeText={setNumeroPoliza} />

            <Text style={styles.label}>Compañía</Text>
            <TextInput style={styles.input} value={compania} onChangeText={setCompania}
              placeholder="Sanitas, Sabadell, AMA…" />

            <Text style={styles.label}>Tomador</Text>
            <TextInput style={styles.input} value={tomador} onChangeText={setTomador} />

            <Text style={styles.label}>Asegurado (persona / coche / casa / beneficiarios)</Text>
            <TextInput style={styles.input} value={asegurado} onChangeText={setAsegurado} />

            <Text style={styles.label}>Teléfono de contacto</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono}
              keyboardType="phone-pad" placeholder="Compañía / asistencia 24h" />

            <Text style={styles.label}>Importe (€)</Text>
            <TextInput style={styles.input} value={importe} onChangeText={setImporte}
              keyboardType="numeric" placeholder="0.00" />

            <Text style={styles.label}>Periodicidad</Text>
            <Chips options={PERIODICIDADES} value={periodicidad} onChange={setPeriodicidad} />

            <View style={styles.readonly}>
              <Text style={styles.readonlyText}>Importe mensual: <Text style={{ fontWeight: '700' }}>{mensual.toFixed(2)} €</Text></Text>
            </View>

            <Text style={styles.label}>Fecha de efecto (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={fechaEfecto} onChangeText={setFechaEfecto} placeholder="2026-01-01" />

            <Text style={styles.label}>Fecha de vencimiento (opcional)</Text>
            <TextInput style={styles.input} value={fechaVencimiento} onChangeText={setFechaVencimiento} placeholder="YYYY-MM-DD" />

            <Text style={styles.label}>Estado</Text>
            <Chips options={ESTADOS} value={estado} onChange={setEstado} />

            <Text style={styles.label}>Coberturas</Text>
            <TextInput style={[styles.input, styles.multiline]} value={coberturas} onChangeText={setCoberturas}
              multiline numberOfLines={5} placeholder="Pega aquí las coberturas / condiciones…" />

            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>{editing ? 'Guardar' : 'Añadir'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  tabs: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  tabBtn: { backgroundColor: '#EBEBED', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8 },
  tabActive: { backgroundColor: BRAND.blue },
  tabText: { color: '#6E6E73', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  // Resumen
  cards: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginVertical: 8 },
  card: { flex: 1, borderRadius: 14, padding: 12 },
  cardLabel: { fontSize: 11, textTransform: 'uppercase' },
  cardValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  h4: { marginHorizontal: 12, marginTop: 16, marginBottom: 6, fontSize: 12, color: '#6E6E73',
    textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginHorizontal: 12 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: 10, padding: 10, marginBottom: 6 },
  statCount: { flex: 1, color: '#1D1D1F', fontSize: 13 },
  statCost: { fontWeight: '700', fontSize: 13, color: '#1D1D1F' },
  // Listado
  filters: { paddingHorizontal: 12, marginBottom: 4 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: '#D2D2D7',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxOn: { backgroundColor: BRAND.blue, borderColor: BRAND.blue },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toggleLabel: { color: '#6E6E73', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', marginHorizontal: 12,
    marginBottom: 8, padding: 12, borderRadius: 12 },
  rowCancelada: { opacity: 0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  compania: { fontSize: 15, fontWeight: '600', color: '#1D1D1F' },
  metaText: { color: '#6E6E73', fontSize: 12, marginTop: 4 },
  telBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  telText: { color: BRAND.blue, fontSize: 13 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  mensual: { fontWeight: '700', color: '#1D1D1F', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { padding: 2 },
  empty: { textAlign: 'center', color: '#AEAEB2', fontStyle: 'italic', marginTop: 30 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: BRAND.blue, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 18, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1D1D1F' },
  label: { fontSize: 12, color: '#6E6E73', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#D2D2D7', borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA',
    color: '#1D1D1F', marginBottom: 6 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  readonly: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 8,
    padding: 10, marginBottom: 6, marginTop: 2 },
  readonlyText: { color: '#1D1D1F', fontSize: 13 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#EBEBED', marginRight: 6 },
  chipActive: { backgroundColor: BRAND.blue },
  chipText: { color: '#6E6E73', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: BRAND.blue, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
