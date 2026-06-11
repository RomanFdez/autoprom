import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import { useFinanzas } from '../context/FinanzasContext';
import {
  CATEGORIES, SUBCATEGORIES, CUENTAS, MONTHS, CATEGORY_WITH_SUBCATS, catColor, BRAND,
} from '../finanzas/constants';
import { getSummary, getBreakdown } from '../finanzas/summary';

export default function FinanzasScreen() {
  const { finTransactions } = useFinanzas();
  const [tab, setTab] = useState('anual');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'mensual' && styles.tabActive]} onPress={() => setTab('mensual')}>
          <Text style={[styles.tabText, tab === 'mensual' && styles.tabTextActive]}>Mensual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'anual' && styles.tabActive]} onPress={() => setTab('anual')}>
          <Text style={[styles.tabText, tab === 'anual' && styles.tabTextActive]}>Anual</Text>
        </TouchableOpacity>
        <Text style={styles.year}>{year}</Text>
      </View>
      {tab === 'mensual'
        ? <Mensual data={finTransactions} month={month} year={year} setMonth={setMonth} />
        : <Anual data={finTransactions} year={year} />}
    </SafeAreaView>
  );
}

function Mensual({ data, month, year, setMonth }) {
  const { addFin, updateFin, removeFin } = useFinanzas();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const mm = String(month).padStart(2, '0');
    return data
      .filter(t => t.fecha.slice(0, 4) === String(year) && t.fecha.slice(5, 7) === mm)
      .filter(t => !q || (t.concepto || '').toLowerCase().includes(q.toLowerCase()));
  }, [data, month, year, q]);

  const totals = useMemo(() => {
    let ing = 0, gas = 0;
    for (const t of rows) { if (t.importe >= 0) ing += t.importe; else gas += t.importe; }
    return { ing, gas, bal: ing + gas };
  }, [rows]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthbar}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={m} onPress={() => setMonth(i + 1)}
            style={[styles.pill, month === i + 1 && styles.pillActive]}>
            <Text style={[styles.pillText, month === i + 1 && styles.pillTextActive]}>{m.slice(0, 3)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.cards}>
        <Card label="Ingresos" value={totals.ing} bg={BRAND.incomeBg} color={BRAND.incomeText} />
        <Card label="Gastos" value={totals.gas} bg={BRAND.expenseBg} color={BRAND.expenseText} />
        <Card label="Balance" value={totals.bal} bg={BRAND.balanceBg} color={BRAND.balanceText} />
      </View>

      <TextInput style={styles.search} placeholder="Buscar concepto…" value={q} onChangeText={setQ} />

      <ScrollView style={{ flex: 1 }}>
        {rows.map(t => {
          const c = catColor(t.categoria);
          return (
            <TouchableOpacity key={t.id} style={styles.row}
              onPress={() => { setEditing(t); setFormOpen(true); }}
              onLongPress={() => Alert.alert('Eliminar', '¿Eliminar apunte?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => removeFin(t.id) },
              ])}>
              <View style={{ flex: 1 }}>
                <Text style={styles.concept}>{t.concepto || t.categoria}</Text>
                <View style={styles.rowMeta}>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={{ color: c.fg, fontSize: 11 }}>{t.categoria}</Text>
                  </View>
                  <Text style={styles.metaText}>{t.cuenta} · {t.fecha.slice(8, 10)}/{t.fecha.slice(5, 7)}</Text>
                </View>
              </View>
              <Text style={{ color: t.importe >= 0 ? BRAND.incomeText : BRAND.expenseText, fontWeight: '700' }}>
                {t.importe.toFixed(2)} €
              </Text>
            </TouchableOpacity>
          );
        })}
        {rows.length === 0 && <Text style={styles.empty}>Sin apuntes</Text>}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setFormOpen(true); }}>
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <FinForm visible={formOpen} onClose={() => setFormOpen(false)} initialData={editing}
        addFin={addFin} updateFin={updateFin} defaultDate={`${year}-${String(month).padStart(2, '0')}-01`} />
    </View>
  );
}

function Card({ label, value, bg, color }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={[styles.cardLabel, { color }]}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value.toFixed(2)} €</Text>
    </View>
  );
}

