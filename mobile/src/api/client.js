import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_IP = 'localhost'; // Fallback that will fail on physical device, ensuring user must configure explicit IP
const DEFAULT_PORT = '3030';

const client = axios.create({
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the auth token and dynamic base URL
client.interceptors.request.use(
    async (config) => {
        // 1. Dynamic Base URL
        try {
            const storedIp = await SecureStore.getItemAsync('server_ip');
            const storedPort = await SecureStore.getItemAsync('server_port');

            console.log('🔍 [Debug] Raw Stored IP:', storedIp, 'Port:', storedPort);

            // If no stored IP, use default (localhost) which will intentionally fail on mobile
            // forcing the user to configure it in Admin settings.
            let ip = (storedIp || DEFAULT_IP).trim();
            let port = (storedPort || DEFAULT_PORT).trim();

            // Sanitize IP: remove protocol, trailing slash, and port if user typed "1.2.3.4:3030"
            ip = ip.replace(/^https?:\/\//, '').replace(/\/$/, '').split(':')[0];

            const baseURL = `http://${ip}:${port}/api`;

            // Force absolute URL to avoid Axios baseURL ambiguity
            if (config.url && !config.url.startsWith('http')) {
                const cleanBase = baseURL.replace(/\/$/, '');
                const cleanPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
                config.url = `${cleanBase}${cleanPath}`;
                config.baseURL = null;
            }

            console.log('🔗 [Axios] Requesting:', config.url);
        } catch (e) {
            config.baseURL = `http://${DEFAULT_IP}:${DEFAULT_PORT}/api`;
        }

        // 2. Auth Token (Legacy support, though auth is disabled on server)
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;
