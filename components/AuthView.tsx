import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import * as authService from '../services/authService.ts';
import { PenIcon, KeyIcon, UserIcon, XCircleIcon, MailIcon, CheckCircleIcon, ShieldCheckIcon } from './icons.tsx';
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
    const { handleAuthSuccess } = useAppContext();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [authStep, setAuthStep] = useState<'credentials' | 'verify'>('credentials');
    
    // Form fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    // Mock code for display
    const [mockCode, setMockCode] = useState('');

    useEffect(() => {
        setError(null);
        setInfoMessage(null);
        setMockCode('');
    }, [mode, authStep]);

    const handleCredentialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMockCode('');

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!password.trim()) {
            setError('Password cannot be empty.');
            return;
        }

        if (mode === 'signup') {
            if (!username.trim()) {
                setError('Username cannot be empty.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
             const passwordErrors = [];
            if (password.length < 8) passwordErrors.push("be at least 8 characters");
            if (!/[a-z]/.test(password)) passwordErrors.push("contain a lowercase letter");
            if (!/[A-Z]/.test(password)) passwordErrors.push("contain an uppercase letter");
            if (!/[0-9]/.test(password)) passwordErrors.push("contain a number");
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) passwordErrors.push("contain a special character");
            if (passwordErrors.length > 0) {
                setError(`Password must ${passwordErrors.join(', ')}.`);
                return;
            }
        }
        
        setIsLoading(true);
        try {
            const result = mode === 'login'
                ? await authService.login({ email, password })
                : await authService.signup({ username, email, password });
            
            if (result.success) {
                setInfoMessage(result.message);
                setMockCode(result.verificationCode); // For display
                setAuthStep('verify');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!verificationCode.trim() || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit verification code.');
            return;
        }
        
        setIsLoading(true);
        try {
            const result = await authService.verify(email, verificationCode);
            if (result.success && result.user) {
                handleAuthSuccess(result.user);
            }
        } catch (e) {
             setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }
    
    const renderCredentialForm = () => (
         <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6">
                <button type="button" onClick={() => setMode('login')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>Login</button>
                <button type="button" onClick={() => setMode('signup')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>Sign Up</button>
            </div>
            
            {mode === 'signup' && (
                <div className="animate-fade-in">
                    <Input id="username" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} icon={<UserIcon className="h-full w-full"/>} autoComplete="username" />
                </div>
            )}
             <div>
                 <Input id="email" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} icon={<MailIcon className="h-full w-full"/>} autoComplete={mode === 'login' ? 'username' : 'email'} />
            </div>
            <div>
                <PasswordInput id="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} icon={<KeyIcon className="h-full w-full"/>} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {mode === 'signup' && (
                 <div className="animate-fade-in">
                     <PasswordInput id="confirm-password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} icon={<KeyIcon className="h-full w-full"/>} autoComplete="new-password" />
                    <PasswordStrengthIndicator password={password} />
                </div>
            )}
            
            <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {isLoading ? <><Spinner />Authenticating...</> : 'Continue'}
                </button>
            </div>
        </form>
    );

    const renderVerificationForm = () => (
         <form onSubmit={handleVerificationSubmit} className="space-y-4 animate-fade-in">
            <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    icon={<ShieldCheckIcon className="h-full w-full" />}
                    maxLength={6}
                    autoFocus
                />
            </div>
            
            <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {isLoading ? <><Spinner />Verifying...</> : 'Verify & Continue'}
                </button>
                 <button type="button" onClick={() => setAuthStep('credentials')} className="w-full text-center mt-3 text-sm text-slate-400 hover:text-white transition-colors">Go Back</button>
            </div>
        </form>
    );
    
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex h-12 w-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg items-center justify-center mb-4">
                            <PenIcon className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-100">{authStep === 'credentials' ? 'Welcome' : 'Check Your Email'}</h1>
                        <p className="text-slate-400 mt-2">
                            {authStep === 'credentials' && (mode === 'login' ? 'Sign in to continue.' : 'Create an account to get started.')}
                            {authStep === 'verify' && `We've sent a verification code to ${email}.`}
                        </p>
                    </div>

                    {authStep === 'credentials' ? renderCredentialForm() : renderVerificationForm()}
                    
                    {(error || infoMessage || mockCode) && (
                        <div className="mt-4 space-y-2">
                            {error && <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">{error}</div>}
                            {infoMessage && <div className="p-3 rounded-lg text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30">{infoMessage}</div>}
                            {mockCode && (
                                <div className="p-3 rounded-lg text-sm bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                    <strong>For Demo Purposes:</strong> Your code is <strong className="font-mono text-lg">{mockCode}</strong>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default AuthView;
