import React, { useState, useEffect, useRef } from 'react';
import { categoryService } from '../../services/CategoryService';
import { searchIcons } from '../../data/materialIcons';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryCreated: () => void;
    defaultType?: 'notes' | 'checklist';
}

const PRESET_COLORS = [
    '#5dbb6a', '#4f8ef7', '#f7874f', '#f7cf4f',
    '#c44ff7', '#f74f7a', '#4ff7e8', '#f7f74f',
    '#a0aec0', '#fc8181',
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
    isOpen, onClose, onCategoryCreated, defaultType = 'notes',
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [iconSearch, setIconSearch] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [iconResults, setIconResults] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIconResults(searchIcons(iconSearch));
    }, [iconSearch]);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setColor(PRESET_COLORS[0]);
            setIconSearch('');
            setSelectedIcon('folder');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            await categoryService.addCategory({ name: name.trim(), color, icon: selectedIcon, type: defaultType });
            onCategoryCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create category', err);
            setError('Failed to create category. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onKeyDown={e => { if (e.key === 'Escape') onClose(); }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#242c26] w-full max-w-[85vw] md:max-w-2xl max-h-[95vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-2.5 text-[#5dbb6a]" style={{ color }}>
                        <span className="material-icons-round text-lg">folder_open</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">New Category</span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5" title="Close">
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col px-6 pt-5 pb-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transition-colors duration-200 flex-shrink-0"
                                style={{ backgroundColor: color + '22', border: `1.5px solid ${color}55` }}
                            >
                                <span className="material-icons-round text-xl sm:text-2xl" style={{ color }}>{selectedIcon}</span>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Category title..."
                                className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-black text-slate-100 placeholder-slate-600 transition-colors"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>


                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Color</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className="w-6 h-6 rounded-md transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: c,
                                            outline: color === c ? `2px solid ${c}` : 'none',
                                            outlineOffset: '2px',
                                            boxShadow: color === c ? `0 0 8px ${c}55` : 'none',
                                        }}
                                    />
                                ))}
                                <label className="w-6 h-6 rounded-md border border-border-dark bg-background-dark flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden">
                                    <span className="material-icons-round text-sm text-slate-500">colorize</span>
                                    <input type="color" className="opacity-0 absolute w-0 h-0" value={color} onChange={e => setColor(e.target.value)} />
                                </label>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Icon</label>
                            <div className="relative mb-2">
                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search icons..."
                                    className="w-full bg-background-dark border border-border-dark rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                                    value={iconSearch}
                                    onChange={e => setIconSearch(e.target.value)}
                                />
                            </div>

                            <div className="h-36 overflow-y-auto custom-scrollbar bg-background-dark rounded-xl border border-border-dark p-1.5">
                                {iconResults.length > 0 ? (
                                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-10 gap-1">
                                        {iconResults.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                title={icon.replace(/_/g, ' ')}
                                                onClick={() => setSelectedIcon(icon)}
                                                className={`aspect-square rounded-lg flex items-center justify-center transition-all hover:scale-110 ${selectedIcon === icon ? 'text-background-dark shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                                style={selectedIcon === icon ? { backgroundColor: color, boxShadow: `0 0 10px ${color}55` } : {}}
                                            >
                                                <span className="material-icons-round text-lg">{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                        <span className="material-icons-round text-2xl">search_off</span>
                                        <span className="text-xs">No icons found</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400 pt-2">{error}</p>}

                        <div className="flex justify-end items-center gap-4 pt-2 mt-auto">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">CANCEL</button>
                            <button
                                type="submit"
                                disabled={submitting || !name.trim()}
                                className="px-5 py-2 bg-[#5dbb6a] text-[#1a231d] text-xs font-black tracking-wide rounded-lg hover:bg-[#4ea65a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-2"
                                style={{ backgroundColor: color, color: '#181e19' }}
                            >
                                {submitting ? <span className="material-icons-round text-base animate-spin">refresh</span> : <span className="material-icons-round text-base">add</span>}
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
