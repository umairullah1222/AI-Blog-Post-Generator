
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { Tone, Length } from '../types.ts';
import Spinner from './Spinner.tsx';
import { PenIcon, LinkIcon, ResearchIcon } from './icons.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">
        {children}
    </label>
);

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400";

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
     <textarea {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input type="checkbox" className={`h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 ${className}`} {...props} />
);

function Controls(): React.ReactNode {
    const { 
        handleGenerate, 
        isLoading, 
        linkingStatus, 
        topic, 
        setTopic, 
        userPreferences 
    } = useAppContext();
    
    const [tone, setTone] = useState<Tone>(userPreferences?.defaultTone || Tone.INFORMATIVE);
    const [length, setLength] = useState<Length>(userPreferences?.defaultLength || Length.MEDIUM);
    const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
    const [topicError, setTopicError] = useState<string | null>(null);

    useEffect(() => {
        if (userPreferences?.defaultTone) setTone(userPreferences.defaultTone);
    }, [userPreferences?.defaultTone]);

    useEffect(() => {
        if (userPreferences?.defaultLength) setLength(userPreferences.defaultLength);
    }, [userPreferences?.defaultLength]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setTopicError('Topic cannot be empty.');
            return;
        }
        setTopicError(null);
        handleGenerate({ topic, tone, length, useGoogleSearch });
    };

    return (
        <div className="bg-slate-800/30 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 h-full flex flex-col gap-y-6 shadow-lg overflow-y-auto">
            <div className="flex items-center gap-3">
                <PenIcon className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-100">Content Generator</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
                <div className="space-y-6 flex-grow">
                    <div>
                        <Label htmlFor="topic">Blog Post Topic</Label>
                        <TextArea
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., The impact of AI on modern web development"
                            rows={3}
                            disabled={isLoading}
                        />
                        {topicError && <p className="mt-2 text-sm text-red-400">{topicError}</p>}
                    </div>

                    <div>
                        <Label htmlFor="tone">Tone of Voice</Label>
                        <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)} disabled={isLoading}>
                            {Object.values(Tone).map((t) => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="length">Article Length</Label>
                        <Select id="length" value={length} onChange={(e) => setLength(e.target.value as Length)} disabled={isLoading}>
                            {Object.values(Length).map((l) => <option key={l} value={l} className="bg-slate-800">{l}</option>)}
                        </Select>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700">
                        <label htmlFor="useGoogleSearch" className="flex items-center gap-3 cursor-pointer">
                            <Checkbox id="useGoogleSearch" name="useGoogleSearch" checked={useGoogleSearch} onChange={(e) => setUseGoogleSearch(e.target.checked)} disabled={isLoading || !!linkingStatus} />
                             <div className="flex items-center gap-2">
                                <ResearchIcon className="h-5 w-5 text-cyan-400" />
                                <span className="font-medium text-slate-200">Enable Google Search</span>
                            </div>
                        </label>
                         <p className="text-xs text-slate-400 mt-2 pl-7">
                            For up-to-date, factual content. May take longer to generate and will disable internal linking.
                        </p>
                    </div>

                </div>
                
                <div className="space-y-3">
                     {linkingStatus && (
                        <div className="flex items-center gap-2 text-sm text-slate-400 p-2 bg-slate-900/50 rounded-md animate-fade-in">
                            <LinkIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{linkingStatus}</span>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isLoading ? <><Spinner /> Generating...</> : 'Generate Post'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Controls;