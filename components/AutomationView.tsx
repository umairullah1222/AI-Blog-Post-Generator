
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import type { AutomationJob, AutomationSettings } from '../types.ts';
import { Tone, Length } from '../types.ts';
import { AutomationIcon, TrashIcon, PenIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import AuthPrompt from './AuthPrompt.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">
        {children}
    </label>
);

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400 disabled:opacity-50";

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
     <textarea {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input type="checkbox" className={`h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 ${className}`} {...props} />
);

const statusStyles: { [key in AutomationJob['status']]: string } = {
    pending: 'bg-slate-600/50 text-slate-300',
    generating: 'bg-cyan-500/50 text-cyan-200 animate-pulse',
    publishing: 'bg-purple-500/50 text-purple-200 animate-pulse',
    completed: 'bg-green-500/50 text-green-200',
    error: 'bg-red-500/50 text-red-200',
};

function AutomationView(): React.ReactNode {
    const { automationQueue, isAutomating, handleStartAutomation, handleStopAutomation, wordPressCredentials, currentUser } = useAppContext();
    const [topics, setTopics] = useState('');
    const [settings, setSettings] = useState({
        tone: Tone.INFORMATIVE,
        length: Length.MEDIUM,
        autoPublish: false,
        schedulePosts: false,
    });
    const [publishTimes, setPublishTimes] = useState<string[]>(['09:00', '14:00', '18:00']);

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<AutomationIcon className="h-10 w-10 text-slate-500" />}
                title="Automate Your Content Creation"
                message="Log in to unlock content automation. Generate and publish articles on a schedule, hands-free."
            />
        );
    }
    
    const hasWpCredentials = !!(wordPressCredentials.url && wordPressCredentials.username && wordPressCredentials.password);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setSettings(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleStart = () => {
        const topicList = topics.split('\n').map(t => t.trim()).filter(t => t);
        if (topicList.length > 0) {
            const finalSettings: AutomationSettings = {
                ...settings,
                publishTimes: publishTimes.filter(Boolean).join(',')
            };
            handleStartAutomation(topicList, finalSettings);
        }
    };
    
    const handlePublishTimeChange = (indexToChange: number, value: string) => {
        const newTimes = [...publishTimes];
        newTimes[indexToChange] = value;
        setPublishTimes(newTimes);
    };

    const addPublishTime = () => {
        setPublishTimes(prev => [...prev, '12:00']);
    };

    const removePublishTime = (indexToRemove: number) => {
        if (publishTimes.length <= 1) return;
        setPublishTimes(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-5 h-full flex flex-col">
                 <div className="bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 h-full flex flex-col gap-y-6 shadow-lg overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3">
                        <AutomationIcon className="h-6 w-6 text-indigo-400" />
                        <h2 className="text-xl font-bold text-slate-100">Content Automation</h2>
                    </div>
                     <div className="space-y-4 flex-grow flex flex-col">
                        <div>
                            <Label htmlFor="topics">Blog Post Topics (one per line)</Label>
                            <TextArea id="topics" value={topics} onChange={e => setTopics(e.target.value)} placeholder="The Future of AI&#10;Sustainable Energy Sources&#10;Beginner's Guide to React" rows={5} disabled={isAutomating} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200 pt-2">Bulk Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor="tone">Tone of Voice</Label>
                                <Select id="tone" name="tone" value={settings.tone} onChange={handleSettingsChange} disabled={isAutomating}>
                                    {Object.values(Tone).map((t) => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="length">Article Length</Label>
                                <Select id="length" name="length" value={settings.length} onChange={handleSettingsChange} disabled={isAutomating}>
                                    {Object.values(Length).map((l) => <option key={l} value={l} className="bg-slate-800">{l}</option>)}
                                </Select>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg bg-slate-900/40 border border-slate-700 space-y-4 ${!hasWpCredentials && 'opacity-50'}`}>
                            <div className="flex items-center gap-3">
                                <Checkbox id="autoPublish" name="autoPublish" checked={settings.autoPublish} onChange={handleSettingsChange} disabled={isAutomating || !hasWpCredentials} />
                                <Label htmlFor="autoPublish">Auto-Publish to WordPress</Label>
                            </div>
                             {!hasWpCredentials && <p className="text-xs text-amber-400">Set WordPress credentials in Settings to enable publishing.</p>}
                            
                             {settings.autoPublish && hasWpCredentials && (
                                <div className="pl-7 space-y-4">
                                     <div className="flex items-center gap-3">
                                        <Checkbox id="schedulePosts" name="schedulePosts" checked={settings.schedulePosts} onChange={handleSettingsChange} disabled={isAutomating} />
                                        <Label htmlFor="schedulePosts">Schedule Posts</Label>
                                    </div>
                                    {settings.schedulePosts && (
                                        <div className="pl-7 space-y-2 animate-fade-in">
                                            <div className="block text-sm font-medium text-slate-300 mb-2">Publish Times</div>
                                            <div className="space-y-2">
                                                {publishTimes.map((time, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input 
                                                            type="time" 
                                                            value={time}
                                                            onChange={e => handlePublishTimeChange(index, e.target.value)}
                                                            className="flex-grow"
                                                            disabled={isAutomating}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removePublishTime(index)}
                                                            disabled={isAutomating || publishTimes.length <= 1}
                                                            className="p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            aria-label="Remove time"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addPublishTime}
                                                disabled={isAutomating}
                                                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors pt-1 disabled:opacity-50"
                                            >
                                                + Add Time
                                            </button>
                                            <p className="text-xs text-slate-400 !mt-3">Posts will be scheduled sequentially at these times, rolling over to the next day.</p>
                                        </div>
                                    )}
                                    {!settings.schedulePosts && <p className="text-xs text-slate-400 pl-7">If not scheduled, all posts will be published immediately one after another.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={isAutomating ? handleStopAutomation : handleStart}
                            disabled={!topics.trim() && !isAutomating}
                            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ${isAutomating ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-90' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isAutomating ? <><Spinner /> Stop Automation</> : 'Start Automation'}
                        </button>
                    </div>
                 </div>
            </div>
             <div className="lg:col-span-7 h-full flex flex-col">
                <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 h-full flex flex-col shadow-lg">
                    <header className="p-4 border-b border-slate-700/50 flex-shrink-0">
                        <h2 className="text-lg font-bold text-slate-100">Automation Progress</h2>
                    </header>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                        {automationQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <PenIcon className="h-10 w-10 text-slate-500 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-300">Queue is empty</h3>
                                <p className="text-sm mt-1">Add topics and click "Start Automation".</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {automationQueue.map(job => (
                                    <li key={job.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-200 truncate pr-4" title={job.topic}>{job.topic}</p>
                                            <span className={`capitalize text-xs font-bold px-2 py-1 rounded-full ${statusStyles[job.status]}`}>{job.status}</span>
                                        </div>
                                        {job.resultMessage && <p className="text-xs text-slate-400 mt-2" dangerouslySetInnerHTML={{__html: job.resultMessage}}></p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AutomationView;