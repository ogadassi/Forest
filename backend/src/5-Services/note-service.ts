import dal from "../2-utils/dal";
import { NoteModel } from "../3-Models/note-model";
import { Prisma } from "@prisma/client";
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

        return notes.map(note => new NoteModel(note));
    }

    public async getNoteById(id: number): Promise<NoteModel> {
        const note = await dal.note.findUnique({
            where: { id },
            include: { category: true }
        });
        if (!note) throw new ResourceNotFoundError(id);

        return new NoteModel(note);
    }

    public async addNote(note: NoteModel): Promise<NoteModel> {
        note.validateInsert();

        const createData: Prisma.NoteUncheckedCreateInput = {
            title: note.title,
            content: note.content ?? Prisma.JsonNull,
            contentType: note.contentType,
            categoryId: note.categoryId,
            priority: note.priority,
            isCompleted: note.isCompleted,
            attachments: note.attachments ?? [],
            remindAt: note.remindAt,
            order: note.order,
            color: note.color
        };

        const addedNote = await dal.note.create({
            data: createData
        });

        return new NoteModel(addedNote);
    }

    public async updateNote(note: NoteModel): Promise<NoteModel> {
        note.validateUpdate();

        const updateData: Prisma.NoteUncheckedUpdateInput = {
            title: note.title,
            content: note.content ?? Prisma.JsonNull,
            contentType: note.contentType,
            categoryId: note.categoryId,
            priority: note.priority,
            isCompleted: note.isCompleted,
            attachments: note.attachments,
            remindAt: note.remindAt,
            order: note.order,
            color: note.color
        };

        const updatedNote = await dal.note.update({
            where: { id: note.id },
            data: updateData
        });

        return new NoteModel(updatedNote);
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
