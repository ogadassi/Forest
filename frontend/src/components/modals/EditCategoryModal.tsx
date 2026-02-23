import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../../services/CategoryService';
import { searchIcons } from '../../data/materialIcons';
import type { CategoryModel } from '../../models/CategoryModel';

interface EditCategoryModalProps {
    isOpen: boolean;
    category: CategoryModel | null;
    onClose: () => void;
    onCategoryUpdated: () => void;
}

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
    isOpen, category, onClose, onCategoryUpdated,
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [iconSearch, setIconSearch] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [iconResults, setIconResults] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    // Populate icon results on search change
    useEffect(() => {
        setIconResults(searchIcons(iconSearch));
    }, [iconSearch]);

    // Focus name input when opened and load existing category data
    useEffect(() => {
        if (isOpen && category) {
            setName(category.name);
            setColor(category.color || PRESET_COLORS[0]);
            setIconSearch('');
            setSelectedIcon(category.icon || 'folder');
            setError('');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category) return;
        setSubmitting(true);
        setError('');
        try {
            await categoryService.updateCategory({
                ...category,
                name: name.trim(),
                color,
                icon: selectedIcon
            });
            onCategoryUpdated();
            onClose();
        } catch (err) {
            console.error('Failed to update category', err);
            setError('Failed to update category. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card-dark border border-border-dark rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-dark/50">
                    <div className="flex items-center gap-3">
                        {/* Live preview of selected icon */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-200"
                            style={{ backgroundColor: color + '22', border: `1.5px solid ${color}55` }}
                        >
                            <span className="material-icons-round text-xl" style={{ color }}>
                                {selectedIcon}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-100">Edit Category</h2>
                            <p className="text-[10px] text-slate-500">Update styling and settings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-icons-round text-base">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Personal, Work, Ideas…"
                            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Color
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: c,
                                        outline: color.toLowerCase() === c ? `2px solid ${c}` : 'none',
                                        outlineOffset: '2px',
                                        boxShadow: color.toLowerCase() === c ? `0 0 10px ${c}66` : 'none',
                                    }}
                                />
                            ))}
                            {/* Custom color */}
                            <label
                                className="w-7 h-7 rounded-lg border border-border-dark bg-background-dark flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden"
                                title="Custom colour"
                            >
                                <span className="material-icons-round text-sm text-slate-500">colorize</span>
                                <input
                                    type="color"
                                    className="opacity-0 absolute w-0 h-0"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Icon search */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Icon
                        </label>
                        <div className="relative mb-2">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search icons by word, e.g. book, code, star…"
                                className="w-full bg-background-dark border border-border-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                            />
                            {iconSearch && (
                                <button
                                    type="button"
                                    onClick={() => setIconSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-base">close</span>
                                </button>
                            )}
                        </div>

                        {/* Icon grid */}
                        <div className="h-36 overflow-y-auto custom-scrollbar bg-background-dark rounded-xl border border-border-dark p-2">
                            {iconResults.length > 0 ? (
                                <div className="grid grid-cols-8 gap-1">
                                    {iconResults.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            title={icon.replace(/_/g, ' ')}
                                            onClick={() => setSelectedIcon(icon)}
                                            className={`
                                                aspect-square rounded-lg flex items-center justify-center transition-all hover:scale-110
                                                ${selectedIcon === icon
                                                    ? 'text-background-dark shadow-lg'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                                                }
                                            `}
                                            style={selectedIcon === icon ? { backgroundColor: color, boxShadow: `0 0 12px ${color}66` } : {}}
                                        >
                                            <span className="material-icons-round text-xl">{icon}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <span className="material-icons-round text-2xl">search_off</span>
                                    <span className="text-xs">No icons found for "{iconSearch}"</span>
                                </div>
                            )}
                        </div>

                        {/* Selected icon chip */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className="material-icons-round text-base" style={{ color }}>{selectedIcon}</span>
                            <span className="text-xs text-slate-500 font-mono">{selectedIcon}</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <span className="material-icons-round text-sm">error</span>
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="px-5 py-2 bg-primary text-background-dark text-xs font-black rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {submitting ? (
                                <span className="material-icons-round text-base animate-spin">refresh</span>
                            ) : (
                                <span className="material-icons-round text-base">save</span>
                            )}
                            SAVE SETTINGS
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
