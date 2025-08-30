import React from 'react';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="font-medium text-theme-text-primary">{label}</label>
        {description && (
          <p className="text-sm text-theme-text-secondary mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="
          w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 
          peer-focus:ring-theme-accent peer-focus:ring-opacity-20 
          dark:peer-focus:ring-theme-accent rounded-full peer 
          dark:bg-gray-700 peer-checked:after:translate-x-full 
          peer-checked:after:border-white after:content-[''] after:absolute 
          after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
          after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
          dark:border-gray-600 peer-checked:bg-theme-accent
        "></div>
      </label>
    </div>
  );
};