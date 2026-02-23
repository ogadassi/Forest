import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { BoardView } from './views/BoardView';
import { SettingsView } from './views/SettingsView';
import { SettingsProvider } from './context/SettingsContext';

function App() {
    return (
        <SettingsProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Navigate to="/board" replace />} />
                        <Route path="board" element={<BoardView />} />
                        <Route path="settings" element={<SettingsView />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </SettingsProvider>
    );
}

export default App;
