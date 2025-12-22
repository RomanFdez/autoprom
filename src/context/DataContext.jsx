import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [settings, setSettings] = useState({});

    const refreshData = () => {
        setTransactions(storage.getTransactions());
        setCategories(storage.getCategories());
        setTags(storage.getTags());
        setSettings(storage.getSettings());
    };

    useEffect(() => {
        storage.init();
        refreshData();
    }, []);

    const addTransaction = (t) => {
        storage.saveTransaction(t);
        refreshData();
    };

    const updateTransaction = (t) => {
        storage.saveTransaction(t);
        refreshData();
    };

    const removeTransaction = (id) => {
        storage.deleteTransaction(id);
        refreshData();
    };

    const addCategory = (c) => {
        storage.saveCategory(c);
        refreshData();
    };

    const removeCategory = (id) => {
        storage.deleteCategory(id);
        refreshData();
    };

    const addTag = (t) => {
        storage.saveTag(t);
        refreshData();
    };

    const removeTag = (id) => {
        storage.deleteTag(id);
        refreshData();
    };

    const updateSettings = (s) => {
        storage.updateSettings(s);
        refreshData();
    };

    const importData = (data) => {
        storage.importData(data);
        refreshData();
    };

    return (
        <DataContext.Provider value={{
            transactions,
            categories,
            tags,
            settings,
            addTransaction,
            updateTransaction,
            removeTransaction,
            addCategory,
            removeCategory,
            addTag,
            removeTag,
            updateSettings,
            importData,
            refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
