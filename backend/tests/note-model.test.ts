import { NoteModel } from '../src/3-Models/note-model';

describe('NoteModel Zod Validation', () => {
    it('should validate a correct insert payload', () => {
        const validPayload = {
            title: 'Test Note',
            content: 'Hello World',
            contentType: 'text' as const,
            categoryId: 1,
            priority: 2,
            isPinned: false
        };

        const note = new NoteModel(validPayload as any);
        expect(() => note.validateInsert()).not.toThrow();
    });

    it('should throw an error for missing required title', () => {
        const invalidPayload = {
            content: 'Hello World',
            contentType: 'text' as const,
            categoryId: 1,
            priority: 2,
            isPinned: false
        };

        const note = new NoteModel(invalidPayload as any);
        expect(() => note.validateInsert()).toThrow();
    });

    it('should throw an error for exceedingly long title', () => {
        const invalidPayload = {
            title: 'A'.repeat(101),
            content: 'Hello World',
            contentType: 'text' as const,
            categoryId: 1,
            priority: 2,
            isPinned: false
        };

        const note = new NoteModel(invalidPayload as any);
        expect(() => note.validateInsert()).toThrow();
    });

    it('should validate correct update payload', () => {
        const updatePayload = {
            id: 1,
            title: 'Updated Title'
        };

        const note = new NoteModel(updatePayload as any);
        expect(() => note.validateUpdate()).not.toThrow();
    });

    it('should throw an error if update misses positive ID', () => {
        const invalidUpdatePayload = {
            id: -1,
            title: 'Updated Title'
        };

        const note = new NoteModel(invalidUpdatePayload as any);
        expect(() => note.validateUpdate()).toThrow();
    });
});
