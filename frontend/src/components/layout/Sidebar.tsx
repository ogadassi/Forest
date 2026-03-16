import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import type { CategoryModel } from '../../models/CategoryModel';

interface SidebarProps {
    categories: CategoryModel[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    iconOnly: boolean;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
    iconOnly,
    onToggleCollapse,
}) => {
    const { sidebarClickMode } = useSettings();
    const navigate = useNavigate();
    const isDouble = sidebarClickMode === 'double';
    const modeWord = isDouble ? 'Double-click' : 'Click';

    const handleEmptyClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        if (!(e.target as HTMLElement).closest('button, a, input, select, label, [role="button"]')) {
            onToggleCollapse();
        }
    };

    const clickProps = isDouble
        ? { onDoubleClick: handleEmptyClick }
        : { onClick: handleEmptyClick };

    return (
        <aside
            {...clickProps}
            title={iconOnly ? `${modeWord} to expand sidebar` : `${modeWord} to collapse sidebar`}
            className="h-full flex flex-col bg-background-dark border-r border-border-dark overflow-hidden cursor-pointer select-none"
        >
            {/* ── HEADER ── */}
            <div className={`h-16 flex items-center border-b border-border-dark/50 shrink-0 ${iconOnly ? 'justify-center px-2' : 'justify-between px-4'}`}>
                <button
                    onClick={() => { onSelectCategory(null); navigate('/board'); }}
                    title="Forest — Dashboard"
                    className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-background-dark hover:bg-primary/85 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                >
                    <span className="material-icons-round text-lg">forest</span>
                </button>

                {!iconOnly && (
                    <button
                        onClick={() => { onSelectCategory(null); navigate('/board'); }}
                        className="ml-3 font-black text-base tracking-tight text-slate-100 flex-1 whitespace-nowrap select-none text-left hover:text-primary transition-colors"
                    >
                        Forest
                    </button>
                )}

                {!iconOnly && (
                    <button
                        onClick={onToggleCollapse}
                        title="Collapse sidebar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-card-dark transition-all ml-1 shrink-0"
                    >
                        <span className="material-icons-round text-base">chevron_left</span>
                    </button>
                )}
            </div>

            {/* ── NAV ── */}
            <nav className="flex flex-col gap-0.5 flex-1 w-full py-3 px-2 overflow-y-auto custom-scrollbar">
                <NavItem
                    icon="dashboard"
                    label="Dashboard"
                    active={selectedCategoryId === null}
                    iconOnly={iconOnly}
                    onClick={() => { onSelectCategory(null); navigate('/board'); }}
                />

                <div className={`my-2 ${iconOnly ? 'px-1' : 'px-2'}`}>
                    <div className="h-px bg-border-dark/60" />
                    {!iconOnly && (
                        <div className="flex items-center justify-between px-2 mt-2 mb-0.5">
                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                                Widgets
                            </div>
                        </div>
                    )}
                </div>

                {categories.map(category => (
                    <NavItem
                        key={category.id}
                        icon={category.icon || 'folder'}
                        label={category.name}
                        active={selectedCategoryId === category.id}
                        iconOnly={iconOnly}
                        onClick={() => onSelectCategory(category.id!)}
                    />
                ))}
            </nav>

            {/* ── FOOTER ── */}
            <div className={`shrink-0 border-t border-border-dark/30 py-3 px-2 flex flex-col gap-0.5`}>
                <NavItem icon="settings" label="Settings" active={false} iconOnly={iconOnly} onClick={() => navigate('/settings')} />
                <div className={`flex items-center gap-3 rounded-xl px-2 py-2 mt-1 hover:bg-card-dark transition-all cursor-pointer ${iconOnly ? 'justify-center' : ''}`}>
                    <div className="w-7 h-7 rounded-full border border-border-dark bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-icons-round text-sm text-slate-400">person</span>
                    </div>
                    {!iconOnly && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-200 truncate">Admin User</span>
                            <span className="text-[10px] text-slate-500">Pro Plan</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

interface NavItemProps {
    icon: string;
    label: string;
    active: boolean;
    iconOnly: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, iconOnly, onClick }) => (
    <button
        onClick={onClick}
        title={iconOnly ? label : undefined}
        className={`
            group flex items-center gap-3 w-full rounded-xl px-2 py-2.5 transition-all text-left relative
            ${active ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-white hover:bg-white/5'}
            ${iconOnly ? 'justify-center' : ''}
        `}
    >
        <span className="material-icons-round text-xl shrink-0 group-hover:scale-110 transition-transform">{icon}</span>
        {!iconOnly && (
            <span className="font-semibold text-sm tracking-wide truncate flex-1">{label}</span>
        )}
        {active && !iconOnly && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
        {active && iconOnly && <span className="absolute left-0 inset-y-2 w-0.5 rounded-r-full bg-primary" />}
    </button>
);
