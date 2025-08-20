
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { WordPressIcon, SettingsIcon, KeyIcon, XCircleIcon } from './icons.tsx';
import { testWordPressConnection } from '../services/wordpressService.ts';
import Spinner from './Spinner.tsx';
import PasswordInput from './PasswordInput.tsx';
import AuthPrompt from './AuthPrompt.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">
        {children}
    </label>
);

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`${inputBaseStyles} ${props.className || ''}`} />
);

function SettingsView(): React.ReactNode {
    const { wordPressCredentials, setWordPressCredentials, currentUser } = useAppContext();
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    if (!currentUser) {
        return (
            <AuthPrompt
                icon={<SettingsIcon className="h-10 w-10 text-slate-500" />}
                title="Configure Your Settings"
                message="Log in to connect your WordPress site and manage other application settings."
            />
        );
    }

    const handleCredsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWordPressCredentials({
            ...wordPressCredentials,
            [e.target.name]: e.target.value,
        });
        if (testResult) {
            setTestResult(null);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            await testWordPressConnection(wordPressCredentials);
            setTestResult({ success: true, message: "Connection successful! You're ready to publish." });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setTestResult({ success: false, message: errorMessage });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-slate-800/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-slate-700/50 h-full max-w-3xl mx-auto shadow-lg overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
                <SettingsIcon className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-100">Settings</h2>
            </div>
            
            <div className="space-y-8">
                <section>
                    <div className="flex items-center gap-3 mb-4">
                         <WordPressIcon className="h-6 w-6 text-slate-300" />
                         <h3 className="text-lg font-semibold text-slate-200">WordPress Integration</h3>
                    </div>
                    <div className="space-y-5 border-l-2 border-slate-700 pl-6 ml-3">
                         <div>
                            <Label htmlFor="wp-url">WordPress Site URL</Label>
                            <Input id="wp-url" name="url" type="url" placeholder="https://example.com" value={wordPressCredentials.url} onChange={handleCredsChange} disabled={isTesting} />
                        </div>
                         <div>
                            <Label htmlFor="wp-user">Username</Label>
                            <Input id="wp-user" name="username" type="text" placeholder="your_wp_username" value={wordPressCredentials.username} onChange={handleCredsChange} disabled={isTesting} />
                        </div>
                         <div>
                            <Label htmlFor="wp-pass">Application Password</Label>
                            <PasswordInput
                                id="wp-pass"
                                name="password"
                                placeholder="xxxx xxxx xxxx xxxx"
                                value={wordPressCredentials.password}
                                onChange={handleCredsChange}
                                icon={<KeyIcon className="h-full w-full" />}
                                disabled={isTesting}
                            />
                            <p className="mt-2 text-xs text-slate-400">
                               You must create an Application Password in your WordPress admin panel under Users &gt; Profile.
                            </p>
                        </div>
                        <div className="pt-2">
                             <button 
                                onClick={handleTestConnection}
                                disabled={isTesting || !wordPressCredentials.url || !wordPressCredentials.username || !wordPressCredentials.password}
                                className="w-full sm:w-auto flex justify-center items-center py-2 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                {isTesting ? <><Spinner /> Testing...</> : 'Test Connection'}
                            </button>
                             {testResult && (
                                <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm ${testResult.success ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'} border`}>
                                    <p className="flex-grow">{testResult.message}</p>
                                    <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                                        <XCircleIcon className="h-5 w-5" />
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                </section>

                <div className="border-t border-slate-700/50 pt-6">
                    <div className="flex items-center gap-3 mb-2">
                         <KeyIcon className="h-6 w-6 text-slate-300" />
                         <h3 className="text-lg font-semibold text-slate-200">API Key Configuration</h3>
                    </div>
                     <p className="text-sm text-slate-400">
                        Your Google Gemini API key is now managed securely on the server via an environment variable (`API_KEY`). You no longer need to enter it here. For this to work, you must deploy this application to a hosting provider that supports backend functions (like Vercel or Netlify) and set the `API_KEY` in their dashboard.
                    </p>
                 </div>
            </div>
        </div>
    );
}

export default SettingsView;