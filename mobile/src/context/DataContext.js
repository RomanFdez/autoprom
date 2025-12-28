import React, { createContext, useContext, useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const INITIAL_SETTINGS = { initialBalance: 0, darkMode: false };

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [todos, setTodos] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Setup Real-time Listeners
    useEffect(() => {
        setLoading(true);

        // Listen to Collections
        const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data());
            setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });

        const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
            setCategories(snapshot.docs.map(doc => doc.data()));
        });

        const unsubTags = onSnapshot(collection(db, 'tags'), (snapshot) => {
            setTags(snapshot.docs.map(doc => doc.data()));
        });

        const unsubTodos = onSnapshot(collection(db, 'todos'), (snapshot) => {
            setTodos(snapshot.docs.map(doc => doc.data()));
        });

        const unsubSettings = onSnapshot(doc(db, 'settings', 'appSettings'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            } else {
                setDoc(doc(db, 'settings', 'appSettings'), INITIAL_SETTINGS);
                setSettings(INITIAL_SETTINGS);
            }
            setLoading(false);
        });

        return () => {
            unsubTransactions();
            unsubCategories();
            unsubTags();
            unsubTodos();
            unsubSettings();
        };
    }, []);

    // --- Transactions ---

    const addTransaction = async (t) => {
        const id = t.id || uuidv4();
        const newT = { ...t, id };

        try {
            await setDoc(doc(db, 'transactions', id), newT);
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const updateTransaction = async (t) => {
        try {
            await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
        } catch (e) {
            console.error("Error updating transaction: ", e);
        }
    };

    const removeTransaction = async (id) => {
        try {
            await deleteDoc(doc(db, 'transactions', id));
        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    };

    // --- Todos ---

    const addTodo = async (todo) => {
        const id = uuidv4();
        const newTodo = { ...todo, id };
        try {
            await setDoc(doc(db, 'todos', id), newTodo);
        } catch (e) {
            console.error("Error adding todo: ", e);
        }
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            try {
                await updateDoc(doc(db, 'todos', id), { done: !todo.done });
            } catch (e) {
                console.error("Error toggling todo: ", e);
            }
        }
    };

    const deleteTodo = async (id) => {
        try {
            await deleteDoc(doc(db, 'todos', id));
        } catch (e) {
            console.error("Error deleting todo: ", e);
        }
    };

    // --- Categories ---

    const addCategory = async (cat) => {
        const id = cat.id || uuidv4();
        const newCat = { ...cat, id };
        try {
            await setDoc(doc(db, 'categories', id), newCat);
        } catch (e) {
            console.error("Error adding category: ", e);
        }
    };

    const updateCategory = async (cat) => {
        try {
            await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
        } catch (e) {
            console.error("Error updating category: ", e);
        }
    };

    const removeCategory = async (id) => {
        try {
            await deleteDoc(doc(db, 'categories', id));
        } catch (e) {
            console.error("Error deleting category: ", e);
        }
    };

    // --- Tags ---

    const addTag = async (tag) => {
        const id = tag.id || uuidv4();
        const newTag = { ...tag, id };
        try {
            await setDoc(doc(db, 'tags', id), newTag);
        } catch (e) {
            console.error("Error adding tag: ", e);
        }
    };

    const updateTag = async (tag) => {
        try {
            await setDoc(doc(db, 'tags', tag.id), tag, { merge: true });
        } catch (e) {
            console.error("Error updating tag: ", e);
        }
    };

    const removeTag = async (id) => {
        try {
            await deleteDoc(doc(db, 'tags', id));
        } catch (e) {
            console.error("Error deleting tag: ", e);
        }
    };

    // --- Settings ---

    const updateSettings = async (newSet) => {
        const finalSettings = { ...settings, ...newSet };
        try {
            await setDoc(doc(db, 'settings', 'appSettings'), finalSettings, { merge: true });
        } catch (e) {
            console.error("Error updating settings: ", e);
        }
    };

    // --- Import / Restore ---

    const importData = async (data) => {
        setLoading(true);
        console.log("Starting Import...");

        try {
            // Collect all operations
            const allItems = [];

            if (data.transactions) data.transactions.forEach(t => allItems.push({ col: 'transactions', id: t.id, data: t }));
            if (data.categories) data.categories.forEach(c => allItems.push({ col: 'categories', id: c.id, data: c }));
            if (data.tags) data.tags.forEach(t => allItems.push({ col: 'tags', id: t.id, data: t }));
            if (data.todos) data.todos.forEach(t => allItems.push({ col: 'todos', id: t.id, data: t }));
            if (data.settings) allItems.push({ col: 'settings', id: 'appSettings', data: data.settings });

            // Chunking
            const CHUNK_SIZE = 450;
            for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
                const batch = writeBatch(db);
                const chunk = allItems.slice(i, i + CHUNK_SIZE);

                chunk.forEach(item => {
                    const ref = doc(db, item.col, item.id);
                    batch.set(ref, item.data);
                });

                console.log(`Writing batch ${i} to ${i + chunk.length} of ${allItems.length}`);
                await batch.commit();
            }

            console.log("Import successful");
        } catch (e) {
            console.error("Import failed: ", e);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => { };

    return (
        <DataContext.Provider value={{
            transactions,
            categories,
            tags,
            settings,
            todos,
            loading,
            refreshData,
            addTransaction,
            updateTransaction,
            removeTransaction,
            addTodo,
            toggleTodo,
            deleteTodo,
            addCategory,
            updateCategory,
            removeCategory,
            addTag,
            updateTag,
            removeTag,
            updateSettings,
            importData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
