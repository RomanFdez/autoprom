export const api = {
    loadData: async () => {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Failed to load data from API:", error);
            return null;
        }
    },
    saveData: async (data) => {
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return true;
        } catch (error) {
            console.error("Failed to save data to API:", error);
            return false;
        }
    }
};
