import dal from "../2-utils/dal"; // Currently 2-utils
import { NoteModel } from "../3-Models/note-model"; // Currently 3-Models
import { ResourceNotFoundError } from "../3-Models/client-errors";

class NoteService {

    public async getAllNotes(): Promise<NoteModel[]> {
        // Order by isPinned (desc -> true first), then updatedAt (desc -> new first)
        const notes = await dal.note.findMany({
            include: { category: true },
            orderBy: [
                { isPinned: 'desc' },
                { order: 'asc' },
                { updatedAt: 'desc' }
            ]
        });
        return notes.map(note => new NoteModel(note as unknown as NoteModel)); // Cast for Json handling compatibility if needed
    }

    public async getNoteById(id: number): Promise<NoteModel> {
        const note = await dal.note.findUnique({
            where: { id },
            include: { category: true } // "Details guy" wants the category join
        });
        if (!note) throw new ResourceNotFoundError(id);
        return new NoteModel(note as unknown as NoteModel);
    }

    public async addNote(note: NoteModel): Promise<NoteModel> {
        note.validateInsert();
        // Prisma handles id autoincrement, createdAt, updatedAt
        const addedNote = await dal.note.create({
            data: note
        });
        // Return with category included? usually strictly returning what was added is fine, 
        // but for a dashboard, having the category immediately is nice.
        // Let's refetch or include in return if possible, or just return basic.
        // For efficiency, just return what Prisma returns.
        return new NoteModel(addedNote as unknown as NoteModel);
    }

    public async updateNote(note: NoteModel): Promise<NoteModel> {
        note.validateUpdate();

        // check existence? Prisma throws if not found? 
        // Better to check or let prisma throw "Record to update not found."
        // We will catch and rethrow or let global error handler catch it.
        // But we want ResourceNotFoundError specifically if possible?
        // Prisma P2025 is "Record to update not found".

        const updatedNote = await dal.note.update({
            where: { id: note.id },
            data: note
        });
        return new NoteModel(updatedNote as unknown as NoteModel);
    }

    public async deleteNote(id: number): Promise<void> {
        try {
            await dal.note.delete({ where: { id } });
        } catch (err: any) {
            if (err.code === 'P2025') throw new ResourceNotFoundError(id);
            throw err;
        }
    }

    public async reorderNotes(updates: { id: number, order: number }[]): Promise<void> {
        // Execute a raw transaction or iterative update to change order values for multiple notes
        await dal.$transaction(
            updates.map((update) =>
                dal.note.update({
                    where: { id: update.id },
                    data: { order: update.order }
                })
            )
        );
    }
}

export const noteService = new NoteService();
