import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  FolderKanban,
  Activity,
  BarChart2,
  Cpu,
  CheckCircle2,
  HeartPulse,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AdminShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const adminNav = [
    { label: 'Platform Overview', to: '/admin', icon: ShieldAlert, end: true },
    { label: 'User Management', to: '/admin/users', icon: Users },
    { label: 'Spaces Governance', to: '/admin/spaces', icon: FolderKanban },
    { label: 'Projects Oversight', to: '/admin/projects', icon: FolderKanban },
  ];

  return (
    <div className="flex min-h-screen bg-[#FFF8F4] text-[#1F1917]">
      {/* Warm Premium Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-[#F4E3D8] flex flex-col h-screen sticky top-0">
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#F4E3D8]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#FFEBE0] text-[#FF6B35] border border-[#FFC8B0] rounded-md">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="font-sans font-semibold text-sm text-[#1F1917] tracking-tight">
              AI Study Companion Admin
            </span>
          </div>
          <Link
            to="/dashboard"
            className="p-1 rounded text-ink-faint hover:text-ink hover:bg-[#FFF8F4] transition-colors"
            title="Return to Learner App"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-2">
            Governance & Telemetry
          </p>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#FFEBE0] text-[#1F1917] border border-[#FFC8B0] font-semibold'
                        : 'text-[#574E4A] hover:text-[#1F1917] hover:bg-[#FFF0E5]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-2.5 text-[#FF6B35]" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#F4E3D8] flex items-center justify-between text-xs text-ink-faint">
          <div className="truncate">
            <p className="text-ink font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-ink-faint font-mono">System Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#574E4A] hover:text-[#C5221F] hover:bg-[#FEE2E2] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-[#F4E3D8] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <h1 className="text-sm font-semibold text-[#1F1917] font-mono">
            Platform Operations & Intelligence
          </h1>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-[11px] font-mono bg-[#FFEBE0] text-[#E85A2A] border border-[#FFC8B0] rounded-full flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse"></span>
              Live Telemetry
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-mono font-semibold bg-[#FFEBE0] hover:bg-[#FFC8B0] text-[#E85A2A] border border-[#FFC8B0] rounded-xl flex items-center gap-1.5 transition-colors"
              title="Sign out of System Admin account"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
