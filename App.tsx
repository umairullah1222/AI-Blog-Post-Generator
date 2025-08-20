


import React from 'react';
import { useAppContext } from './contexts/AppContext.tsx';

import Sidebar from './components/Sidebar.tsx';
import Controls from './components/Controls.tsx';
import PostDisplay from './components/PostDisplay.tsx';
import SettingsView from './components/SettingsView.tsx';
import HistoryView from './components/HistoryView.tsx';
import AutomationView from './components/AutomationView.tsx';
import ResearchView from './components/ResearchView.tsx';
import HomeView from './components/HomeView.tsx';
import ProfileView from './components/ProfileView.tsx';
import AuthView from './components/AuthView.tsx';
import GscView from './components/GscView.tsx';
import { XCircleIcon } from './components/icons.tsx';
import Spinner from './components/Spinner.tsx';

function App() {
    const { activeView, isAuthModalOpen, setIsAuthModalOpen, isAuthLoading } = useAppContext();

    if (isAuthLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen w-full p-4 text-white font-sans bg-gradient-to-br from-[#111827] to-[#1e1b4b]">
                <Spinner className="h-10 w-10 text-white" />
            </div>
        )
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'posts':
                return (
                    <div className="grid grid-cols-12 gap-6 h-full">
                        <div className="col-span-12 lg:col-span-5 xl:col-span-4 h-full">
                            <Controls />
                        </div>
                        <div className="col-span-12 lg:col-span-7 xl:col-span-8 h-full">
                            <PostDisplay />
                        </div>
                    </div>
                );
            case 'settings':
                return (
                     <div className="h-full">
                        <SettingsView />
                    </div>
                );
            case 'history':
                return <HistoryView />;
            case 'automation':
                 return <AutomationView />;
            case 'research':
                return <ResearchView />;
            case 'gsc':
                return <GscView />;
            case 'profile':
                return <ProfileView />;
            case 'home':
            default:
                return (
                    <div className="h-full">
                        <HomeView />
                    </div>
                );
        }
    }
    
    return (
        <div className="flex items-center justify-center min-h-screen w-full p-4 text-white font-sans bg-gradient-to-br from-[#111827] to-[#1e1b4b]">
            <div className="w-full max-w-[95rem] h-[95vh] bg-slate-900/50 backdrop-blur-2xl border border-white/20 rounded-2xl flex overflow-hidden shadow-2xl">
                <Sidebar />
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto custom-scrollbar">
                {renderActiveView()}
                </main>
            </div>
            {isAuthModalOpen && (
                 <div className="fixed inset-0 bg-gradient-to-br from-[#111827] to-[#1e1b4b] z-50 animate-fade-in p-4" onClick={() => setIsAuthModalOpen(false)}>
                    <div className="relative w-full h-full" onClick={e => e.stopPropagation()}>
                        <AuthView />
                        <button 
                            onClick={() => setIsAuthModalOpen(false)} 
                            className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors z-10"
                            aria-label="Close"
                        >
                            <XCircleIcon className="h-8 w-8" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;