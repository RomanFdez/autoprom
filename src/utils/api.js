export const api = {
    getHeaders: () => {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': token } : {})
        };
    },

    login: async (username, password) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Login failed:", error);
            return null;
        }
    },

    logout: async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Authorization': token }
                });
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    },

    loadData: async () => {
        try {
            const response = await fetch('/api/data', {
                headers: api.getHeaders()
            });
            if (response.status === 401) return null; // Unauthorized
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Failed to load data from API:", error);
            return null; // Return null instead of error to allow handling in context
        }
    },

    saveData: async (data) => {
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data),
            });
            if (response.status === 401) return false;
            if (!response.ok) throw new Error('Network response was not ok');
            return true;
        } catch (error) {
            console.error("Failed to save data to API:", error);
            return false;
        }
    }
};
