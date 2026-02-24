import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ─── Concept Expansion Map ────────────────────────────────────────────────────
// Maps English query concepts to additional SQL search patterns.
// This is the "smart" layer that works without any LLM.
const CONCEPT_EXPANSIONS: Record<string, string[]> = {
    // Language names → search for content in that script
    hebrew: ['[\u05d0-\u05ea]'],   // Hebrew Unicode block
    arabic: ['[\u0600-\u06ff]'],   // Arabic Unicode block
    english: ['[a-zA-Z]'],
    russian: ['[\u0400-\u04ff]'],
    chinese: ['[\u4e00-\u9fff]'],
    japanese: ['[\u3040-\u30ff]'],
    korean: ['[\uac00-\ud7af]'],

    // Priority aliases
    urgent: ['urgent', 'critical'],
    important: ['high', 'urgent', 'critical'],
    low: ['low priority'],

    // Content type aliases
    checklist: ['checklist', 'todo', 'task'],
    list: ['checklist', 'todo'],
    pinned: ['pinned'],
    pin: ['pinned'],
};

function expandQuery(q: string): string[] {
    const lower = q.toLowerCase().trim();
    const expansions = CONCEPT_EXPANSIONS[lower];
    // Always include the original query, plus any concept expansions
    return [q, ...(expansions || [])].filter((v, i, a) => a.indexOf(v) === i);
}

// ─── Fetch notes matching any of the expanded terms ──────────────────────────
async function fetchMatchingNotes(searchTerms: string[]) {
    const seenIds = new Set<number>();
    const results: any[] = [];

    for (const term of searchTerms) {
        // Title search via Prisma
        const byTitle = await prisma.note.findMany({
            where: { title: { contains: term, mode: "insensitive" } },
            include: { category: { select: { id: true, name: true, color: true, icon: true } } },
            take: 20,
            orderBy: { updatedAt: "desc" }
        });
        for (const n of byTitle) {
            if (!seenIds.has(n.id)) { seenIds.add(n.id); results.push(n); }
        }

        // Content search via raw SQL (JSONB cast + regex for non-Latin scripts)
        const isScript = /^\[.+\]$/.test(term); // e.g. [א-ת]
        const sqlPattern = isScript ? `%${term}%` : `%${term}%`;
        const byContent = await prisma.$queryRawUnsafe<any[]>(`
            SELECT n.id, n.title, n.content, n."contentType", n.priority, n."categoryId", n."createdAt", n."updatedAt",
                   c.id as cat_id, c.name as cat_name, c.color as cat_color, c."icon" as cat_icon
            FROM "Note" n
            JOIN "Category" c ON n."categoryId" = c.id
            WHERE n.content::text ${isScript ? '~' : 'ILIKE'} $1
            LIMIT 15
        `, isScript ? term.slice(1, -1) : sqlPattern).catch(() => [] as any[]);

        for (const row of byContent) {
            if (!seenIds.has(row.id)) {
                seenIds.add(row.id);
                results.push({
                    id: row.id, title: row.title, content: row.content,
                    contentType: row.contentType, priority: row.priority,
                    categoryId: row.categoryId,
                    createdAt: row.createdAt, updatedAt: row.updatedAt,
                    category: { id: row.cat_id, name: row.cat_name, color: row.cat_color, icon: row.cat_icon }
                });
            }
        }
    }

    return results.slice(0, 25);
}

// POST /api/search
// Body: { query: string, aiMode?: boolean }
router.post("/search", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { query } = request.body as { query: string };

        if (!query || query.trim().length === 0) {
            return response.json({ notes: [], categories: [], aiSummary: null });
        }

        const q = query.trim();
        const searchTerms = expandQuery(q);

        // Phase 1: Expanded text search (title + content for all concept terms)
        const [allNotes, categories] = await Promise.all([
            fetchMatchingNotes(searchTerms),
            (async () => {
                const seenIds = new Set<number>();
                const cats: any[] = [];
                for (const term of searchTerms) {
                    const found = await prisma.category.findMany({
                        where: { name: { contains: term, mode: "insensitive" } },
                        take: 10
                    });
                    for (const c of found) {
                        if (!seenIds.has(c.id!)) { seenIds.add(c.id!); cats.push(c); }
                    }
                }
                return cats;
            })()
        ]);

        response.json({ notes: allNotes, categories });
    } catch (err: any) {
        next(err);
    }
});

export const searchController = router;
