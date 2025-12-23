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
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Simple In-Memory Session Store
const sessions = new Set();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure data files exist
if (!fs.existsSync(DATA_FILE)) {
    fs.outputJsonSync(DATA_FILE, {
        transactions: [],
        categories: [],
        tags: [],
        settings: {}
    });
}

if (!fs.existsSync(USERS_FILE)) {
    fs.outputJsonSync(USERS_FILE, {
        username: 'admin',
        password: 'password123'
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
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await fs.readJson(USERS_FILE);
        if (username === user.username && password === user.password) {
            const token = crypto.randomBytes(16).toString('hex');
            sessions.add(token);
            res.json({ token, user: { username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Auth error' });
    }
});

app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) sessions.delete(authHeader);
    res.json({ success: true });
});

app.post('/api/change-password', authMiddleware, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Password required' });

    try {
        const user = await fs.readJson(USERS_FILE);
        user.password = newPassword;
        await fs.writeJson(USERS_FILE, user);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update password' });
    }
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
