import Joi from "joi";
import { ValidationError } from "./client-errors";

export class CategoryModel {
    public id?: number;
    public name: string;
    public color: string;
    public icon?: string | null;
    public type: string;

    public constructor(category: Partial<CategoryModel>) {
        this.id = category.id;
        this.name = category.name!;
        this.color = category.color || "#718096";
        this.icon = category.icon || undefined;
        this.type = category.type || "notes";
    }

    public static insertValidationSchema = Joi.object({
        id: Joi.number().forbidden(),
        name: Joi.string().required().min(2).max(50),
        color: Joi.string().required().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/), // Hex code validation
        icon: Joi.string().optional().allow(null, ""),
        type: Joi.string().valid('notes', 'checklist', 'timer', 'music').optional()
    });

    public static updateValidationSchema = Joi.object({
        id: Joi.number().integer().positive().required(),
        name: Joi.string().min(2).max(50).optional(),
        color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        icon: Joi.string().optional().allow(null, ""),
        type: Joi.string().valid('notes', 'checklist', 'timer', 'music').optional()
    });

    public validateInsert(): void {
        const result = CategoryModel.insertValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }

    public validateUpdate(): void {
        const result = CategoryModel.updateValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}

