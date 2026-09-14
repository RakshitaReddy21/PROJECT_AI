import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Activity,
  BarChart3,
  TrendingUp,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavEntry {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavEntry[];
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      title: 'HOME',
      items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'LEARNING',
      items: [
        { label: 'Spaces', to: '/spaces', icon: FolderKanban },
        { label: 'Projects', to: '/projects', icon: BookOpen },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Growth', to: '/growth', icon: TrendingUp },
        { label: 'Analytics', to: '/analytics', icon: BarChart3 },
        { label: 'Activity', to: '/activity', icon: Activity },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`bg-white border-r border-[#F1E8E3] flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-20 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-15 px-3.5 flex items-center justify-between border-b border-[#F1E8E3]">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1.5 bg-[#FFEBE0] text-[#FF6B35] border border-[#FFC8B0]/80 rounded-xl shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display font-bold text-sm text-[#1F1917] tracking-tight whitespace-nowrap block">
                AI Study Companion
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-[#FFF8F4] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-faint mb-2">
                {section.title}
              </p>
            ) : (
              <div className="w-full border-t border-[#F4E3D8] my-2" />
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.to}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `group flex items-center text-xs font-medium rounded-xl transition-all duration-200 ${
                          collapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5'
                        } ${
                          isActive
                            ? 'bg-[#FFEBE0] text-[#1F1917] border border-[#FFC8B0] shadow-sm font-semibold'
                            : 'text-[#574E4A] hover:text-[#1F1917] hover:bg-[#FFF0E5]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                              collapsed ? '' : 'mr-3'
                            } ${isActive ? 'text-[#FF6B35]' : 'text-[#8C827A] group-hover:text-[#1F1917]'}`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {isActive && !collapsed && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Floating Tooltip when collapsed */}
                    {collapsed && hoveredItem === item.label && (
                      <div className="fixed left-20 ml-1 z-50 px-3 py-1.5 bg-[#1F1917] text-white text-xs font-medium rounded-lg shadow-float whitespace-nowrap animate-fade-in pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>



      {/* Bottom Section: Settings & Profile */}
      <div className="p-2.5 border-t border-[#F4E3D8] space-y-1">
        {/* Settings */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredItem('Settings')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center text-xs font-medium rounded-xl transition-all ${
                collapsed ? 'justify-center p-2.5' : 'px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-[#FFEBE0] text-[#1F1917] border border-[#FFC8B0] shadow-sm font-semibold'
                  : 'text-[#574E4A] hover:text-[#1F1917] hover:bg-[#FFF0E5]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:rotate-45 ${
                    collapsed ? '' : 'mr-3'
                  } ${isActive ? 'text-[#FF6B35]' : 'text-[#8C827A]'}`}
                />
                {!collapsed && <span className="truncate">Settings</span>}
              </>
            )}
          </NavLink>
          {collapsed && hoveredItem === 'Settings' && (
            <div className="fixed left-20 ml-1 z-50 px-3 py-1.5 bg-[#1F1917] text-white text-xs font-medium rounded-lg shadow-float whitespace-nowrap pointer-events-none">
              Settings
            </div>
          )}
        </div>

        {/* User Profile Card / Sign Out */}
        {!collapsed ? (
          <div className="pt-2 border-t border-[#F4E3D8] flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FFEBE0] border border-[#FFC8B0] text-[#FF6B35] font-semibold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden shadow-sm">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name.substring(0, 2).toUpperCase() : 'AU'
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-ink truncate leading-tight">{user?.name || 'Learner'}</p>
                <p className="text-[10px] text-ink-faint truncate">{user?.email || 'authenticated@session'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-ink-faint hover:text-rust p-1.5 rounded-lg hover:bg-rust-soft/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('Sign Out')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-ink-faint hover:text-rust hover:bg-rust-soft/50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {collapsed && hoveredItem === 'Sign Out' && (
              <div className="fixed left-20 ml-1 z-50 px-3 py-1.5 bg-[#292524] text-white text-xs font-medium rounded-lg shadow-float whitespace-nowrap pointer-events-none">
                Sign Out ({user?.name || 'User'})
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
