import React from 'react';

interface SettingsCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-theme-bg-secondary rounded-xl border border-theme-border p-6 shadow-custom hover:shadow-custom-lg transition-shadow duration-300">
      <h2 className="text-xl font-semibold mb-6 flex items-center text-theme-text-primary">
        {icon && <span className="text-theme-accent mr-3">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
};