import Joi from "joi";
import { ValidationError } from "./client-errors";

export class UserModel {
    public id?: number;
    public firstName: string;
    public lastName: string;
    public email: string;
    public password?: string;
    public roleId: number;

    public constructor(user: UserModel) {
        this.id = user.id;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.password = user.password;
        this.roleId = user.roleId;
    }

    public static registerValidationSchema = Joi.object({
        id: Joi.number().forbidden().optional(),
        firstName: Joi.string().required().min(2).max(50),
        lastName: Joi.string().required().min(2).max(50),
        email: Joi.string().required().email().min(5).max(100),
        password: Joi.string().required().min(4).max(100),
        roleId: Joi.number().integer().positive().optional()
    });

    public static loginValidationSchema = Joi.object({
        email: Joi.string().required().email().min(5).max(100),
        password: Joi.string().required().min(4).max(100)
    });

    public validateRegister(): void {
        const result = UserModel.registerValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }

    public validateLogin(): void {
        const result = UserModel.loginValidationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}
