import React from 'react';
import { NavLink } from 'react-router-dom';

export interface TabItem {
  key: string;
  label: string;
  to?: string;
  badge?: number | string;
}

export interface TabNavProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="flex space-x-1 border-b border-line overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        const content = (
          <span className="flex items-center gap-2">
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                isActive ? 'bg-signal-soft text-signal-strong' : 'bg-paper-sunken text-ink-faint'
              }`}>
                {tab.badge}
              </span>
            )}
          </span>
        );

        if (tab.to) {
          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 rounded-t-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#FF6B35] bg-[#FFEBE0] text-[#1F1917] font-semibold shadow-sm'
                    : 'border-transparent text-[#574E4A] hover:text-[#1F1917] hover:bg-[#FFF0E5]'
                }`
              }
            >
              {content}
            </NavLink>
          );
        }

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange?.(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 rounded-t-lg whitespace-nowrap transition-all ${
              isActive
                ? 'border-[#FF6B35] bg-[#FFEBE0] text-[#1F1917] font-semibold shadow-sm'
                : 'border-transparent text-[#574E4A] hover:text-[#1F1917] hover:bg-[#FFF0E5]'
            }`}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
};
