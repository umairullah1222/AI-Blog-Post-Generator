import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-medium shadow ${className}`}
    >
      {children}
    </button>
  );
}
