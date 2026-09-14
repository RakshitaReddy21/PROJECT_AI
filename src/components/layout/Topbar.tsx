import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Breadcrumbs } from './Breadcrumbs';
import { Search, LogOut, User as UserIcon, ShieldAlert, Command, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';

export interface TopbarProps {
  onOpenCommandPalette?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenCommandPalette }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-15 bg-white/95 backdrop-blur-xl border-b border-[#F4E3D8] px-6 flex items-center justify-between sticky top-0 z-30 transition-all shadow-sm">
      <div className="flex items-center space-x-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center space-x-3.5">
        <button
          onClick={onOpenCommandPalette}
          className="relative hidden sm:flex items-center gap-2 pl-3.5 pr-2 py-1.5 text-xs bg-white hover:bg-[#FFF8F4] border border-[#F4E3D8] hover:border-[#FFC8B0] rounded-full text-ink-faint hover:text-ink transition-all duration-200 hover:shadow-card cursor-pointer w-56 md:w-64 group"
        >
          <Search className="w-3.5 h-3.5 text-ink-faint group-hover:text-[#FF6B35] transition-colors flex-shrink-0" />
          <span className="flex-1 text-left text-xs truncate">Search spaces, concepts, actions...</span>
          <span className="flex items-center gap-0.5 text-[10px] font-mono font-semibold bg-[#FFEBE0] border border-[#FFC8B0]/80 px-2 py-0.5 rounded-md text-[#E85A2A] shadow-sm">
            <Command className="w-2.5 h-2.5" /> K
          </span>
        </button>

        {/* Admin Switcher indicator if user is admin */}
        {user?.role === 'admin' && (
          <Link to="/admin">
            <Badge variant="indigo" size="sm" className="cursor-pointer hover:bg-[#FFC8B0]/40 shadow-sm">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Admin Portal
            </Badge>
          </Link>
        )}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none group p-0.5 rounded-full hover:ring-2 hover:ring-[#FFC8B0] transition-all"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFEBE0] border border-[#FFC8B0] text-[#FF6B35] font-semibold flex items-center justify-center text-xs overflow-hidden shadow-sm flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name ? user.name.substring(0, 2).toUpperCase() : 'AU'
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2.5 w-52 bg-white border border-[#F4E3D8] rounded-2xl shadow-float py-2 z-50 animate-slide-up"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2.5 border-b border-[#F4E3D8]">
                <p className="text-xs font-semibold text-ink truncate">{user?.name || 'Learner'}</p>
                <p className="text-[10px] text-ink-faint truncate">{user?.email || 'session@authenticated'}</p>
              </div>
              <Link
                to="/settings"
                className="flex items-center px-4 py-2.5 text-xs text-ink-soft hover:text-ink hover:bg-[#FFEBE0] transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 mr-2.5 text-[#FF6B35]" />
                Settings & Preferences
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center px-4 py-2.5 text-xs text-[#E85A2A] font-semibold hover:bg-[#FFEBE0] transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-2.5" />
                  Admin Governance
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-xs text-rust hover:bg-rust-soft/50 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5 mr-2.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
