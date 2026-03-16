import type { CategoryModel } from "./CategoryModel";

export interface NoteModel {
    id?: number;
    title: string;
    content: any; // JSONB can be string or array
    contentType: 'text' | 'checklist' | 'timer';
    categoryId: number;
    category?: CategoryModel;
    isCompleted?: boolean;
    attachments: any[];
    remindAt?: Date | string; // Date string from JSON
    color?: string;           // Optional per-note background tint
    createdAt?: Date | string;
    updatedAt?: Date | string;
    order?: number;
}
