import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function restore() {
    try {
        const dataPath = path.join(__dirname, '../restore_source.json');
        if (!fs.existsSync(dataPath)) {
            console.error('restore_source.json not found in root!');
            process.exit(1);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const backup = JSON.parse(rawData);
        const { transactions, categories, tags, settings } = backup;

        console.log('Starting restore...');

        await prisma.$transaction(async (tx) => {
            // 1. Clean existing data
            console.log('Cleaning existing data...');
            await tx.transaction.deleteMany();
            await tx.tag.deleteMany();
            await tx.category.deleteMany();
            await tx.settings.deleteMany();

            // 2. Insert Settings
            if (settings) {
                console.log('Inserting settings...');
                await tx.settings.create({
                    data: {
                        id: 'settings',
                        initialBalance: parseFloat(settings.initialBalance || 0)
                    }
                });
            }

            // 3. Insert Categories
            if (categories && categories.length > 0) {
                console.log(`Inserting ${categories.length} categories...`);
                for (const c of categories) {
                    await tx.category.create({
                        data: {
                            id: c.id,
                            code: c.code || '',
                            name: c.name,
                            color: c.color,
                            icon: c.icon || 'category',
                            isFixed: !!c.isFixed,
                            debt: parseFloat(c.debt || 0)
                        }
                    });
                }
            }

            // 4. Insert Tags
            if (tags && tags.length > 0) {
                console.log(`Inserting ${tags.length} tags...`);
                // Deduplicate tags by ID just in case
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

            // 5. Insert Transactions
            if (transactions && transactions.length > 0) {
                console.log(`Inserting ${transactions.length} transactions...`);
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

        console.log('Restore completed successfully!');
    } catch (e) {
        console.error('Restore failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
