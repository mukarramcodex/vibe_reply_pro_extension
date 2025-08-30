import React from 'react';
import { CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface StatusIndicatorProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  className?: string;
  onClose?: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  message,
  className = '',
  onClose
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    loading: 'bg-theme-accent/10 text-theme-accent border-theme-accent/30'
  };

  const Icon = icons[type];

  React.useEffect(() => {
    if (onClose && type !== 'loading') {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose, type]);

  return (
    <div className={`
      flex items-center space-x-3 p-4 rounded-lg border
      animate-fade-in transition-all duration-300
      ${colors[type]} ${className}
    `}>
      <Icon 
        className={`w-5 h-5 flex-shrink-0 ${
          type === 'loading' ? 'animate-spin' : ''
        }`} 
      />
      <span className="text-sm font-medium flex-1">{message}</span>
      {onClose && type !== 'loading' && (
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};