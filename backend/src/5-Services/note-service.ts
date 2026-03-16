import dal from "../2-utils/dal";
import { NoteModel } from "../3-Models/note-model";
import { ResourceNotFoundError } from "../3-Models/client-errors";

class NoteService {

    public async getAllNotes(): Promise<NoteModel[]> {
        const notes = await dal.note.findMany({
            include: { category: true },
            orderBy: [
                { order: 'asc' },
                { updatedAt: 'desc' }
            ]
        });

        return notes.map(note => new NoteModel(note as any));
    }

    public async getNoteById(id: number): Promise<NoteModel> {
        const note = await dal.note.findUnique({
            where: { id },
            include: { category: true }
        });
        if (!note) throw new ResourceNotFoundError(id);

        return new NoteModel(note as any);
    }

    public async addNote(note: NoteModel): Promise<NoteModel> {
        note.validateInsert();

        // Strip out any prototype methods or undefined properties before passing to Prisma
        const { id, createdAt, updatedAt, isPinned, category, ...plainNote } = note as any;

        const addedNote = await dal.note.create({
            data: plainNote as any
        });

        return new NoteModel(addedNote as any);
    }

    public async updateNote(note: NoteModel): Promise<NoteModel> {
        note.validateUpdate();

        // Strip out any prototype methods or undefined properties before passing to Prisma
        const { id, createdAt, updatedAt, isPinned, category, ...plainNote } = note as any;

        const updatedNote = await dal.note.update({
            where: { id: note.id },
            data: plainNote as any
        });

        return new NoteModel(updatedNote as any);
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
