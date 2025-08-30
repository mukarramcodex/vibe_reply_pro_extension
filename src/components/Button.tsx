import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variants = {
    primary: `
      bg-theme-accent text-white
      hover:bg-theme-accent-hover hover:scale-105 hover:shadow-lg
      focus:ring-theme-accent/20 active:scale-95
      shadow-md hover:shadow-xl
    `,
    secondary: `
      bg-theme-bg-secondary text-theme-text-primary border border-theme-border
      hover:bg-theme-bg-primary hover:scale-105 hover:shadow-md
      focus:ring-theme-accent/20 active:scale-95
    `,
    outline: `
      bg-transparent text-theme-text-primary border border-theme-border
      hover:bg-theme-bg-secondary hover:scale-105
      focus:ring-theme-accent/20 active:scale-95
    `
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      <span>{children}</span>
    </button>
  );
};