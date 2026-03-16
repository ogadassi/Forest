import Joi from "joi";
import { ValidationError } from "./client-errors";

export class NoteModel {
    public id?: number;
    public title: string;
    public content: any;
    public contentType: 'text' | 'checklist' | 'timer';
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

    public constructor(note: Partial<NoteModel>) {
        this.id = note.id;
        this.title = note.title!;
        this.content = note.content;
        this.contentType = note.contentType || 'text';
        this.categoryId = note.categoryId!;
        this.priority = note.priority || 1;
        this.isPinned = note.isPinned || false;
        this.isCompleted = note.isCompleted || false;
        this.attachments = note.attachments || [];
        this.remindAt = note.remindAt ? new Date(note.remindAt) : undefined;
        this.createdAt = note.createdAt;
        this.updatedAt = note.updatedAt;
        this.order = note.order;
        this.color = note.color ?? null;
    }

    public static insertValidationSchema = Joi.object({
        id: Joi.number().forbidden(),
        title: Joi.string().required().min(1).max(100),
        content: Joi.any().required(), // JSONB can be string or array
        contentType: Joi.string().required().valid('text', 'checklist', 'timer'),
        categoryId: Joi.number().integer().positive().required(),
        priority: Joi.number().integer().min(1).max(5).required(),
        isPinned: Joi.boolean().required(),
        isCompleted: Joi.boolean().optional(),
        attachments: Joi.array().optional(),
        remindAt: Joi.date().optional().allow(null),
        createdAt: Joi.date().optional(),
        updatedAt: Joi.date().optional(),
        order: Joi.number().integer().optional(),
        color: Joi.string().optional().allow(null, ''),
    });

    public static updateValidationSchema = Joi.object({
        id: Joi.number().integer().positive().required(),
        title: Joi.string().min(1).max(100).optional(),
        content: Joi.any().optional(),
        contentType: Joi.string().valid('text', 'checklist', 'timer').optional(),
        categoryId: Joi.number().integer().positive().optional(),
        priority: Joi.number().integer().min(1).max(5).optional(),
        isPinned: Joi.boolean().optional(),
        isCompleted: Joi.boolean().optional(),
        attachments: Joi.array().optional(),
        remindAt: Joi.date().optional().allow(null),
        createdAt: Joi.date().optional(),
        updatedAt: Joi.date().optional(),
        order: Joi.number().integer().optional(),
        color: Joi.string().optional().allow(null, ''),
    });


    public validateInsert(): void {
        const result = NoteModel.insertValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }

    public validateUpdate(): void {
        const result = NoteModel.updateValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}