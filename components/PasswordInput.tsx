
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.tsx';

const inputBaseStyles = "w-full bg-slate-900/70 border border-slate-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder:text-slate-400 disabled:opacity-50";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ icon, className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative flex items-center">
            {icon && <div className="absolute left-3 h-5 w-5 text-slate-400 pointer-events-none z-10">{icon}</div>}
            <input
                {...props}
                type={showPassword ? 'text' : 'password'}
                className={`${inputBaseStyles} ${icon ? 'pl-10' : ''} ${className || ''} pr-10`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 inset-y-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
            </button>
        </div>
    );
};

export default PasswordInput;