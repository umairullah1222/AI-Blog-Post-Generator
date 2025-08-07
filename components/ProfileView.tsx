
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { UserIcon, XCircleIcon, CheckCircleIcon, SettingsIcon, HistoryIcon, UploadCloudIcon, PenIcon, LogOutIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import { Tone as ToneEnum, Length as LengthEnum } from '../types.ts';
import type { UserPreferences } from '../types.ts';
import AuthPrompt from './AuthPrompt.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">
        {children}
    </label>
);

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400 disabled:opacity-50";

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const ResultMessage: React.FC<{ result: {success: boolean, message: string} | null, onClear: () => void }> = ({ result, onClear }) => {
    if (!result) return null;
    const icon = result.success ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />;
    const bgColor = result.success ? 'bg-green-500/20' : 'bg-red-500/20';
    const textColor = result.success ? 'text-green-300' : 'text-red-300';
    const borderColor = result.success ? 'border-green-500/30' : 'border-red-500/30';
    
    return (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm ${bgColor} ${textColor} border ${borderColor} animate-fade-in`}>
            <div className="flex-shrink-0">{icon}</div>
            <p className="flex-grow">{result.message}</p>
            <button type="button" onClick={onClear} className="text-slate-400 hover:text-white"><XCircleIcon className="h-5 w-5" /></button>
        </div>
    );
};


function ProfileView(): React.ReactNode {
    const { 
        currentUser, 
        history, 
        userPreferences, 
        handleLoadFromHistory, 
        handleSavePreferences, 
        handleUpdateProfilePicture,
        handleLogout,
    } = useAppContext();

    // Preferences state
    const [prefs, setPrefs] = useState<UserPreferences>({
        defaultTone: userPreferences?.defaultTone || ToneEnum.INFORMATIVE,
        defaultLength: userPreferences?.defaultLength || LengthEnum.MEDIUM
    });
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [prefsResult, setPrefsResult] = useState<{ success: boolean; message: string } | null>(null);

    // Profile picture state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pictureUpdateResult, setPictureUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (userPreferences) {
            setPrefs(userPreferences);
        }
    }, [userPreferences]);

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<UserIcon className="h-10 w-10 text-slate-500" />}
                title="Manage Your Profile"
                message="Log in to view your profile, update your picture, and set your content generation preferences."
            />
        );
    }

    const handlePrefsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPrefs(prev => ({ ...prev, [e.target.name]: e.target.value as any }));
    };
    
    const handleProfilePicClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPictureUpdateResult(null);

        if (!file.type.startsWith('image/')) {
            setPictureUpdateResult({ success: false, message: 'Please select an image file.' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setPictureUpdateResult({ success: false, message: 'Image size cannot exceed 2MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onloadstart = () => setIsUploading(true);
        reader.onerror = () => {
             setIsUploading(false);
             setPictureUpdateResult({ success: false, message: 'Failed to read file.' });
        };
        reader.onload = async (event) => {
            const imageBase64 = event.target?.result as string;
            if (imageBase64) {
                const result = await handleUpdateProfilePicture(imageBase64);
                setPictureUpdateResult(result);
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
        
        e.target.value = '';
    };

    const onSavePreferencesSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPrefs(true);
        setPrefsResult(null);
        const result = await handleSavePreferences(prefs);
        setIsSavingPrefs(false);
        setPrefsResult(result);
    };

    return (
        <div className="h-full max-w-6xl mx-auto overflow-y-auto custom-scrollbar animate-fade-in pr-4 -mr-4">
             <div className="flex items-center gap-4 mb-8">
                <UserIcon className="h-8 w-8 text-indigo-400" />
                <h2 className="text-2xl font-bold text-slate-100">Profile & Settings</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card & Activity */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 text-center shadow-lg">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                        />
                        <div className="relative w-24 h-24 mx-auto mb-4 group">
                             <button
                                type="button"
                                onClick={handleProfilePicClick}
                                disabled={isUploading}
                                className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white relative overflow-hidden disabled:cursor-not-allowed"
                                aria-label="Change profile picture"
                            >
                                {currentUser.profilePicture ? (
                                    <img src={currentUser.profilePicture} alt={currentUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="h-10 w-10" />
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {isUploading ? <Spinner /> : <PenIcon className="h-6 w-6 text-white" />}
                                </div>
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-white">{currentUser.username}</h3>
                        <p className="text-sm text-slate-400 mb-4">{currentUser.email}</p>
                        
                        <ResultMessage result={pictureUpdateResult} onClear={() => setPictureUpdateResult(null)} />

                        <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-around">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-400 text-transparent bg-clip-text">{history.length}</p>
                                <p className="text-xs text-slate-400">Articles</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            >
                                <LogOutIcon className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                     <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 shadow-lg">
                        <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2"><HistoryIcon className="h-5 w-5"/> Recent Activity</h4>
                        {history.slice(0, 4).length > 0 ? (
                            <ul className="space-y-3">
                                {history.slice(0, 4).map(item => (
                                    <li key={item.id} className="group flex items-center gap-3">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center"><PenIcon className="h-4 w-4 text-slate-400"/></div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-medium text-slate-200 truncate">{item.topic}</p>
                                            <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => handleLoadFromHistory(item)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500" title="Load this post"><UploadCloudIcon className="h-4 w-4"/></button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-2 space-y-8">
                     <section className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 shadow-lg">
                        <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2"><SettingsIcon className="h-5 w-5"/> User Preferences</h4>
                         <form onSubmit={onSavePreferencesSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="defaultTone">Default Tone of Voice</Label>
                                    <Select id="defaultTone" name="defaultTone" value={prefs.defaultTone} onChange={handlePrefsChange} disabled={isSavingPrefs}>
                                        {Object.values(ToneEnum).map((t) => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="defaultLength">Default Article Length</Label>
                                    <Select id="defaultLength" name="defaultLength" value={prefs.defaultLength} onChange={handlePrefsChange} disabled={isSavingPrefs}>
                                        {Object.values(LengthEnum).map((l) => <option key={l} value={l} className="bg-slate-800">{l}</option>)}
                                    </Select>
                                </div>
                            </div>
                            <button type="submit" disabled={isSavingPrefs} className="w-full sm:w-auto flex justify-center items-center py-2.5 px-6 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {isSavingPrefs ? <><Spinner/> Saving...</> : 'Save Preferences'}
                            </button>
                             <ResultMessage result={prefsResult} onClear={() => setPrefsResult(null)} />
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfileView;