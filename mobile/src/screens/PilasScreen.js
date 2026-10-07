import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { Plus, X, Edit2, Trash2, Search, ChevronLeft, BatteryFull } from 'lucide-react-native';
import { usePilas } from '../context/PilasContext';
import { TIPOS_PILA, hoyISO } from '../casa/constants';
import {
  resumenPorTipo, sugerenciasDe, antiguedad, agruparPorEstancia, filtrar, describirMovimiento, normalizar,
} from '../casa/pilas';

const ACCENT = '#5B3A8C';
const ACCENT_BG = '#F3EEFA';

// ISO datetime -> "DD/MM/YYYY HH:MM" (hora local).
const fmtFechaHora = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function PilasScreen({ onBack }) {
  const { loading } = usePilas();
  const [tab, setTab] = useState('asignaciones'); // 'asignaciones' | 'historial'

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <ChevronLeft size={20} color="#6E6E73" />
          <Text style={styles.backText}>Casa</Text>
        </TouchableOpacity>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'asignaciones' && styles.tabActive]} onPress={() => setTab('asignaciones')}>
            <Text style={[styles.tabText, tab === 'asignaciones' && styles.tabTextActive]}>Pilas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'historial' && styles.tabActive]} onPress={() => setTab('historial')}>
            <Text style={[styles.tabText, tab === 'historial' && styles.tabTextActive]}>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading
        ? <Text style={styles.empty}>Cargando…</Text>
        : tab === 'historial' ? <Historial /> : <Asignaciones />}
    </View>
  );
}

