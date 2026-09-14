import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { GlobalAnalytics } from './pages/GlobalAnalytics';
import { GlobalGrowth } from './pages/GlobalGrowth';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { SpacesList } from './pages/spaces/SpacesList';
import { SpaceDetail } from './pages/spaces/SpaceDetail';

import { ProjectsList } from './pages/projects/ProjectsList';
import { ProjectLayout } from './pages/projects/ProjectLayout';
import { ProjectOverview } from './pages/projects/ProjectOverview';
import { ProjectMaterials } from './pages/projects/ProjectMaterials';
import { ProjectTutor } from './pages/projects/ProjectTutor';
import { ProjectQuiz } from './pages/projects/ProjectQuiz';
import { ProjectAssessment } from './pages/projects/ProjectAssessment';
import { ProjectMastery } from './pages/projects/ProjectMastery';
import { ProjectGrowth } from './pages/projects/ProjectGrowth';
import { ProjectAnalytics } from './pages/projects/ProjectAnalytics';
import { ProjectActivity } from './pages/projects/ProjectActivity';

import { AdminShell } from './components/layout/AdminShell';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminSpaces } from './pages/admin/AdminSpaces';
import { AdminProjects } from './pages/admin/AdminProjects';
import { AdminActivity } from './pages/admin/AdminActivity';
import { AdminLearningAnalytics } from './pages/admin/AdminLearningAnalytics';
import { AdminAIUsage } from './pages/admin/AdminAIUsage';
import { AdminAIEvaluation } from './pages/admin/AdminAIEvaluation';
import { AdminSystemHealth } from './pages/admin/AdminSystemHealth';

// Dynamic route redirectors for /app/* aliases
const SpaceRedirect: React.FC = () => {
  const { spaceId } = useParams();
  return <Navigate to={`/spaces/${spaceId}`} replace />;
};

const ProjectRedirect: React.FC = () => {
  const { projectId, tab } = useParams();
  return <Navigate to={`/projects/${projectId}/${tab || 'overview'}`} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Learner App Routes (Direct Root Navigation per PRD §5) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/spaces" element={<SpacesList />} />
                <Route path="/spaces/:spaceId" element={<SpaceDetail />} />

                {/* Projects Catalog & Project Workspace */}
                <Route path="/projects" element={<ProjectsList />} />
                <Route path="/projects/:projectId" element={<ProjectLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<ProjectOverview />} />
                  <Route path="tutor" element={<ProjectTutor />} />
                  <Route path="materials" element={<ProjectMaterials />} />
                  <Route path="quiz" element={<ProjectQuiz />} />
                  <Route path="assessment" element={<ProjectAssessment />} />
                  <Route path="mastery" element={<ProjectMastery />} />
                  <Route path="growth" element={<ProjectGrowth />} />
                  <Route path="analytics" element={<ProjectAnalytics />} />
                  <Route path="activity" element={<ProjectActivity />} />
                </Route>

                <Route path="/growth" element={<GlobalGrowth />} />
                <Route path="/analytics" element={<GlobalAnalytics />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/settings" element={<Settings />} />

                {/* Backward-Compatible /app/* Aliases */}
                <Route path="/app/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/app/spaces" element={<Navigate to="/spaces" replace />} />
                <Route path="/app/spaces/:spaceId" element={<SpaceRedirect />} />
                <Route path="/app/projects/:projectId" element={<Navigate to="overview" replace />} />
                <Route path="/app/projects/:projectId/:tab" element={<ProjectRedirect />} />
                <Route path="/app/growth" element={<Navigate to="/growth" replace />} />
                <Route path="/app/analytics" element={<Navigate to="/analytics" replace />} />
                <Route path="/app/activity" element={<Navigate to="/activity" replace />} />
                <Route path="/app/settings" element={<Navigate to="/settings" replace />} />
              </Route>
            </Route>

            {/* Protected Admin Portal Routes per PRD §5 & §35-40 */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminShell />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="spaces" element={<AdminSpaces />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="analytics" element={<AdminLearningAnalytics />} />
                <Route path="ai-usage" element={<AdminAIUsage />} />
                <Route path="evaluations" element={<AdminAIEvaluation />} />
                <Route path="ai-evaluation" element={<AdminAIEvaluation />} />
                <Route path="system-health" element={<AdminSystemHealth />} />
              </Route>
            </Route>

            {/* Fallback Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
