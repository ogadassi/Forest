import api from "../utils/api";
import type { CategoryModel } from "../models/CategoryModel";

class CategoryService {
    public async getAllCategories(): Promise<CategoryModel[]> {
        const response = await api.get<CategoryModel[]>("/categories");
        return response.data;
    }

    public async getCategoryById(id: number): Promise<CategoryModel> {
        const response = await api.get<CategoryModel>(`/categories/${id}`);
        return response.data;
    }

    public async addCategory(category: CategoryModel): Promise<CategoryModel> {
        const response = await api.post<CategoryModel>("/categories", category);
        return response.data;
    }

    public async updateCategory(category: CategoryModel): Promise<CategoryModel> {
        const response = await api.put<CategoryModel>(`/categories/${category.id}`, category);
        return response.data;
    }

    public async deleteCategory(id: number): Promise<void> {
        await api.delete(`/categories/${id}`);
    }
}

export const categoryService = new CategoryService();
