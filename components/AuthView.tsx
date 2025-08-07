
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import type { User } from '../types.ts';
import { PenIcon, KeyIcon, UserIcon, XCircleIcon, MailIcon, CheckCircleIcon, AutomationIcon } from './icons.tsx';
import Spinner from './Spinner.tsx';
import PasswordInput from './PasswordInput.tsx';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
        {children}
    </label>
);

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400";
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {icon?: React.ReactNode}> = ({ icon, ...props }) => (
    <div className="relative flex items-center">
        {icon && <div className="absolute left-3 h-5 w-5 text-slate-400 pointer-events-none">{icon}</div>}
        <input {...props} className={`${inputBaseStyles} ${props.className || ''} ${icon ? 'pl-10' : ''}`} />
    </div>
);

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const checks = [
        { regex: /.{8,}/, label: "At least 8 characters" },
        { regex: /[a-z]/, label: "A lowercase letter" },
        { regex: /[A-Z]/, label: "An uppercase letter" },
        { regex: /[0-9]/, label: "A number" },
        { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/, label: "A special character" },
    ];

    return (
        <div className="text-xs text-slate-400 space-y-1 mt-2 pl-1 animate-fade-in">
            {checks.map(check => {
                const isMet = check.regex.test(password);
                return (
                    <div key={check.label} className={`flex items-center transition-colors ${isMet ? 'text-green-400' : 'text-slate-500'}`}>
                        {isMet ? <CheckCircleIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" /> : <XCircleIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                        <span>{check.label}</span>
                    </div>
                );
            })}
        </div>
    );
};


function AuthView(): React.ReactNode {
    const { handleLogin, handleSignup, authError, authSuccess, clearAuthStatus } = useAppContext();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerification = () => {
        if (isVerified || isVerifying) return;
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
            setFormError(null);
        }, 1200);
    };

    useEffect(() => {
        setFormError(null);
        clearAuthStatus();
        setIsVerified(false);
        setIsVerifying(false);
    }, [mode, clearAuthStatus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearAuthStatus();
        
        if (!isVerified) {
            setFormError('Please complete the security check.');
            return;
        }

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setFormError('Please enter a valid email address.');
            return;
        }

        if (!password.trim()) {
            setFormError('Password cannot be empty.');
            return;
        }

        if (mode === 'signup') {
            if (!username.trim()) {
                setFormError('Username cannot be empty.');
                return;
            }

            const passwordErrors = [];
            if (password.length < 8) passwordErrors.push("be at least 8 characters");
            if (!/[a-z]/.test(password)) passwordErrors.push("contain a lowercase letter");
            if (!/[A-Z]/.test(password)) passwordErrors.push("contain an uppercase letter");
            if (!/[0-9]/.test(password)) passwordErrors.push("contain a number");
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) passwordErrors.push("contain a special character");
        
            if (passwordErrors.length > 0) {
                setFormError(`Password must ${passwordErrors.join(', ')}.`);
                return;
            }

            if (password !== confirmPassword) {
                setFormError('Passwords do not match.');
                return;
            }
        }
        
        setIsLoading(true);
        setTimeout(() => {
            if (mode === 'login') {
                handleLogin({ email, password });
            } else {
                handleSignup({ username, password, email });
            }
            setIsLoading(false);
            setIsVerified(false);
            setIsVerifying(false);
        }, 500);

    };

    const StatusDisplay = () => {
        if (!authError && !authSuccess) return null;

        const isError = !!authError;
        const message = authError || authSuccess;
        const bgColor = isError ? 'bg-red-500/20' : 'bg-green-500/20';
        const textColor = isError ? 'text-red-300' : 'text-green-300';
        
        return (
            <div className={`mt-4 p-3 rounded-lg flex items-center justify-between text-sm ${bgColor} ${textColor} border ${isError ? 'border-red-500/30' : 'border-green-500/30'}`}>
                <p className="flex-grow" dangerouslySetInnerHTML={{ __html: message || '' }}></p>
                <button onClick={clearAuthStatus} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                    <XCircleIcon className="h-5 w-5" />
                </button>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-lg">
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex h-12 w-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg items-center justify-center mb-4">
                            <PenIcon className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100">AI Content Generator</h1>
                        <p className="text-slate-400 mt-2">
                            {mode === 'login' ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}
                        </p>
                    </div>

                    <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6">
                        <button 
                            onClick={() => setMode('login')}
                            className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => setMode('signup')}
                            className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="animate-fade-in">
                                <Input 
                                    id="username" 
                                    type="text" 
                                    placeholder="Username" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)}
                                    icon={<UserIcon className="h-full w-full"/>}
                                    autoComplete="username"
                                />
                            </div>
                        )}
                         <div>
                             <Input 
                                id="email" 
                                type="email" 
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                icon={<MailIcon className="h-full w-full"/>}
                                autoComplete={mode === 'login' ? 'username' : 'email'}
                            />
                        </div>
                        <div>
                            <PasswordInput 
                                id="password" 
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                icon={<KeyIcon className="h-full w-full"/>}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>
                        {mode === 'signup' && (
                             <div className="animate-fade-in">
                                 <PasswordInput
                                    id="confirm-password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    icon={<KeyIcon className="h-full w-full"/>}
                                    autoComplete="new-password"
                                />
                                <PasswordStrengthIndicator password={password} />
                            </div>
                        )}

                        <div className="bg-slate-800/60 p-3 rounded-lg flex items-center gap-4 border border-slate-700">
                            <button
                                type="button"
                                onClick={handleVerification}
                                disabled={isVerifying || isVerified}
                                className={`h-8 w-8 flex-shrink-0 flex items-center justify-center border rounded-md transition-all duration-200 disabled:cursor-not-allowed ${
                                    isVerified ? 'bg-green-500/20 border-green-500/50' : 'bg-slate-700 border-slate-600'
                                }`}
                                aria-label="Human verification checkbox"
                            >
                                {isVerifying ? (
                                    <Spinner className="animate-spin h-5 w-5 text-white" />
                                ) : isVerified ? (
                                    <CheckCircleIcon className="h-6 w-6 text-green-400 animate-fade-in" />
                                ) : (
                                    <div className="h-4 w-4 bg-transparent"></div>
                                )}
                            </button>
                            <div className="flex-grow flex items-center justify-between">
                                <span className="text-slate-300 font-medium">I'm not a robot</span>
                                <AutomationIcon className="h-6 w-6 text-slate-500" />
                            </div>
                        </div>
                        
                        {formError && <p className="text-sm text-red-400 mt-2">{formError}</p>}
                        <StatusDisplay />

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isLoading ? <><Spinner />Authenticating...</> : (mode === 'login' ? 'Login' : 'Create Account')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AuthView;