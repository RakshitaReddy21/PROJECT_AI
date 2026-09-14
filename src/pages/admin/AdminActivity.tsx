import React, { useEffect, useState } from 'react';
import { fetchActivitiesApi, ActivityFilterParams } from '../../api/analytics';
import { appStorage } from '../../services/storage/localStorageStore';
import { ActivityItem, User, Space, Project } from '../../types';
import { Filter, Calendar, User as UserIcon, BookOpen, FolderKanban, Activity as ActivityIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const AdminActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    // Load metadata options
    setUsers(appStorage.get('users') || []);
    setSpaces(appStorage.get('spaces') || []);
    setProjects(appStorage.get('projects') || []);
  }, []);

  useEffect(() => {
    async function loadFilteredActivities() {
      setLoading(true);
      try {
        const filterParams: ActivityFilterParams = {
          userId: selectedUser !== 'all' ? selectedUser : undefined,
          spaceId: selectedSpace !== 'all' ? selectedSpace : undefined,
          projectId: selectedProject !== 'all' ? selectedProject : undefined,
          activityType: selectedType !== 'all' ? selectedType : undefined,
          period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
        };

        let data = await fetchActivitiesApi(filterParams);

        // Apply in-memory fallback filters if running in mock mode
        if (selectedUser !== 'all') {
          data = data.filter((a) => a.userId === selectedUser);
        }
        if (selectedProject !== 'all') {
          data = data.filter((a) => a.projectId === selectedProject);
        }
        if (selectedType !== 'all') {
          data = data.filter((a) => a.type === selectedType);
        }
        if (selectedPeriod !== 'all') {
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;
          let limitMs = 30 * dayMs;
          if (selectedPeriod === '24h') limitMs = dayMs;
          if (selectedPeriod === '7d') limitMs = 7 * dayMs;
          if (selectedPeriod === '30d') limitMs = 30 * dayMs;
          data = data.filter((a) => now - new Date(a.timestamp).getTime() <= limitMs);
        }

        setActivities(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFilteredActivities();
  }, [selectedUser, selectedSpace, selectedProject, selectedType, selectedPeriod]);

  const activeUsersCount = users.length;
  const activeProjectsCount = projects.length;
  const totalEventsCount = activities.length;

  return (
    <div className="space-y-6 animate-fade-in text-[#292524]">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#292524]">
          Platform Activity Telemetry
        </h1>
        <p className="text-xs text-[#78716C] mt-1 font-mono">
          Real-time global event stream across user sessions, project interactions, feature usage, and background tasks.
        </p>
      </div>

      {/* PLATFORM ACTIVITY SUMMARY CARDS (DIAGRAM ALIGNMENT) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
            <UserIcon className="w-3.5 h-3.5 text-[#E9825B]" /> User Activity
          </span>
          <p className="text-2xl font-bold text-[#292524]">{activeUsersCount} Active Users</p>
        </Card>

        <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
            <ActivityIcon className="w-3.5 h-3.5 text-[#E9825B]" /> Feature Usage
          </span>
          <p className="text-2xl font-bold text-[#E9825B]">{totalEventsCount} Interactions</p>
        </Card>

        <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
            <FolderKanban className="w-3.5 h-3.5 text-[#137333]" /> Active Projects
          </span>
          <p className="text-2xl font-bold text-[#137333]">{activeProjectsCount} Projects</p>
        </Card>

        <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
          <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#E9825B]" /> Learning Frequency
          </span>
          <p className="text-2xl font-bold text-[#292524]">Daily Drills</p>
        </Card>
      </div>

      {/* FILTER BAR PANEL */}
      <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-[#78716C]">
          <Filter className="w-4 h-4 text-[#E9825B]" />
          <span className="uppercase tracking-wider">Backend Telemetry Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          {/* User Filter */}
          <div>
            <label className="block text-[10px] text-[#78716C] uppercase mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-[#292524] focus:outline-none focus:border-[#F8C9B0]"
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Space Filter */}
          <div>
            <label className="block text-[10px] text-[#78716C] uppercase mb-1">Space</label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-[#292524] focus:outline-none focus:border-[#F8C9B0]"
            >
              <option value="all">All Spaces</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-[10px] text-[#78716C] uppercase mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-[#292524] focus:outline-none focus:border-[#F8C9B0]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Filter */}
          <div>
            <label className="block text-[10px] text-[#78716C] uppercase mb-1">Event Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-[#292524] focus:outline-none focus:border-[#F8C9B0]"
            >
              <option value="all">All Event Types</option>
              <option value="material_uploaded">Material Uploaded</option>
              <option value="tutor_queried">Tutor Queried</option>
              <option value="quiz_completed">Quiz Completed</option>
              <option value="mastery_changed">Mastery Updated</option>
              <option value="space_created">Space Created</option>
              <option value="project_created">Project Created</option>
            </select>
          </div>

          {/* Time Period Filter */}
          <div>
            <label className="block text-[10px] text-[#78716C] uppercase mb-1">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-[#292524] focus:outline-none focus:border-[#F8C9B0]"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ACTIVITY TELEMETRY FEED */}
      <div className="space-y-3 font-mono text-xs">
        {loading ? (
          <Card className="p-6 text-center text-[#78716C]">Loading activity telemetry...</Card>
        ) : activities.length > 0 ? (
          activities.map((act) => (
            <Card
              key={act.id}
              className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#F8C9B0] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-[#292524]">{act.userName || 'User'}</span>
                  <span className="text-[10px] text-[#78716C]">
                    • {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#78716C] font-sans">{act.description}</p>
                {act.projectTitle && (
                  <span className="inline-block text-[10px] bg-[#FFF0E8] text-[#E9825B] px-2 py-0.5 rounded border border-[#F8C9B0]/60">
                    Project: {act.projectTitle}
                  </span>
                )}
              </div>

              <span className="text-[#137333] font-semibold uppercase text-[10px] whitespace-nowrap bg-[#E6F4EA] px-2.5 py-1 rounded-full border border-[#CEEAD6] self-start sm:self-center">
                {act.type.replace('_', ' ')}
              </span>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-[#78716C]">
            No activity log events match the selected backend filters.
          </Card>
        )}
      </div>
    </div>
  );
};
