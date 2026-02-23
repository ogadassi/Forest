import dal from "../2-utils/dal";
import { CategoryModel } from "../3-Models/category-model";
import { ResourceNotFoundError } from "../3-Models/client-errors";

class CategoryService {

    public async getAllCategories(): Promise<CategoryModel[]> {
        const categories = await dal.category.findMany();
        return categories.map(category => new CategoryModel(category));
    }

    // "Details Guy" might want to get category by ID
    public async getCategoryById(id: number): Promise<CategoryModel> {
        const category = await dal.category.findUnique({ where: { id } });
        if (!category) throw new ResourceNotFoundError(id);
        return new CategoryModel(category);
    }

    public async addCategory(category: CategoryModel): Promise<CategoryModel> {
        category.validateInsert();
        const addedCategory = await dal.category.create({
            data: category
        });
        return new CategoryModel(addedCategory);
    }

    public async updateCategory(category: CategoryModel): Promise<CategoryModel> {
        category.validateUpdate();
        const updatedCategory = await dal.category.update({
            where: { id: category.id },
            data: category
        });
        return new CategoryModel(updatedCategory);
    }

    public async deleteCategory(id: number): Promise<void> {
        try {
            await dal.category.delete({ where: { id } });
        } catch (err: any) {
            // Prisma error P2025: Record to delete does not exist.
            if (err.code === 'P2025') throw new ResourceNotFoundError(id);
            throw err;
        }
    }
}

export const categoryService = new CategoryService();