function Anual({ data, year }) {
  const summary = useMemo(() => getSummary(data, year), [data, year]);
  const [open, setOpen] = useState({});
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const fmt = (v) => (v == null ? '—' : v.toFixed(0));

  return (
    <ScrollView style={{ flex: 1 }}>
      <ScrollView horizontal>
        <View>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.catCol]}>Categoría</Text>
            {months.map(m => <Text key={m} style={styles.th}>{MONTHS[m - 1].slice(0, 3)}</Text>)}
            <Text style={styles.th}>Total</Text>
            <Text style={styles.th}>Media</Text>
            <Text style={styles.th}>Prev.</Text>
          </View>
          {summary.rows.map(row => {
            const c = catColor(row.categoria);
            const hasSub = summary.cats_with_subcats.includes(row.categoria);
            const isOpen = !!open[row.categoria];
            const bd = isOpen ? getBreakdown(data, year, row.categoria) : null;
            return (
              <View key={row.categoria}>
                <TouchableOpacity style={styles.tr} disabled={!hasSub}
                  onPress={() => setOpen(o => ({ ...o, [row.categoria]: !o[row.categoria] }))}>
                  <Text style={[styles.td, styles.catCol]} numberOfLines={1}>
                    {hasSub ? (isOpen ? '▼ ' : '▶ ') : '   '}
                    <Text style={{ color: c.fg }}>{row.categoria}</Text>
                  </Text>
                  {months.map(m => <Text key={m} style={styles.td}>{fmt(row.meses[String(m)])}</Text>)}
                  <Text style={styles.td}>{fmt(row.total_actual)}</Text>
                  <Text style={styles.td}>{fmt(row.media_mensual)}</Text>
                  <Text style={styles.td}>{fmt(row.prevision)}</Text>
                </TouchableOpacity>
                {isOpen && bd && bd.rows.map(sub => (
                  <View key={sub.subcategoria} style={[styles.tr, styles.subRow]}>
                    <Text style={[styles.td, styles.catCol, styles.subText]} numberOfLines={1}>  {sub.subcategoria}</Text>
                    {months.map(m => <Text key={m} style={[styles.td, styles.subText]}>{fmt(sub.meses[String(m)])}</Text>)}
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.total_actual)}</Text>
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.media_mensual)}</Text>
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.prevision)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
          <View style={[styles.tr, styles.totalRow]}>
            <Text style={[styles.td, styles.catCol, { fontWeight: '700' }]}>TOTAL</Text>
            {months.map(m => <Text key={m} style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.meses[String(m)])}</Text>)}
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.total_actual)}</Text>
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.media_mensual)}</Text>
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.prevision)}</Text>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function FinForm({ visible, onClose, initialData, addFin, updateFin, defaultDate }) {
  const editing = !!initialData;
  const [fecha, setFecha] = useState(defaultDate);
  const [categoria, setCategoria] = useState(CATEGORIES[0]);
  const [subcategoria, setSubcategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [importeAbs, setImporteAbs] = useState('');
  const [tipo, setTipo] = useState('Gasto');
  const [cuenta, setCuenta] = useState(CUENTAS[0]);

  React.useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setFecha(initialData.fecha);
      setCategoria(initialData.categoria);
      setSubcategoria(initialData.subcategoria || '');
      setConcepto(initialData.concepto || '');
      setImporteAbs(Math.abs(initialData.importe).toString());
      setTipo(initialData.tipo || 'Gasto');
      setCuenta(initialData.cuenta || CUENTAS[0]);
    } else {
      setFecha(defaultDate); setCategoria(CATEGORIES[0]); setSubcategoria('');
      setConcepto(''); setImporteAbs(''); setTipo('Gasto'); setCuenta(CUENTAS[0]);
    }
  }, [visible, initialData, defaultDate]);

  const showSub = categoria === CATEGORY_WITH_SUBCATS;

  const save = async () => {
    const n = Math.abs(parseFloat(importeAbs) || 0);
    const docData = {
      ...(initialData || {}),
      fecha, categoria,
      subcategoria: showSub ? (subcategoria || null) : null,
      concepto,
      importe: tipo === 'Gasto' ? -n : n,
      tipo, cuenta,
    };
    if (editing) await updateFin(docData); else await addFin(docData);
    onClose();
  };

  const Chips = ({ options, value, onChange }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {options.map(o => (
        <TouchableOpacity key={o} onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipActive]}>
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar apunte' : 'Nuevo apunte'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#6E6E73" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="2026-01-01" />
            <Text style={styles.label}>Tipo</Text>
            <Chips options={['Gasto', 'Ingreso']} value={tipo} onChange={setTipo} />
            <Text style={styles.label}>Importe (€)</Text>
            <TextInput style={styles.input} value={importeAbs} onChangeText={setImporteAbs}
              keyboardType="numeric" placeholder="0.00" />
            <Text style={styles.label}>Categoría</Text>
            <Chips options={CATEGORIES} value={categoria} onChange={setCategoria} />
            {showSub && (<>
              <Text style={styles.label}>Subcategoría</Text>
              <Chips options={SUBCATEGORIES} value={subcategoria} onChange={setSubcategoria} />
            </>)}
            <Text style={styles.label}>Cuenta</Text>
            <Chips options={CUENTAS} value={cuenta} onChange={setCuenta} />
            <Text style={styles.label}>Concepto</Text>
            <TextInput style={styles.input} value={concepto} onChangeText={setConcepto} />
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
  year: { marginLeft: 'auto', color: '#6E6E73', fontWeight: '600' },
  monthbar: { paddingHorizontal: 8, maxHeight: 44 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 4 },
  pillActive: { backgroundColor: BRAND.blue },
  pillText: { color: '#6E6E73', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  cards: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginVertical: 8 },
  card: { flex: 1, borderRadius: 14, padding: 12 },
  cardLabel: { fontSize: 11, textTransform: 'uppercase' },
  cardValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  search: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12,
    marginBottom: 8, padding: 12, borderRadius: 12 },
  concept: { fontSize: 15, fontWeight: '500', color: '#1D1D1F' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  metaText: { color: '#6E6E73', fontSize: 12 },
  empty: { textAlign: 'center', color: '#AEAEB2', fontStyle: 'italic', marginTop: 30 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: BRAND.blue, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  // Tabla anual
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  thead: { backgroundColor: '#FAFAFA' },
  th: { width: 52, padding: 6, fontSize: 10, color: '#6E6E73', textAlign: 'right', textTransform: 'uppercase' },
  td: { width: 52, padding: 6, fontSize: 11, textAlign: 'right', color: '#1D1D1F' },
  catCol: { width: 120, textAlign: 'left' },
  subRow: { backgroundColor: '#FCFCFD' },
  subText: { color: '#6E6E73' },
  totalRow: { backgroundColor: '#FAFAFA', borderTopWidth: 2, borderTopColor: '#E5E5EA' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 18, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1D1D1F' },
  label: { fontSize: 12, color: '#6E6E73', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#D2D2D7', borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA',
    color: '#1D1D1F', marginBottom: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#EBEBED', marginRight: 6 },
  chipActive: { backgroundColor: BRAND.blue },
  chipText: { color: '#6E6E73', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: BRAND.blue, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
