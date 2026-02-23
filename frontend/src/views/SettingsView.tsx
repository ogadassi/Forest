import React from 'react';
import { useSettings } from '../context/SettingsContext';

interface ToggleRowProps {
    icon: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border-dark/40 last:border-0">
        <div className="flex items-start gap-3">
            <span className="material-icons-round text-xl text-slate-500 mt-0.5">{icon}</span>
            <div>
                <div className="text-sm font-bold text-slate-200">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{description}</div>
            </div>
        </div>
        {/* Toggle switch */}
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50 ${checked ? 'bg-primary' : 'bg-slate-700'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

export const SettingsView: React.FC = () => {
    const { sidebarClickMode, setSidebarClickMode } = useSettings();
    const isDouble = sidebarClickMode === 'double';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto py-10 px-6">

                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-100 tracking-tight">Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Customise your Forest experience</p>
                </div>

                {/* Section: Sidebar */}
                <div className="bg-card-dark border border-border-dark rounded-2xl px-5 mb-6">
                    <div className="py-4 border-b border-border-dark/40">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-base text-primary/70">view_sidebar</span>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sidebar Behaviour</h2>
                        </div>
                    </div>

                    <ToggleRow
                        icon="touch_app"
                        label="Double-click to toggle sidebars"
                        description={
                            isDouble
                                ? 'Sidebars collapse / expand on double-click. Single clicks on empty space are ignored.'
                                : 'Sidebars collapse / expand on a single click on any empty space.'
                        }
                        checked={isDouble}
                        onChange={(val) => setSidebarClickMode(val ? 'double' : 'single')}
                    />
                </div>

                {/* Placeholder sections to hint at future settings */}
                <div className="bg-card-dark border border-border-dark rounded-2xl px-5 opacity-40 select-none">
                    <div className="py-4 border-b border-border-dark/40">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-base text-primary/70">palette</span>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Appearance</h2>
                            <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-600 border border-border-dark px-2 py-0.5 rounded-full">Coming soon</span>
                        </div>
                    </div>
                    <div className="py-4">
                        <div className="text-xs text-slate-600 italic">Theme, font size, accent colour…</div>
                    </div>
                </div>

            </div>
        </div>
    );
};
