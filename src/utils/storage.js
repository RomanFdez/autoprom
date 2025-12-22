import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
    TRANSACTIONS: 'pse30_transactions',
    CATEGORIES: 'pse30_categories',
    TAGS: 'pse30_tags',
    SETTINGS: 'pse30_settings',
};

const INITIAL_CATEGORIES = [
    { id: 'cat_1', code: 'PROJ', name: 'Proyecto y Documentación', color: '#795548', icon: 'description' }, // Brown
    { id: 'cat_2', code: 'TERR', name: 'Terreno', color: '#4caf50', icon: 'landscape' }, // Green
    { id: 'cat_3', code: 'CONS', name: 'Construcción', color: '#ff9800', icon: 'construction' }, // Orange
    { id: 'cat_4', code: 'MUDA', name: 'Mudanza', color: '#9c27b0', icon: 'local_shipping' }, // Purple
    { id: 'cat_5', code: 'SEGU', name: 'Seguridad', color: '#607d8b', icon: 'security' }, // Blue Grey
    { id: 'cat_6', code: 'TECN', name: 'Tecnología', color: '#2196f3', icon: 'devices' }, // Blue
    { id: 'cat_7', code: 'MUEB', name: 'Muebles', color: '#ff5722', icon: 'chair' }, // Deep Orange
    { id: 'cat_8', code: 'UTIL', name: 'Utensilios y herramientas', color: '#ffeb3b', icon: 'handyman' }, // Yellow
    { id: 'cat_other', code: 'OTRO', name: 'Otros', color: '#9e9e9e', icon: 'category' }, // Grey (Default)
];

const INITIAL_TAGS = [
    { id: 'tag_1', code: 'IMP', name: 'Impuestos', color: '#f44336' }, // Red
    { id: 'tag_2', code: 'DOC', name: 'Documentos', color: '#3f51b5' }, // Indigo
    { id: 'tag_3', code: 'NOT', name: 'Notaría', color: '#673ab7' }, // Deep Purple
];

const INITIAL_SETTINGS = {
    initialBalance: 0,
};

// --- Helpers ---
const get = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key} from localStorage`, e);
        return defaultValue;
    }
};

const set = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing ${key} to localStorage`, e);
    }
};

// --- API ---

export const storage = {
    // Initialization
    init: () => {
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            set(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
        }
        if (!localStorage.getItem(STORAGE_KEYS.TAGS)) {
            set(STORAGE_KEYS.TAGS, INITIAL_TAGS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            set(STORAGE_KEYS.TRANSACTIONS, []);
        }
    },

    // Transactions
    getTransactions: () => get(STORAGE_KEYS.TRANSACTIONS, []),
    saveTransaction: (transaction) => {
        const transactions = get(STORAGE_KEYS.TRANSACTIONS, []);
        const index = transactions.findIndex(t => t.id === transaction.id);
        if (index >= 0) {
            transactions[index] = transaction;
        } else {
            transactions.push({ ...transaction, id: transaction.id || uuidv4() });
        }
        set(STORAGE_KEYS.TRANSACTIONS, transactions);
        return transactions;
    },
    deleteTransaction: (id) => {
        const transactions = get(STORAGE_KEYS.TRANSACTIONS, []);
        const filtered = transactions.filter(t => t.id !== id);
        set(STORAGE_KEYS.TRANSACTIONS, filtered);
        return filtered;
    },

    // Categories
    getCategories: () => get(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
    saveCategory: (category) => {
        const categories = get(STORAGE_KEYS.CATEGORIES, []);
        const index = categories.findIndex(c => c.id === category.id);
        if (index >= 0) {
            categories[index] = category;
        } else {
            categories.push({ ...category, id: category.id || uuidv4() });
        }
        set(STORAGE_KEYS.CATEGORIES, categories);
        return categories;
    },
    deleteCategory: (id) => {
        const categories = get(STORAGE_KEYS.CATEGORIES, []);
        const filtered = categories.filter(c => c.id !== id);
        set(STORAGE_KEYS.CATEGORIES, filtered);
        return filtered;
    },

    // Tags
    getTags: () => get(STORAGE_KEYS.TAGS, INITIAL_TAGS),
    saveTag: (tag) => {
        const tags = get(STORAGE_KEYS.TAGS, []);
        const index = tags.findIndex(t => t.id === tag.id);
        if (index >= 0) {
            tags[index] = tag;
        } else {
            tags.push({ ...tag, id: tag.id || uuidv4() });
        }
        set(STORAGE_KEYS.TAGS, tags);
        return tags;
    },
    deleteTag: (id) => {
        const tags = get(STORAGE_KEYS.TAGS, []);
        const filtered = tags.filter(t => t.id !== id);
        set(STORAGE_KEYS.TAGS, filtered);
        return filtered;
    },

    // Settings
    getSettings: () => get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
    updateSettings: (newSettings) => {
        const current = get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
        const updated = { ...current, ...newSettings };
        set(STORAGE_KEYS.SETTINGS, updated);
        return updated;
    },

    // Bulk Import/Export
    exportData: () => {
        return {
            transactions: get(STORAGE_KEYS.TRANSACTIONS, []),
            categories: get(STORAGE_KEYS.CATEGORIES, []),
            tags: get(STORAGE_KEYS.TAGS, []),
            settings: get(STORAGE_KEYS.SETTINGS, []),
        };
    },
    importData: (data) => {
        if (data.transactions) set(STORAGE_KEYS.TRANSACTIONS, data.transactions);
        if (data.categories) set(STORAGE_KEYS.CATEGORIES, data.categories);
        if (data.tags) set(STORAGE_KEYS.TAGS, data.tags);
        if (data.settings) set(STORAGE_KEYS.SETTINGS, data.settings);
    }
};
