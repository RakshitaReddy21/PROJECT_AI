import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  FolderKanban,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  MessageSquare,
  Activity as ActivityIcon,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { fetchUserDetailApi } from '../../api/admin';
import { appStorage } from '../../services/storage/localStorageStore';
import { User, Space, Project, Material, TutorMessage, QuizResult, ActivityItem } from '../../types';
import { Card } from '../../components/ui/Card';

export const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userActivities, setUserActivities] = useState<ActivityItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      try {
        const u = await fetchUserDetailApi(userId);
        setUser(u);

        const allSpaces = appStorage.get('spaces') || [];
        const allProjects = appStorage.get('projects') || [];
        const allActivities = appStorage.get('activities') || [];

        const filteredSpaces = allSpaces.filter((s) => s.userId === userId);
        const filteredProjects = allProjects.filter((p) => p.userId === userId || !p.userId);
        const filteredActivities = allActivities.filter((a) => a.userId === userId);

        setUserSpaces(filteredSpaces);
        setUserProjects(filteredProjects);
        setUserActivities(filteredActivities);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const avgMastery =
    userProjects.length > 0
      ? Math.round(userProjects.reduce((sum, p) => sum + (p.masteryScore || 0), 0) / userProjects.length)
      : 0;

  // Retrieve project materials and tutor messages for inspected project
  const projectMaterials: Material[] = selectedProject
    ? (appStorage.get('materials') || []).filter((m) => m.projectId === selectedProject.id)
    : [];

  const projectTutorMessages: TutorMessage[] = selectedProject
    ? (appStorage.get('tutorMessages') || {})[selectedProject.id] || []
    : [];

  const projectQuizResults: QuizResult[] = selectedProject
    ? (appStorage.get('quizResults') || {})[selectedProject.id] || []
    : [];

  return (
    <div className="space-y-6 animate-fade-in text-[#292524]">
      {/* Navigation Breadcrumb */}
      <Link to="/admin/users" className="inline-flex items-center text-xs font-mono font-semibold text-[#E9825B] hover:underline">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to User Directory
      </Link>

      {/* Account Overview Header Card */}
      <Card className="p-6 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#FFF0E8] text-[#E9825B] font-bold rounded-2xl flex items-center justify-center text-xl border border-[#F8C9B0] shadow-sm flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#292524]">{user?.name || (loading ? 'Loading...' : 'User Account')}</h1>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                    user?.role === 'admin'
                      ? 'bg-[#FFF0E8] text-[#E9825B] border-[#F8C9B0]'
                      : 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                  }`}
                >
                  {user?.role?.toUpperCase() || 'LEARNER'}
                </span>
              </div>
              <p className="text-xs text-[#78716C] font-mono mt-0.5">
                {user?.email} • ID: {userId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#78716C] bg-[#FFF8F5] px-3 py-1.5 rounded-xl border border-[#F1E8E3]">
            <ShieldCheck className="w-4 h-4 text-[#137333]" />
            <span>Account Status: Active Session</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1E8E3] font-mono">
          <div className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold">Spaces Enrolled</span>
            <p className="text-lg font-bold text-[#292524] mt-0.5">{userSpaces.length}</p>
          </div>
          <div className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold">Active Projects</span>
            <p className="text-lg font-bold text-[#292524] mt-0.5">{userProjects.length}</p>
          </div>
          <div className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold">Average Mastery</span>
            <p className="text-lg font-bold text-[#137333] mt-0.5">{avgMastery}%</p>
          </div>
          <div className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold">Joined Date</span>
            <p className="text-xs font-bold text-[#78716C] mt-1">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* USER SPACES SECTION */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-[#E9825B]" /> User Learning Spaces ({userSpaces.length})
        </h2>

        {userSpaces.length === 0 ? (
          <Card className="p-6 text-center text-xs font-mono text-[#78716C]">
            No study spaces created by this user yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSpaces.map((space) => (
              <Card key={space.id} className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#292524]">{space.name}</span>
                  <span className="text-[10px] font-mono bg-[#FFF0E8] text-[#E9825B] px-2 py-0.5 rounded border border-[#F8C9B0]">
                    {space.projectCount || 0} projects
                  </span>
                </div>
                <p className="text-xs text-[#78716C] line-clamp-2">{space.description}</p>
                <div className="text-[10px] font-mono text-[#78716C] pt-2 border-t border-[#F1E8E3] flex justify-between">
                  <span>Created: {new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* USER PROJECTS & READ-ONLY OVERSIGHT SECTION */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#E9825B]" /> User Projects & Read-Only Oversight ({userProjects.length})
        </h2>

        {userProjects.length === 0 ? (
          <Card className="p-6 text-center text-xs font-mono text-[#78716C]">
            No projects created by this user yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProjects.map((project) => (
              <Card key={project.id} className="p-5 bg-white border border-[#F1E8E3] rounded-2xl space-y-3 shadow-sm hover:border-[#F8C9B0] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#292524]">{project.title}</h3>
                    <span className="text-[10px] font-mono text-[#E9825B] bg-[#FFF0E8] px-2 py-0.5 rounded border border-[#F8C9B0]/60 inline-block mt-0.5">
                      {project.spaceName || 'General'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="px-3 py-1.5 bg-[#FFF0E8] hover:bg-[#F8C9B0] text-[#E9825B] border border-[#F8C9B0] rounded-xl text-xs font-mono font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect Project
                  </button>
                </div>

                <p className="text-xs text-[#78716C] line-clamp-2">{project.description}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F1E8E3] text-center font-mono text-[11px]">
                  <div className="p-1.5 bg-[#FFF8F5] rounded">
                    <span className="block text-[9px] text-[#78716C]">Mastery</span>
                    <span className="font-bold text-[#137333]">{project.masteryScore}%</span>
                  </div>
                  <div className="p-1.5 bg-[#FFF8F5] rounded">
                    <span className="block text-[9px] text-[#78716C]">Materials</span>
                    <span className="font-bold text-[#292524]">{project.materialCount || 0}</span>
                  </div>
                  <div className="p-1.5 bg-[#FFF8F5] rounded">
                    <span className="block text-[9px] text-[#78716C]">Concepts</span>
                    <span className="font-bold text-[#292524]">{project.conceptCount || 0}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* USER ACTIVITY TIMELINE */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <ActivityIcon className="w-3.5 h-3.5 text-[#E9825B]" /> Activity History & Session Telemetry
        </h2>

        <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm space-y-3 font-mono text-xs">
          {userActivities.length === 0 ? (
            <p className="text-center text-[#78716C] py-4">No recent activity recorded for this user.</p>
          ) : (
            userActivities.map((act) => (
              <div key={act.id} className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3] flex items-center justify-between gap-3">
                <div>
                  <p className="text-[#292524] font-semibold">{act.description}</p>
                  <span className="text-[10px] text-[#78716C]">
                    Project: {act.projectTitle || 'General'} • {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#CEEAD6] uppercase flex-shrink-0">
                  {act.type.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* READ-ONLY PROJECT INSPECTION MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-[#F1E8E3] rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F1E8E3] flex items-center justify-between bg-[#FFF8F5]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#E9825B] font-semibold bg-[#FFF0E8] px-2 py-0.5 rounded border border-[#F8C9B0]">
                  Read-Only Inspection Mode
                </span>
                <h3 className="text-base font-bold text-[#292524] mt-1">{selectedProject.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-lg text-[#78716C] hover:bg-[#FFF0E8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 font-mono text-xs">
              {/* Target Goal */}
              <div className="p-3 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl space-y-1">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold">Target Learning Goal</span>
                <p className="text-xs text-[#292524] font-sans">{selectedProject.targetGoal || 'No goal set.'}</p>
              </div>

              {/* Project Progress & Last Activity */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase font-semibold block">Overall Progress</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 h-2 bg-[#F1E8E3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#137333] rounded-full"
                        style={{ width: `${selectedProject.masteryScore || 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#137333] text-xs">{selectedProject.masteryScore || 0}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase font-semibold block">Last Activity</span>
                  <span className="text-xs text-[#292524] font-semibold mt-1 block">
                    {selectedProject.lastStudiedAt ? new Date(selectedProject.lastStudiedAt).toLocaleString() : 'Recently'}
                  </span>
                </div>
              </div>

              {/* Ingested Materials */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#292524] uppercase text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#E9825B]" /> Ingested Study Materials ({projectMaterials.length})
                </h4>
                {projectMaterials.length === 0 ? (
                  <p className="text-[#78716C] text-[11px]">No materials uploaded for this project.</p>
                ) : (
                  <div className="space-y-1.5">
                    {projectMaterials.map((m) => (
                      <div key={m.id} className="p-2.5 bg-[#FFF8F5] rounded border border-[#F1E8E3] flex justify-between items-center">
                        <span className="text-[#292524] font-semibold truncate">{m.title || m.fileName}</span>
                        <span className="text-[10px] text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#CEEAD6]">
                          PROCESSED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tutor Interaction History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#292524] uppercase text-[11px] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#E9825B]" /> Tutor Activity ({projectTutorMessages.length})
                </h4>
                {projectTutorMessages.length === 0 ? (
                  <p className="text-[#78716C] text-[11px]">No tutor messages recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-[#FFF8F5] rounded border border-[#F1E8E3]">
                    {projectTutorMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded text-[11px] ${
                          msg.sender === 'user'
                            ? 'bg-white border border-[#F4E3D8] text-[#1F1917]'
                            : 'bg-[#FFEBE0] border border-[#FFC8B0] text-[#1F1917]'
                        }`}
                      >
                        <span className="block font-bold text-[10px] uppercase text-[#E85A2A] mb-0.5">
                          {msg.sender === 'user' ? 'Learner Query' : 'AI Tutor Response'}
                        </span>
                        <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quiz Activity History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#292524] uppercase text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E9825B]" /> Quiz Activity ({projectQuizResults.length})
                </h4>
                {projectQuizResults.length === 0 ? (
                  <p className="text-[#78716C] text-[11px]">No quiz attempts recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {projectQuizResults.map((qRes) => (
                      <div key={qRes.id} className="p-2.5 bg-[#FFF8F5] rounded border border-[#F1E8E3] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#292524]">Quiz Score: {qRes.score}%</span>
                          <span className="block text-[10px] text-[#78716C]">
                            {qRes.correctCount}/{qRes.totalQuestions} questions correct • {new Date(qRes.completedAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#CEEAD6]">
                          COMPLETED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F1E8E3] bg-[#FFF8F5] text-right">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-white border border-[#F1E8E3] hover:bg-[#FFF0E8] text-[#292524] font-mono text-xs rounded-xl transition-colors font-semibold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
