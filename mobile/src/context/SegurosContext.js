import React, { createContext, useContext, useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const SegurosContext = createContext();
const COLLECTION = 'seguros';

export const SegurosProvider = ({ children }) => {
  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map(d => d.data());
      // Activos primero; dentro, por tipo y compañía.
      data.sort((a, b) => {
        if ((a.estado === 'cancelada') !== (b.estado === 'cancelada')) {
          return a.estado === 'cancelada' ? 1 : -1;
        }
        return (a.tipo || '').localeCompare(b.tipo || '')
          || (a.compania || '').localeCompare(b.compania || '');
      });
      setSeguros(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addSeguro = async (s) => {
    const id = s.id || uuidv4();
    await setDoc(doc(db, COLLECTION, id), { ...s, id });
  };
  const updateSeguro = async (s) => { await setDoc(doc(db, COLLECTION, s.id), s, { merge: true }); };
  const removeSeguro = async (id) => { await deleteDoc(doc(db, COLLECTION, id)); };

  return (
    <SegurosContext.Provider value={{ seguros, loading, addSeguro, updateSeguro, removeSeguro }}>
      {children}
    </SegurosContext.Provider>
  );
};

export const useSeguros = () => useContext(SegurosContext);
