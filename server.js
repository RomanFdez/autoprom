import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3030;
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

// Simple In-Memory Session Store
const sessions = new Set();
const USER_CREDENTIALS = { username: 'admin', password: 'password123' }; // CHANGE THIS IN PROD

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.outputJsonSync(DATA_FILE, {
        transactions: [],
        categories: [],
        tags: [],
        settings: {}
    });
}

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && sessions.has(authHeader)) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Auth Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password) {
        const token = crypto.randomBytes(16).toString('hex');
        sessions.add(token);
        // Clean up session logic omitted for brevity in prototype
        res.json({ token, user: { username } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) sessions.delete(authHeader);
    res.json({ success: true });
});

// API Routes
app.get('/api/data', authMiddleware, async (req, res) => {
    try {
        const data = await fs.readJson(DATA_FILE);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/data', authMiddleware, async (req, res) => {
    try {
        await fs.writeJson(DATA_FILE, req.body);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Serve React App
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
