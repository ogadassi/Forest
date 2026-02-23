export interface CategoryModel {
    id?: number;
    name: string;
    color: string;
    icon?: string;
    type?: 'notes' | 'checklist';
}
