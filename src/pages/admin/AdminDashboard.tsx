import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsersApi } from '../../api/admin';
import { fetchSpacesApi } from '../../api/spaces';
import { fetchProjectsApi } from '../../api/projects';
import { User, Space, Project } from '../../types';
import { PageTransition, StaggerContainer, StaggerItem, AnimatedNumber } from '../../components/motion';
import { ShieldAlert, Users, FolderKanban, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [uData, sData, pData] = await Promise.all([
          fetchUsersApi(),
          fetchSpacesApi(),
          fetchProjectsApi(),
        ]);
        setUsers(uData || []);
        setSpaces(sData || []);
        setProjects(pData || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <PageTransition className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* OPERATIONS CENTER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1E8E3]">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-[#E9825B] font-semibold uppercase tracking-wider bg-[#FFF0E8] px-2.5 py-0.5 rounded-full border border-[#F8C9B0]">
              ADMINISTRATION PORTAL
            </span>
            <span className="text-xs font-mono text-[#78716C]">
              Platform Governance
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#292524]">
            Platform Overview
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Manage user accounts, subject spaces, and project oversight.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#E6F4EA] border border-[#CEEAD6] rounded-full text-[#137333] font-mono text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
            <span>Platform Active</span>
          </div>
        </div>
      </div>

      {/* OPERATIONS COMPACT KPI CARDS */}
      <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StaggerItem>
          <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-mono text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#E9825B]" /> Registered Users
            </span>
            <p className="font-display text-3xl font-bold text-[#292524]">
              <AnimatedNumber value={users.length} />
            </p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-mono text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5 text-[#E9825B]" /> Subject Spaces
            </span>
            <p className="font-display text-3xl font-bold text-[#292524]">
              <AnimatedNumber value={spaces.length} />
            </p>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl space-y-1 shadow-sm">
            <span className="text-[10px] font-mono text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" /> Active Projects
            </span>
            <p className="font-display text-3xl font-bold text-[#137333]">
              <AnimatedNumber value={projects.length} />
            </p>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* CORE MANAGEMENT NAVIGATION CARDS */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#78716C] font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#E9825B]" /> Platform Governance Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* User Management */}
          <Link to="/admin/users">
            <Card className="p-6 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm hover:border-[#F8C9B0] transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#FFF0E8] text-[#E9825B] border border-[#F8C9B0] rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-[#E9825B] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Users ({users.length}) <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#292524]">User Management</h3>
                <p className="text-xs text-[#78716C] mt-1">
                  View and inspect registered user accounts, system roles, and active learner credentials.
                </p>
              </div>
            </Card>
          </Link>

          {/* Spaces Governance */}
          <Link to="/admin/spaces">
            <Card className="p-6 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm hover:border-[#F8C9B0] transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#FFF0E8] text-[#E9825B] border border-[#F8C9B0] rounded-xl">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-[#E9825B] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Manage Spaces ({spaces.length}) <ArrowRight className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#292524]">Spaces Governance</h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Monitor subject domain spaces, child projects, and learner enrollments.
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};