function Asignaciones() {
  const { tipos, asignaciones, movimientos, quitarAsignacion } = usePilas();
  const [texto, setTexto] = useState('');
  const [form, setForm] = useState(null); // null | { initialData }
  const [tipoEdit, setTipoEdit] = useState(null);

  const resumen = useMemo(() => resumenPorTipo(tipos, asignaciones), [tipos, asignaciones]);
  const grupos = useMemo(() => agruparPorEstancia(filtrar(asignaciones, texto)), [asignaciones, texto]);
  const sugAparatos = useMemo(() => sugerenciasDe(asignaciones, movimientos, 'aparato'), [asignaciones, movimientos]);
  const sugEstancias = useMemo(() => sugerenciasDe(asignaciones, movimientos, 'estancia'), [asignaciones, movimientos]);

  const confirmarQuitar = (a) => {
    Alert.alert(
      'Quitar pilas',
      `¿Quitar ${a.cantidad}× ${a.tipo} de ${a.aparato}? Volverán a disponibles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar', style: 'destructive',
          onPress: () => quitarAsignacion(a).catch(() => Alert.alert('Error', 'No se pudo quitar.')),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.cards}>
          {resumen.map(r => (
            <TouchableOpacity key={r.tipo} style={styles.card} onPress={() => setTipoEdit(r)}>
              <View style={styles.cardTipoRow}>
                <BatteryFull size={14} color={ACCENT} />
                <Text style={styles.cardTipo}>{r.tipo}</Text>
              </View>
              {!!r.capacidadMah && <Text style={styles.cardCap}>{r.capacidadMah} mAh</Text>}
              <Text style={[styles.cardValue, r.disponibles < 0 && { color: '#C0392B' }]}>{r.disponibles}</Text>
              <Text style={styles.cardSub}>disp. de {r.total}</Text>
              <Text style={styles.cardSub}>{r.enUso} en uso</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.search}>
          <Search size={16} color="#6E6E73" />
          <TextInput style={styles.searchInput} value={texto} onChangeText={setTexto}
            placeholder="Buscar aparato, estancia o tipo…" placeholderTextColor="#AEAEB2" />
        </View>

        {grupos.map(g => (
          <View key={g.estancia}>
            <Text style={styles.h4}>{g.estancia}</Text>
            {g.items.map(a => (
              <View key={a.id} style={styles.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.aparato} numberOfLines={1}>{a.aparato}</Text>
                  <View style={styles.sub}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{a.cantidad}× {a.tipo}</Text></View>
                    <Text style={styles.subText}>{antiguedad(a.fechaColocacion)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setForm({ initialData: a })} style={styles.actionBtn}>
                  <Edit2 size={18} color="#6E6E73" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmarQuitar(a)} style={styles.actionBtn}>
                  <Trash2 size={18} color="#C0392B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        {grupos.length === 0 && (
          <Text style={styles.empty}>
            {asignaciones.length === 0 ? 'No hay pilas puestas en ningún aparato' : 'Nada coincide con la búsqueda'}
          </Text>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setForm({ initialData: null })}>
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <AsignacionForm visible={!!form} initialData={form?.initialData} onClose={() => setForm(null)}
        sugAparatos={sugAparatos} sugEstancias={sugEstancias} />
      <TipoForm resumen={tipoEdit} onClose={() => setTipoEdit(null)} />
    </View>
  );
}

function Historial() {
  const { movimientos } = usePilas();
  return (
    <ScrollView style={{ flex: 1 }}>
      {movimientos.map(m => (
        <View key={m.id} style={styles.histRow}>
          <Text style={styles.histTxt}>{describirMovimiento(m)}</Text>
          <Text style={styles.histMeta}>{fmtFechaHora(m.fecha)}{m.usuario ? ` · ${m.usuario}` : ''}</Text>
        </View>
      ))}
      {movimientos.length === 0 && <Text style={styles.empty}>Sin movimientos todavía</Text>}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// Campo de texto con sugerencias (chips) de valores ya usados.
function CampoSugerido({ value, onChange, sugerencias, placeholder }) {
  const [foco, setFoco] = useState(false);
  const visibles = useMemo(() => {
    const q = normalizar(value);
    return sugerencias
      .filter(s => normalizar(s) !== q && (!q || normalizar(s).includes(q)))
      .slice(0, 6);
  }, [value, sugerencias]);

  return (
    <View>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#AEAEB2" onFocus={() => setFoco(true)} onBlur={() => setFoco(false)} />
      {foco && visibles.length > 0 && (
        <View style={styles.sugs}>
          {visibles.map(s => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => onChange(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function AsignacionForm({ visible, initialData, onClose, sugAparatos, sugEstancias }) {
  const { ponerPilas, editarAsignacion } = usePilas();
  const editing = !!initialData;
  const [aparato, setAparato] = useState('');
  const [estancia, setEstancia] = useState('');
  const [tipo, setTipo] = useState(TIPOS_PILA[0]);
  const [cantidad, setCantidad] = useState('2');
  const [fechaColocacion, setFechaColocacion] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAparato(initialData?.aparato || '');
    setEstancia(initialData?.estancia || '');
    setTipo(initialData?.tipo || TIPOS_PILA[0]);
    setCantidad(String(initialData?.cantidad ?? 2));
    setFechaColocacion(initialData?.fechaColocacion || hoyISO());
    setGuardando(false);
  }, [visible, initialData]);

  const save = async () => {
    const n = parseInt(cantidad, 10);
    if (!aparato.trim()) { Alert.alert('Falta el aparato', 'Escribe en qué aparato pones las pilas.'); return; }
    if (!(n >= 1)) { Alert.alert('Cantidad no válida', 'La cantidad debe ser 1 o más.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaColocacion)) { Alert.alert('Fecha no válida', 'Usa el formato YYYY-MM-DD.'); return; }
    setGuardando(true);
    const datos = { aparato, estancia, tipo, cantidad: n, fechaColocacion };
    try {
      if (editing) await editarAsignacion(initialData, datos);
      else await ponerPilas(datos);
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar pilas' : 'Poner pilas'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#6E6E73" /></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Aparato</Text>
            <CampoSugerido value={aparato} onChange={setAparato} sugerencias={sugAparatos}
              placeholder="Mando TV, ratón, linterna…" />

            <Text style={styles.label}>Estancia (opcional)</Text>
            <CampoSugerido value={estancia} onChange={setEstancia} sugerencias={sugEstancias}
              placeholder="Salón, garaje…" />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chipsRow}>
              {TIPOS_PILA.map(t => (
                <TouchableOpacity key={t} onPress={() => setTipo(t)} style={[styles.chip, tipo === t && styles.chipActive]}>
                  <Text style={[styles.chipText, tipo === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cantidad</Text>
            <TextInput style={styles.input} value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" />

            <Text style={styles.label}>Fecha de colocación (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={fechaColocacion} onChangeText={setFechaColocacion} placeholder="2026-01-01" />

            <TouchableOpacity style={[styles.saveBtn, guardando && { opacity: 0.6 }]} onPress={save} disabled={guardando}>
              <Text style={styles.saveText}>{editing ? 'Guardar' : 'Poner pilas'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TipoForm({ resumen, onClose }) {
  const { ajustarTipo } = usePilas();
  const [total, setTotal] = useState('');
  const [capacidadMah, setCapacidadMah] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!resumen) return;
    setTotal(String(resumen.total));
    setCapacidadMah(resumen.capacidadMah ? String(resumen.capacidadMah) : '');
    setGuardando(false);
  }, [resumen]);

  if (!resumen) return null;

  const save = async () => {
    setGuardando(true);
    try {
      await ajustarTipo(resumen.tipo, { total, capacidadMah });
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <Modal visible={!!resumen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilas {resumen.tipo}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#6E6E73" /></TouchableOpacity>
          </View>
          <Text style={styles.label}>Total de pilas en casa</Text>
          <TextInput style={styles.input} value={total} onChangeText={setTotal} keyboardType="number-pad" />
          <Text style={styles.label}>Capacidad (mAh, opcional)</Text>
          <TextInput style={styles.input} value={capacidadMah} onChangeText={setCapacidadMah}
            keyboardType="number-pad" placeholder="2500" placeholderTextColor="#AEAEB2" />
          <View style={styles.readonly}>
            <Text style={styles.readonlyText}>En uso ahora: <Text style={{ fontWeight: '700' }}>{resumen.enUso}</Text></Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, guardando && { opacity: 0.6 }]} onPress={save} disabled={guardando}>
            <Text style={styles.saveText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#6E6E73', fontSize: 15 },
  tabs: { flexDirection: 'row', gap: 8 },
  tabBtn: { backgroundColor: '#EBEBED', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8 },
  tabActive: { backgroundColor: ACCENT },
  tabText: { color: '#6E6E73', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  cards: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 10 },
  card: { flex: 1, borderRadius: 14, padding: 10, backgroundColor: ACCENT_BG, borderWidth: 1, borderColor: '#D8CBEE' },
  cardTipoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTipo: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  cardCap: { color: ACCENT, fontSize: 11, opacity: 0.8 },
  cardValue: { color: ACCENT, fontSize: 24, fontWeight: '700', marginTop: 2 },
  cardSub: { color: ACCENT, fontSize: 11, opacity: 0.85 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#D2D2D7', backgroundColor: '#fff' },
  searchInput: { flex: 1, paddingVertical: 9, color: '#1D1D1F' },
  h4: { marginHorizontal: 12, marginTop: 16, marginBottom: 6, fontSize: 12, color: '#6E6E73',
    textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12,
    marginBottom: 8, padding: 12, borderRadius: 12, gap: 8 },
  aparato: { fontSize: 15, fontWeight: '600', color: '#1D1D1F' },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subText: { color: '#6E6E73', fontSize: 12 },
  badge: { backgroundColor: ACCENT_BG, paddingVertical: 1, paddingHorizontal: 8, borderRadius: 12 },
  badgeText: { color: ACCENT, fontSize: 12, fontWeight: '600' },
  actionBtn: { padding: 6 },
  empty: { textAlign: 'center', color: '#AEAEB2', fontStyle: 'italic', marginTop: 30 },
  histRow: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 10 },
  histTxt: { color: '#1D1D1F', fontSize: 14 },
  histMeta: { color: '#6E6E73', fontSize: 11, marginTop: 3 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 18, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1D1D1F' },
  label: { fontSize: 12, color: '#6E6E73', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#D2D2D7', borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA',
    color: '#1D1D1F', marginBottom: 6 },
  sugs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', marginBottom: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#EBEBED', marginRight: 6 },
  chipActive: { backgroundColor: ACCENT },
  chipText: { color: '#6E6E73', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  readonly: { backgroundColor: ACCENT_BG, borderWidth: 1, borderColor: '#D8CBEE', borderRadius: 8,
    padding: 10, marginBottom: 6, marginTop: 2 },
  readonlyText: { color: '#1D1D1F', fontSize: 13 },
  saveBtn: { backgroundColor: ACCENT, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
