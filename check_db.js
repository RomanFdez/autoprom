import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const tx = await prisma.transaction.count();
        const cats = await prisma.category.count();
        const tags = await prisma.tag.count();
        const todos = await prisma.todo.count();

        console.log(`Transactions: ${tx}`);
        console.log(`Categories: ${cats}`);
        console.log(`Tags: ${tags}`);
        console.log(`Todos: ${todos}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
