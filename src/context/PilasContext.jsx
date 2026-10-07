// src/context/PilasContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { COL_TIPOS, COL_ASIGNACIONES, COL_MOVIMIENTOS } from '../casa/constants';
import { detalleEdicion } from '../casa/pilas';

const PilasContext = createContext();

// Campos de una asignación tal como se guardan (sin undefined: Firestore los rechaza).
const limpiarAsignacion = (a) => ({
  id: a.id,
  aparato: String(a.aparato || '').trim(),
  estancia: String(a.estancia || '').trim(),
  tipo: a.tipo,
  cantidad: Number(a.cantidad) || 0,
  fechaColocacion: a.fechaColocacion,
});

export const PilasProvider = ({ children }) => {
  const { user } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargados, setCargados] = useState({ tipos: false, asignaciones: false, movimientos: false });

  useEffect(() => {
    const marcar = (k) => setCargados(c => (c[k] ? c : { ...c, [k]: true }));
    const unsubs = [
      onSnapshot(collection(db, COL_TIPOS), (snap) => {
        setTipos(snap.docs.map(d => d.data()));
        marcar('tipos');
      }),
      onSnapshot(collection(db, COL_ASIGNACIONES), (snap) => {
        setAsignaciones(snap.docs.map(d => d.data()));
        marcar('asignaciones');
      }),
      onSnapshot(collection(db, COL_MOVIMIENTOS), (snap) => {
        const data = snap.docs.map(d => d.data());
        data.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        setMovimientos(data);
        marcar('movimientos');
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const loading = !(cargados.tipos && cargados.asignaciones && cargados.movimientos);
  const usuario = user?.displayName || user?.email || '';

  // Añade el movimiento al batch.
  const registrar = (batch, mov) => {
    const id = uuidv4();
    batch.set(doc(db, COL_MOVIMIENTOS, id), {
      id, fecha: new Date().toISOString(), usuario,
      aparato: '', estancia: '', detalle: '', ...mov,
    });
  };

  const ponerPilas = async (datos) => {
    const a = limpiarAsignacion({ ...datos, id: uuidv4() });
    const batch = writeBatch(db);
    batch.set(doc(db, COL_ASIGNACIONES, a.id), a);
    registrar(batch, { accion: 'poner', aparato: a.aparato, estancia: a.estancia, tipo: a.tipo, cantidad: a.cantidad });
    await batch.commit();
  };

  const editarAsignacion = async (antes, datos) => {
    const a = limpiarAsignacion({ ...datos, id: antes.id });
    const detalle = detalleEdicion(antes, a);
    if (!detalle) return;
    const batch = writeBatch(db);
    batch.set(doc(db, COL_ASIGNACIONES, a.id), a);
    registrar(batch, { accion: 'editar', aparato: a.aparato, estancia: a.estancia, tipo: a.tipo, cantidad: a.cantidad, detalle });
    await batch.commit();
  };

  const quitarAsignacion = async (a) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, COL_ASIGNACIONES, a.id));
    registrar(batch, { accion: 'quitar', aparato: a.aparato, estancia: a.estancia || '', tipo: a.tipo, cantidad: a.cantidad });
    await batch.commit();
  };

  const ajustarTipo = async (tipo, { total, capacidadMah }) => {
    const actual = tipos.find(t => t.tipo === tipo);
    const totalAntes = Number(actual?.total) || 0;
    const nuevoTotal = Math.max(0, Math.round(Number(total) || 0));
    const batch = writeBatch(db);
    batch.set(doc(db, COL_TIPOS, tipo), {
      tipo, total: nuevoTotal, capacidadMah: capacidadMah ? Number(capacidadMah) : null,
    }, { merge: true });
    if (nuevoTotal !== totalAntes) {
      registrar(batch, { accion: 'ajusteTotal', tipo, cantidad: nuevoTotal, detalle: `total ${totalAntes} → ${nuevoTotal}` });
    }
    await batch.commit();
  };

  return (
    <PilasContext.Provider value={{
      tipos, asignaciones, movimientos, loading,
      ponerPilas, editarAsignacion, quitarAsignacion, ajustarTipo,
    }}>
      {children}
    </PilasContext.Provider>
  );
};

export const usePilas = () => useContext(PilasContext);
