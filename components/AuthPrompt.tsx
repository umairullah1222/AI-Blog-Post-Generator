
import React from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { KeyIcon } from './icons.tsx';

interface AuthPromptProps {
    icon?: React.ReactNode;
    title: string;
    message: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ icon, title, message }) => {
    const { setIsAuthModalOpen } = useAppContext();

    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="w-20 h-20 bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                {icon || <KeyIcon className="h-10 w-10 text-slate-500" />}
            </div>
            <h3 className="text-xl font-semibold text-slate-200">{title}</h3>
            <p className="mt-2 max-w-sm text-slate-400">{message}</p>
            <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
            >
                Login or Sign Up
            </button>
        </div>
    );
};

export default AuthPrompt;