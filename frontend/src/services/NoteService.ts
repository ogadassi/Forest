import api from "../utils/api";
import type { NoteModel } from "../models/NoteModel";

class NoteService {
    public async getAllNotes(): Promise<NoteModel[]> {
        const response = await api.get<NoteModel[]>("/notes");
        return response.data;
    }

    public async getNoteById(id: number): Promise<NoteModel> {
        const response = await api.get<NoteModel>(`/notes/${id}`);
        return response.data;
    }

    public async addNote(note: NoteModel): Promise<NoteModel> {
        const response = await api.post<NoteModel>("/notes", note);
        return response.data;
    }

    public async updateNote(note: NoteModel): Promise<NoteModel> {
        const response = await api.put<NoteModel>(`/notes/${note.id}`, note);
        return response.data;
    }

    public async deleteNote(id: number): Promise<void> {
        await api.delete(`/notes/${id}`);
    }

    public async reorderNotes(updates: { id: number, order: number }[]): Promise<void> {
        await api.put('/notes/reorder', updates);
    }
}

export const noteService = new NoteService();
