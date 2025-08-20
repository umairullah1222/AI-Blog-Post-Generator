

import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { HomeIcon, PostsIcon, SettingsIcon, PenIcon, HistoryIcon, AutomationIcon, ResearchIcon, UserIcon, GscIcon } from './icons.tsx';
import type { View } from '../types.ts';

interface NavItemProps {
    icon: React.ReactNode,
    label: string,
    isActive?: boolean,
    onClick?: () => void
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                isActive 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
            aria-label={label}
        >
            {icon}
            <span className="text-xs mt-1 font-medium">{label}</span>
        </button>
    );
};

function Sidebar(): React.ReactNode {
    const { activeView, setActiveView, currentUser, setIsAuthModalOpen } = useAppContext();

    const onNavigate = (view: View) => {
        const protectedViews: View[] = ['posts', 'research', 'history', 'automation', 'profile', 'gsc'];
        if (protectedViews.includes(view) && !currentUser) {
            setIsAuthModalOpen(true);
        } else {
            setActiveView(view);
        }
    };

    return (
        <aside className="w-20 bg-black/20 border-r border-white/10">
            <div className="h-full flex flex-col items-center p-3">
                {/* Logo Section */}
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-8 flex-shrink-0">
                    <PenIcon className="h-5 w-5 text-white" />
                </div>
                
                {/* Main Navigation */}
                <nav className="space-y-3">
                    <NavItem 
                        icon={<HomeIcon className="h-6 w-6" />} 
                        label="Home"
                        isActive={activeView === 'home'}
                        onClick={() => onNavigate('home')}
                    />
                    <NavItem 
                        icon={<PostsIcon className="h-6 w-6" />} 
                        label="Posts"
                        isActive={activeView === 'posts'}
                        onClick={() => onNavigate('posts')}
                    />
                     <NavItem 
                        icon={<ResearchIcon className="h-6 w-6" />} 
                        label="Research"
                        isActive={activeView === 'research'}
                        onClick={() => onNavigate('research')}
                    />
                     <NavItem 
                        icon={<GscIcon className="h-6 w-6" />} 
                        label="GSC"
                        isActive={activeView === 'gsc'}
                        onClick={() => onNavigate('gsc')}
                    />
                     <NavItem 
                        icon={<HistoryIcon className="h-6 w-6" />} 
                        label="History"
                        isActive={activeView === 'history'}
                        onClick={() => onNavigate('history')}
                    />
                    <NavItem 
                        icon={<AutomationIcon className="h-6 w-6" />} 
                        label="Automation"
                        isActive={activeView === 'automation'}
                        onClick={() => onNavigate('automation')}
                    />
                </nav>
                
                {/* Bottom group pushed down with mt-auto */}
                <div className="mt-auto space-y-3 w-full">
                     <NavItem 
                        icon={
                            currentUser?.profilePicture ? (
                                <img src={currentUser.profilePicture} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                <UserIcon className="h-6 w-6" />
                            )
                        }
                        label="Profile"
                        isActive={activeView === 'profile'}
                        onClick={() => onNavigate('profile')}
                    />
                     <NavItem 
                        icon={<SettingsIcon className="h-6 w-6" />} 
                        label="Settings"
                        isActive={activeView === 'settings'}
                        onClick={() => onNavigate('settings')}
                    />
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;