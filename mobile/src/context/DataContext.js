import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

const INITIAL_SETTINGS = { initialBalance: 0, darkMode: false };

export const DataProvider = ({ children }) => {
    const { user, logout } = useAuth();
    const [todos, setTodos] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [loading, setLoading] = useState(true);

    const syncData = async (newTransactions, newCategories, newTags, newSettings, newTodos) => {
        const payload = {
            transactions: newTransactions || transactions,
            categories: newCategories || categories,
            tags: newTags || tags,
            settings: newSettings || settings,
            todos: newTodos || todos
        };

        try {
            await client.post('/data', payload);
        } catch (e) {
            console.error('Sync failed', e);
        }
    };

    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await client.get('/data');
            const data = res.data;
            if (data) {
                // Ensure dates are parsed correctly if needed, but strings work for comparison
                setTransactions(data.transactions || []);
                setCategories(data.categories || []);
                setTags(data.tags || []);
                setSettings(data.settings || INITIAL_SETTINGS);
                setTodos(data.todos || []);
            }
        } catch (e) {
            console.error('Fetch failed', e);
            // Clear data if fetch fails to reflect invalid connection
            setTransactions([]);
            setCategories([]);
            setTags([]);
            setTodos([]);
            setSettings(INITIAL_SETTINGS);

            if (e.response && e.response.status === 401) {
                // Auto-logout disabled for offline/direct mode
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user]);

    const addTransaction = (t) => {
        const newT = { ...t, id: t.id || uuidv4() };
        const newTransactions = [...transactions, newT];

        // Handle Debt Logic
        let newCategories = null;
        if (newT.amount < 0 && newT.categoryId) {
            const catIndex = categories.findIndex(c => c.id === newT.categoryId);
            if (catIndex !== -1 && categories[catIndex].debt > 0) {
                const updatedCat = { ...categories[catIndex] };
                updatedCat.debt = Math.max(0, updatedCat.debt - Math.abs(newT.amount));

                newCategories = [...categories];
                newCategories[catIndex] = updatedCat;
                setCategories(newCategories);
            }
        }

        setTransactions(newTransactions);
        syncData(newTransactions, newCategories, null, null, null);
    };

    const updateTransaction = (t) => {
        const newTransactions = transactions.map(tr => tr.id === t.id ? t : tr);
        setTransactions(newTransactions);
        syncData(newTransactions, null, null, null, null);
    };

    const removeTransaction = (id) => {
        const newTransactions = transactions.filter(t => t.id !== id);
        setTransactions(newTransactions);
        syncData(newTransactions, null, null, null, null);
    };

    // Category & Tag Handlers (Adding placeholders if needed by AdminScreen, or existing ones should be exposed if they exist. 
    // Wait, AdminScreen uses addCategory etc. I need to make sure those are exposed too! 
    // Looking at previous DataContext dump... 
    // The previous dump ONLY showed addTransaction/update/remove. 
    // AdminScreen supposedly uses addCategory, updateCategory, removeCategory, addTag, etc. 
    // If they aren't here, AdminScreen will break too. 
    // I will add them now to be safe, as the user didn't mention Admin errors yet but they likely exist or I missed them in previous context check.
    // Actually, looking at the truncated file, I might have missed them or they were not there. 
    // I will add basic CRUD for Categories and Tags + Todos.

    // Todo Handlers
    const addTodo = (todo) => {
        // todo is object { text, done, createdAt }
        const newTodo = { ...todo, id: uuidv4() };
        const newTodos = [...(todos || []), newTodo];
        setTodos(newTodos);
        syncData(null, null, null, null, newTodos);
    };

    const toggleTodo = (id) => {
        const newTodos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
        setTodos(newTodos);
        syncData(null, null, null, null, newTodos);
    };

    const deleteTodo = (id) => {
        const newTodos = todos.filter(t => t.id !== id);
        setTodos(newTodos);
        syncData(null, null, null, null, newTodos);
    };

    // Category handlers
    const addCategory = (cat) => {
        const newCat = { ...cat, id: uuidv4() };
        const newCategories = [...categories, newCat];
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    const updateCategory = (cat) => {
        const newCategories = categories.map(c => c.id === cat.id ? cat : c);
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    const removeCategory = (id) => {
        const newCategories = categories.filter(c => c.id !== id);
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    // Tag handlers
    const addTag = (tag) => {
        const newTag = { ...tag, id: uuidv4() };
        const newTags = [...tags, newTag];
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    const updateTag = (tag) => {
        const newTags = tags.map(t => t.id === tag.id ? tag : t);
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    const removeTag = (id) => {
        const newTags = tags.filter(t => t.id !== id);
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    // Settings
    const updateSettings = (newSet) => {
        const finalSettings = { ...settings, ...newSet };
        setSettings(finalSettings);
        syncData(null, null, null, finalSettings, null);
    };

    const importData = (data) => {
        setTransactions(data.transactions || []);
        setCategories(data.categories || []);
        setTags(data.tags || []);
        setTodos(data.todos || []);
        setSettings(data.settings || INITIAL_SETTINGS);
        syncData(data.transactions, data.categories, data.tags, data.settings, data.todos);
    };

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
