const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BACKUP_PATH = '/Users/alvaroroman/Downloads/backup_2025-12-23.json';

async function restore() {
    console.log(`Reading backup from ${BACKUP_PATH}...`);
    try {
        if (!fs.existsSync(BACKUP_PATH)) {
            console.error('Backup file not found!');
            return;
        }

        const rawData = fs.readFileSync(BACKUP_PATH, 'utf-8');
        const data = JSON.parse(rawData);
        const { transactions, categories, tags, settings } = data;

        console.log('Backup loaded. Starting restore...');
        console.log(`- Transactions: ${transactions?.length || 0}`);
        console.log(`- Categories: ${categories?.length || 0}`);
        console.log(`- Tags: ${tags?.length || 0}`);

        await prisma.$transaction(async (tx) => {
            // 1. Clean existing data
            console.log('Cleaning database...');
            await tx.transaction.deleteMany();
            await tx.tag.deleteMany();
            await tx.category.deleteMany();
            await tx.settings.deleteMany();

            // 2. Insert Settings
            if (settings) {
                console.log('Restoring Settings...');
                await tx.settings.create({
                    data: {
                        id: 'settings',
                        initialBalance: parseFloat(settings.initialBalance || 0)
                    }
                });
            }

            // 3. Insert Categories
            if (categories && categories.length > 0) {
                console.log('Restoring Categories...');
                for (const c of categories) {
                    const data = {
                        id: c.id,
                        code: c.code || '',
                        name: c.name,
                        color: c.color,
                        icon: c.icon || 'category',
                        isFixed: !!c.isFixed,
                        debt: parseFloat(c.debt || 0)
                    };
                    await tx.category.upsert({
                        where: { id: c.id },
                        update: data,
                        create: data
                    });
                }
            }

            // 4. Insert Tags
            if (tags && tags.length > 0) {
                console.log('Restoring Tags...');
                for (const t of tags) {
                    const data = {
                        id: t.id,
                        code: t.code || '',
                        name: t.name,
                        color: t.color
                    };
                    await tx.tag.upsert({
                        where: { id: t.id },
                        update: data,
                        create: data
                    });
                }
            }

            // 5. Insert Transactions
            if (transactions && transactions.length > 0) {
                console.log('Restoring Transactions...');
                let count = 0;
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
                    count++;
                    if (count % 100 === 0) process.stdout.write('.');
                }
                console.log('\n');
            }
        });

        console.log('Restore completed successfully!');
    } catch (e) {
        console.error('Error during restoration:', e.message);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
