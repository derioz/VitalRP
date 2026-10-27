import React, { ReactNode } from 'react';

interface AdminHeroProps {
  title: string | ReactNode;
  subtitle?: string;
  rightElement?: ReactNode;
  /** Kept so existing callers still compile; no longer rendered. */
  badgeText?: string;
}

export const AdminHero: React.FC<AdminHeroProps> = ({ title, subtitle, rightElement }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-6 mb-8 border-b border-white/10">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-300 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {rightElement && <div className="flex-shrink-0">{rightElement}</div>}
    </div>
  );
};
