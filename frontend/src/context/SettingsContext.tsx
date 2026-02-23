import React, { createContext, useContext, useState } from 'react';

type SidebarClickMode = 'single' | 'double';

interface SettingsContextValue {
    sidebarClickMode: SidebarClickMode;
    setSidebarClickMode: (mode: SidebarClickMode) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
    sidebarClickMode: 'double',
    setSidebarClickMode: () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarClickMode, setSidebarClickModeState] = useState<SidebarClickMode>(() => {
        return (localStorage.getItem('sidebarClickMode') as SidebarClickMode) || 'double';
    });

    const setSidebarClickMode = (mode: SidebarClickMode) => {
        setSidebarClickModeState(mode);
        localStorage.setItem('sidebarClickMode', mode);
    };

    return (
        <SettingsContext.Provider value={{ sidebarClickMode, setSidebarClickMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
