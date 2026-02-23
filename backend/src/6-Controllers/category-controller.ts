import express, { Request, Response, NextFunction } from "express";
import { categoryService } from "../5-Services/category-service";
import { CategoryModel } from "../3-Models/category-model";
import { StatusCode } from "../3-Models/enums";
import { socketService } from "../5-Services/socket-service";

const router = express.Router();

// GET http://localhost:3001/api/categories
router.get("/categories", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const categories = await categoryService.getAllCategories();
        response.json(categories);
    } catch (err: any) {
        next(err);
    }
});

// GET http://localhost:3001/api/categories/:id
router.get("/categories/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = +request.params.id;
        const category = await categoryService.getCategoryById(id);
        response.json(category);
    } catch (err: any) {
        next(err);
    }
});

// POST http://localhost:3001/api/categories
router.post("/categories", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const category = new CategoryModel(request.body);
        const addedCategory = await categoryService.addCategory(category);
        socketService.broadcast("category-updated");
        response.status(StatusCode.Created).json(addedCategory);
    } catch (err: any) {
        next(err);
    }
});

// PUT http://localhost:3001/api/categories/:id
router.put("/categories/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        request.body.id = +request.params.id;
        const category = new CategoryModel(request.body);
        const updatedCategory = await categoryService.updateCategory(category);
        socketService.broadcast("category-updated");
        response.json(updatedCategory);
    } catch (err: any) {
        next(err);
    }
});

// DELETE http://localhost:3001/api/categories/:id
router.delete("/categories/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = +request.params.id;
        await categoryService.deleteCategory(id);
        socketService.broadcast("category-updated");
        response.status(StatusCode.NoContent).sendStatus(StatusCode.NoContent);
    } catch (err: any) {
        next(err);
    }
});

export const categoryController = router;
