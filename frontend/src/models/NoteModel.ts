import type { CategoryModel } from "./CategoryModel";

export interface NoteModel {
    id?: number;
    title: string;
    content: any; // JSONB can be string or array
    contentType: 'text' | 'checklist';
    categoryId: number;
    category?: CategoryModel;
    priority: number;
    isPinned: boolean;
    isCompleted?: boolean;
    attachments: any[];
    remindAt?: Date | string; // Date string from JSON
    createdAt?: Date | string;
    updatedAt?: Date | string;
    order?: number;
}
