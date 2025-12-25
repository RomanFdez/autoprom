import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3030;

// Simple In-Memory Session Store
const sessions = new Set();

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for potentially large data syncs
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Admin User if not exists
const initUser = async () => {
    try {
        const count = await prisma.user.count();
        if (count === 0) {
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: 'password123'
                }
            });
            console.log('Default admin user created.');
        }
    } catch (e) {
        console.error('Failed to initialize user:', e);
    }
};

const initData = async () => {
    try {
        const txCount = await prisma.transaction.count();
        const catCount = await prisma.category.count();

        if (txCount === 0 && catCount === 0) {
            const seedPath = path.join(__dirname, 'initial_seed.json');
            if (fs.existsSync(seedPath)) {
                console.log('Seeding database from initial_seed.json...');
                const rawData = fs.readFileSync(seedPath, 'utf-8');
                const seedData = JSON.parse(rawData);
                const { transactions, categories, tags, settings } = seedData;

                await prisma.$transaction(async (tx) => {
                    // Insert Settings
                    if (settings) {
                        await tx.settings.create({
                            data: {
                                id: 'settings',
                                initialBalance: parseFloat(settings.initialBalance || 0),
                                darkMode: !!settings.darkMode
                            }
                        });
                    }

                    // Insert Categories
                    if (categories && categories.length > 0) {
                        for (const c of categories) {
                            await tx.category.create({
                                data: {
                                    id: c.id,
                                    code: c.code || '',
                                    name: c.name,
                                    color: c.color,
                                    icon: c.icon || 'category',
                                    isFixed: !!c.isFixed,
                                    debt: parseFloat(c.debt || 0),
                                    showInExpense: c.showInExpense !== undefined ? c.showInExpense : true,
                                    showInIncome: c.showInIncome !== undefined ? c.showInIncome : true
                                }
                            });
                        }
                    }

                    // Insert Tags
                    if (tags && tags.length > 0) {
                        // Deduplicate tags
                        const uniqueTags = new Map();
                        tags.forEach(t => uniqueTags.set(t.id, t));

                        for (const t of uniqueTags.values()) {
                            await tx.tag.create({
                                data: {
                                    id: t.id,
                                    code: t.code || '',
                                    name: t.name,
                                    color: t.color
                                }
                            });
                        }
                    }

                    // Insert Transactions
                    if (transactions && transactions.length > 0) {
                        for (const t of transactions) {
                            await tx.transaction.create({
                                data: {
                                    id: t.id,
                                    date: t.date,
                                    description: t.description || '',
                                    amount: parseFloat(t.amount),
                                    categoryId: t.categoryId || null,
                                    tags: {
                                        connect: (t.tagIds || []).map(tid => ({ id: tid }))
                                    }
                                }
                            });
                        }
                    }
                });
                console.log('Database seeded successfully!');
            }
        }
    } catch (e) {
        console.error('Failed to seed data:', e);
    }
};

initUser();
initData();

// Auth Middleware
const authMiddleware = (req, res, next) => {
    // Authentication disabled by user request for direct access
    next();
};

// Auth Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (user && user.password === password) { // In a real app, compare hashed passwords
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
        // Assuming a single admin user for this personal app, or you'd find by session/user ID
        await prisma.user.update({
            where: { username: 'admin' }, // Update the admin user
            data: { password: newPassword } // In a real app, hash newPassword
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// API Routes
app.get('/api/data', authMiddleware, async (req, res) => {
    try {
        const [transactions, categories, tags, settings, todos] = await Promise.all([
            prisma.transaction.findMany({ include: { tags: true } }),
            prisma.category.findMany(),
            prisma.tag.findMany(),
            prisma.settings.findUnique({ where: { id: 'settings' } }),
            prisma.todo.findMany()
        ]);

        // Transform transactions to include tagIds array for frontend compatibility
        const formattedTransactions = transactions.map(t => ({
            ...t,
            tagIds: t.tags.map(tag => tag.id),
            tags: undefined // Remove the nested tags object
        }));

        res.json({
            transactions: formattedTransactions,
            categories,
            tags,
            settings: settings || { id: 'settings', initialBalance: 0 },
            todos: todos || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

// Full Sync / Restore
app.post('/api/data', authMiddleware, async (req, res) => {
    const { transactions, categories, tags, settings, todos } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Clean existing data (order matters due to foreign key constraints)
            await tx.transaction.deleteMany();
            await tx.tag.deleteMany();
            await tx.category.deleteMany();
            await tx.settings.deleteMany();
            await tx.todo.deleteMany();

            // 2. Insert Settings
            if (settings) {
                await tx.settings.create({
                    data: {
                        id: 'settings', // Fixed ID for the single settings record
                        initialBalance: parseFloat(settings.initialBalance || 0),
                        darkMode: !!settings.darkMode
                    }
                });
            }

            // 3. Insert Categories
            if (categories && categories.length > 0) {
                for (const c of categories) {
                    await tx.category.create({
                        data: {
                            id: c.id,
                            code: c.code || '',
                            name: c.name,
                            color: c.color,
                            icon: c.icon || 'category',
                            isFixed: !!c.isFixed,
                            debt: parseFloat(c.debt || 0),
                            showInExpense: c.showInExpense !== undefined ? c.showInExpense : true,
                            showInIncome: c.showInIncome !== undefined ? c.showInIncome : true
                        }
                    });
                }
            }

            // 4. Insert Tags
            if (tags && tags.length > 0) {
                for (const t of tags) {
                    await tx.tag.create({
                        data: {
                            id: t.id,
                            code: t.code || '',
                            name: t.name,
                            color: t.color
                        }
                    });
                }
            }

            // 5. Insert Transactions (one by one to handle many-to-many relations with tags)
            if (transactions && transactions.length > 0) {
                for (const t of transactions) {
                    await tx.transaction.create({
                        data: {
                            id: t.id,
                            date: t.date,
                            description: t.description || '',
                            amount: parseFloat(t.amount), // Ensure float
                            categoryId: t.categoryId || null, // Can be null
                            tags: {
                                connect: (t.tagIds || []).map(tid => ({ id: tid })) // Connect existing tags
                            }
                        }
                    });
                }
            }

            // 6. Insert Todos
            if (todos && todos.length > 0) {
                for (const todo of todos) {
                    await tx.todo.create({
                        data: {
                            id: todo.id,
                            text: todo.text,
                            done: !!todo.done,
                            createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date()
                        }
                    });
                }
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Sync failed:', err);
        res.status(500).json({ error: 'Failed to sync data' });
    }
});

// Serve React App
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
