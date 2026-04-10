
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // 1. Create Categories (Columns)
    const forest = await prisma.category.upsert({
        where: { name: "Forest" },
        update: {},
        create: { name: "Forest", color: "#5DBB6A" }
    });

    const dashboard = await prisma.category.upsert({
        where: { name: "Dashboard" },
        update: {},
        create: { name: "Dashboard", color: "#4C594F" }
    });

    const swords = await prisma.category.upsert({
        where: { name: "Swords" },
        update: {},
        create: { name: "Swords", color: "#2A332C" }
    });

    // 2. Create Notes
    await prisma.note.create({
        data: {
            title: "Project Goals",
            content: "1. Build Backend\n2. Build Frontend\n3. Integrate\n4. Profit?",
            contentType: "text",
            categoryId: forest.id,
            priority: 2,
            attachments: []
        }
    });

    await prisma.note.create({
        data: {
            title: "System Stats Idea",
            content: "Use WebSocket for real-time latency updates in the sidebar.",
            contentType: "text",
            categoryId: dashboard.id,
            priority: 3,
            attachments: []
        }
    });

    await prisma.note.create({
        data: {
            title: "Longsword Techniques",
            content: "- Ochs\n- Pflug\n- Alber\n- Vom Tag",
            contentType: "text",
            categoryId: swords.id,
            priority: 5,
            attachments: []
        }
    });


    console.log("✅ Seeding complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
