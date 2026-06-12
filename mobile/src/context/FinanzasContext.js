import React, { createContext, useContext, useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const FinanzasContext = createContext();
const COLLECTION = 'finTransactions';

export const FinanzasProvider = ({ children }) => {
  const [finTransactions, setFinTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
      setFinTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addFin = async (t) => {
    const id = t.id || uuidv4();
    await setDoc(doc(db, COLLECTION, id), { ...t, id });
  };
  const updateFin = async (t) => { await setDoc(doc(db, COLLECTION, t.id), t, { merge: true }); };
  const removeFin = async (id) => { await deleteDoc(doc(db, COLLECTION, id)); };

  return (
    <FinanzasContext.Provider value={{ finTransactions, loading, addFin, updateFin, removeFin }}>
      {children}
    </FinanzasContext.Provider>
  );
};

export const useFinanzas = () => useContext(FinanzasContext);
