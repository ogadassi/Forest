import { z } from "zod";
import type { Note } from "@prisma/client";
import { ValidationError } from "./client-errors";

export class NoteModel {
    public id?: number;
    public title: string;
    public content: any;
    public contentType: 'text' | 'checklist' | 'timer' | 'song' | 'demo';
    public categoryId: number;
    public priority: number;
    public isPinned: boolean;
    public isCompleted: boolean;
    public attachments: any[];
    public remindAt?: Date | null;
    public createdAt?: Date;
    public updatedAt?: Date;
    public order?: number;
    public color?: string | null;

    public constructor(note: Partial<NoteModel> | Note) {
        this.id = note.id;
        this.title = note.title!;
        this.content = note.content;
        this.contentType = (note as any).contentType || 'text';
        this.categoryId = note.categoryId!;
        this.priority = note.priority || 1;
        this.isPinned = (note as any).isPinned || false;
        this.isCompleted = (note as any).isCompleted || false;
        this.attachments = (note as any).attachments || [];
        this.remindAt = note.remindAt ? new Date(note.remindAt) : undefined;
        this.createdAt = note.createdAt;
        this.updatedAt = note.updatedAt;
        this.order = note.order;
        this.color = note.color ?? null;
    }

    public static insertValidationSchema = z.object({
        title: z.string().max(100),
        content: z.any(),
        contentType: z.enum(['text', 'checklist', 'timer', 'song', 'demo']),
        categoryId: z.number().int().positive(),
        priority: z.number().int().min(1).max(5),
        isPinned: z.boolean(),
        isCompleted: z.boolean().optional().default(false),
        attachments: z.array(z.any()).optional().default([]),
        remindAt: z.coerce.date().nullable().optional(),
        order: z.number().int().optional(),
        color: z.string().nullable().optional(),
    });

    public static updateValidationSchema = z.object({
        id: z.number().int().positive(),
        title: z.string().max(100).optional(),
        content: z.any().optional(),
        contentType: z.enum(['text', 'checklist', 'timer', 'song', 'demo']).optional(),
        categoryId: z.number().int().positive().optional(),
        priority: z.number().int().min(1).max(5).optional(),
        isPinned: z.boolean().optional(),
        isCompleted: z.boolean().optional(),
        attachments: z.array(z.any()).optional(),
        remindAt: z.coerce.date().nullable().optional(),
        createdAt: z.coerce.date().optional(),
        updatedAt: z.coerce.date().optional(),
        order: z.number().int().optional(),
        color: z.string().nullable().optional(),
    });

    public validateInsert(): void {
        const result = NoteModel.insertValidationSchema.safeParse(this);
        if (!result.success) throw new ValidationError(result.error.message);
    }

    public validateUpdate(): void {
        const result = NoteModel.updateValidationSchema.safeParse(this);
        if (!result.success) throw new ValidationError(result.error.message);
    }
}