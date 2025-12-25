import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const BACKUP_PATH = '/Users/alvaroroman/Library/Mobile Documents/com~apple~CloudDocs/Downloads/backup_2025-12-25.json';

async function main() {
    try {
        console.log('Reading backup file...');
        if (!fs.existsSync(BACKUP_PATH)) {
            console.error('Backup file not found at:', BACKUP_PATH);
            return;
        }
        const data = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

        console.log('--- Starting Transaction Repair ---');

        // 1. Ensure Categories exist (Upsert) to avoid FK errors
        console.log('Syncing Categories...');
        for (const c of data.categories) {
            await prisma.category.upsert({
                where: { id: c.id },
                update: {
                    name: c.name,
                    color: c.color,
                    icon: c.icon,
                    code: c.code
                },
                create: {
                    id: c.id,
                    name: c.name,
                    color: c.color,
                    icon: c.icon || 'category',
                    code: c.code || '',
                    debt: c.debt || 0,
                    isFixed: !!c.isFixed,
                    showInExpense: c.showInExpense ?? true,
                    showInIncome: c.showInIncome ?? true
                }
            });
        }

        // 2. Ensure Tags exist (Upsert)
        console.log('Syncing Tags...');
        for (const t of data.tags) {
            await prisma.tag.upsert({
                where: { id: t.id },
                update: {
                    name: t.name,
                    color: t.color,
                    code: t.code
                },
                create: {
                    id: t.id,
                    name: t.name,
                    color: t.color,
                    code: t.code || ''
                }
            });
        }

        // 3. WIPE existing transactions
        console.log('Deleting ALL existing transactions...');
        await prisma.transaction.deleteMany({});

        // 4. Insert Transactions from Backup
        console.log(`Inserting ${data.transactions.length} transactions...`);
        let count = 0;
        for (const t of data.transactions) {
            // Validate Category
            let catId = t.categoryId;
            // If category is provided but doesn't exist in our just-synced list (unlikely), set to null
            if (catId && !data.categories.find(c => c.id === catId)) {
                console.warn(`Tx ${t.description} has unknown category ${catId}. Setting to null.`);
                catId = null;
            }

            // Validate Tags
            const validTagIds = (t.tagIds || []).filter(tid => data.tags.find(tg => tg.id === tid));

            await prisma.transaction.create({
                data: {
                    id: t.id,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    category: catId ? { connect: { id: catId } } : undefined,
                    tags: {
                        connect: validTagIds.map(tid => ({ id: tid }))
                    }
                }
            });
            count++;
        }

        console.log(`Successfully imported ${count} transactions.`);
        console.log('--- Repair Complete ---');

    } catch (e) {
        console.error('Error repairing transactions:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
