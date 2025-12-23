import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

const INITIAL_CATEGORIES = [
    { id: 'cat_0', code: 'INGR', name: 'Ingresos', color: '#4caf50', icon: 'trending_up', isFixed: true },
    { id: 'cat_1', code: 'PROJ', name: 'Proyecto y Documentación', color: '#795548', icon: 'description' },
    { id: 'cat_2', code: 'TERR', name: 'Terreno', color: '#4caf50', icon: 'landscape' },
    { id: 'cat_3', code: 'CONS', name: 'Construcción', color: '#ff9800', icon: 'construction' },
    { id: 'cat_4', code: 'MUDA', name: 'Mudanza', color: '#9c27b0', icon: 'local_shipping' },
    { id: 'cat_5', code: 'SEGU', name: 'Seguridad', color: '#607d8b', icon: 'security' },
    { id: 'cat_6', code: 'TECN', name: 'Tecnología', color: '#2196f3', icon: 'devices' },
    { id: 'cat_7', code: 'MUEB', name: 'Muebles', color: '#ff5722', icon: 'chair' },
    { id: 'cat_8', code: 'UTIL', name: 'Utensilios y herramientas', color: '#ffeb3b', icon: 'handyman' },
    { id: 'cat_other', code: 'OTRO', name: 'Otros', color: '#9e9e9e', icon: 'category' },
];

const INITIAL_TAGS = [
    { id: 'tag_1', code: 'IMP', name: 'Impuestos', color: '#f44336' },
    { id: 'tag_2', code: 'DOC', name: 'Documentos', color: '#3f51b5' },
    { id: 'tag_3', code: 'NOT', name: 'Notaría', color: '#673ab7' },
];

const INITIAL_SETTINGS = { initialBalance: 0, darkMode: false };

export const DataProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [todos, setTodos] = useState([]);
    const [settings, setSettings] = useState(INITIAL_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Apply Dark Mode
    useEffect(() => {
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [settings.darkMode]);

    // Helper to sync all data
    const syncData = async (newTransactions, newCategories, newTags, newSettings, newTodos) => {
        const payload = {
            transactions: newTransactions || transactions,
            categories: newCategories || categories,
            tags: newTags || tags,
            settings: newSettings || settings,
            todos: newTodos || todos
        };
        await api.saveData(payload);
    };

    const { logout } = useAuth(); // Need to ensure DataProvider is child of AuthProvider

    const refreshData = async () => {
        setLoading(true);
        try {
            const data = await api.loadData();
            if (data) {
                setTransactions(data.transactions || []);
                setCategories(data.categories && data.categories.length > 0 ? data.categories : INITIAL_CATEGORIES);
                setTags(data.tags && data.tags.length > 0 ? data.tags : INITIAL_TAGS);
                setSettings(data.settings || INITIAL_SETTINGS);
                setTodos(data.todos || []);
            } else {
                // If data is null, it likely means fetch failed (possibly 401).
                // In a robust app, api.loadData should throw, but here it returns null.
                // If server restarted, session is gone, we should logout.
                console.warn("Failed to load data, likely session expired");
                logout();
            }
        } catch (e) {
            console.error(e);
            logout();
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addTransaction = (t) => {
        const newT = { ...t, id: t.id || uuidv4() };
        const newTransactions = [...transactions, newT];

        // Handle Debt Reduction
        let newCategories = null;
        if (newT.amount < 0 && newT.categoryId) { // Expense
            const catIndex = categories.findIndex(c => c.id === newT.categoryId);
            if (catIndex !== -1 && categories[catIndex].debt > 0) {
                const updatedCat = { ...categories[catIndex] };
                // Reduce debt by the absolute amount of the expense
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

    const addCategory = (c) => {
        const newC = { ...c, id: c.id || uuidv4() };
        const newCategories = [...categories, newC];
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    const updateCategory = (c) => {
        const newCategories = categories.map(cat => cat.id === c.id ? c : cat);
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    const removeCategory = (id) => {
        const newCategories = categories.filter(c => c.id !== id);
        setCategories(newCategories);
        syncData(null, newCategories, null, null, null);
    };

    const addTag = (t) => {
        const newT = { ...t, id: t.id || uuidv4() };
        const newTags = [...tags, newT];
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    const updateTag = (t) => {
        const newTags = tags.map(tag => tag.id === t.id ? t : tag);
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    const removeTag = (id) => {
        const newTags = tags.filter(t => t.id !== id);
        setTags(newTags);
        syncData(null, null, newTags, null, null);
    };

    const updateSettings = (s) => {
        const newSettings = { ...settings, ...s };
        setSettings(newSettings);
        syncData(null, null, null, newSettings, null);
    };

    // Todo Logic
    const addTodo = (text) => {
        const newTodo = {
            id: uuidv4(),
            text,
            done: false,
            createdAt: new Date().toISOString()
        };
        const newTodos = [...todos, newTodo];
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

    const importData = (data) => {
        if (data.transactions) setTransactions(data.transactions);
        if (data.categories) setCategories(data.categories);
        if (data.tags) setTags(data.tags);
        if (data.settings) setSettings(data.settings);
        if (data.todos) setTodos(data.todos);
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
            addTransaction,
            updateTransaction,
            removeTransaction,
            addCategory,
            updateCategory,
            removeCategory,
            addTag,
            updateTag,
            removeTag,
            updateSettings,
            addTodo,
            toggleTodo,
            deleteTodo,
            importData,
            refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
