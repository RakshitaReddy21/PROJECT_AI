# FRONTEND.md — Aurelia AI Study Companion

## 1. Architecture overview

**Stack:** React 18 + TypeScript, Vite, React Router v6, TanStack Query,
React Hook Form + Zod, Tailwind CSS, Recharts, lucide-react, axios,
date-fns. No Next.js. No Redux — server state lives in TanStack Query,
global lightweight auth state lives in React Context, everything else is
local component state.

**Directory structure**

```
src/
├── api/            One file per domain (auth, spaces, projects, materials,
│                    tutor, quiz, assessment, mastery, growth,
│                    recommendations, analytics, activity, admin, aiUsage,
│                    evaluation, health). Every exported function is async
│                    and typed against src/types — components never call
│                    axios or the mock store directly.
├── mocks/           data.ts (realistic seed data for a "Retrieval
│                    Augmented Generation" demo project) and db.ts (an
│                    in-memory mutable store with artificial network
│                    delay, simulating async processing pipelines,
│                    Tutor responses, quiz scoring, etc).
├── context/         AuthContext (session), ProjectContext (the active
│                    project's data, scoped to /app/projects/:projectId).
├── hooks/           useAuth, useProject — thin context accessors.
├── components/      layout/, ui/, learning/, materials/, tutor/, quiz/,
│                    assessment/, analytics/, admin/ — see §3.
├── pages/            One file per route (see §2).
├── routes/          ProtectedRoute / AdminRoute guards.
├── types/           Centralized domain types, aligned to the API layer.
└── styles/          Tailwind entry + design tokens.
```

## 2. Routing

Implemented with React Router v6, exactly matching the PRD's route list:

- `/login`, `/register` — public
- `/app/dashboard`, `/app/spaces`, `/app/spaces/:spaceId` — protected
- `/app/projects/:projectId/{overview,materials,tutor,quiz,assessment,growth,analytics}`
  — protected, nested under a shared `ProjectLayout` (tabs + header +
  `ProjectProvider`)
- `/app/analytics`, `/app/activity`, `/app/settings` — protected
- `/admin`, `/admin/users`, `/admin/users/:userId`, `/admin/projects`,
  `/admin/activity`, `/admin/analytics`, `/admin/ai-usage`,
  `/admin/ai-evaluation`, `/admin/system-health` — protected + role-gated

`ProtectedRoute` redirects unauthenticated users to `/login`.
`AdminRoute` additionally redirects non-admin users to `/app/dashboard`.
Route-level code splitting (`React.lazy`) is a straightforward follow-up
once bundle size is measured against a real backend — left as a P1 item
so the demo build stays simple to read.

## 3. Component architecture

- **layout/** — `AppShell`, `Sidebar` (learner nav + contextual project
  tabs), `Topbar` (breadcrumbs, search affordance, AI-grounded indicator,
  user menu), `Breadcrumbs`.
- **ui/** — hand-built primitives in the shadcn/ui spirit (`Button`,
  `Card`, `Badge`, `Modal`, `TabNav`, `Skeleton`, `EmptyState`,
  `ErrorState`, `ProgressBar`). The project ships without network access
  to the shadcn CLI/npm registry, so these are written directly against
  the same design tokens shadcn would use — swapping in the generated
  shadcn components later is a drop-in replacement, not a rewrite.
- **learning/** — `SpaceCard`, `ProjectCard`, `ConceptCard`,
  `MasteryStatusBadge`, `MasteryChart`, `RecommendationCard`,
  `ActivityTimeline`, `LearningContext` (the persistent "you are
  currently learning..." panel).
- **materials/** — `UploadDropzone`, `ProcessingStatus` (5-stage
  pipeline indicator), `MaterialCard` (ready / processing / failed
  states with retry).
- **tutor/** — `TutorChat` (stateful chat panel: query + mutation +
  autoscroll), `ChatMessageBubble` (markdown-ish plain text, citations,
  unsupported-answer styling), `TutorSuggestions`, `ContextPanel`.
- **quiz/** — `QuizHeader` (adaptation rationale), `QuizProgress`,
  `QuizQuestionCard` (multiple choice / true-false / scenario, answer
  hidden until submission), `QuizResultView`, `ConceptPerformance`.
- **assessment/** — `AssessmentEditor`, `FeedbackSection`,
  `AssessmentResultView`.
- **analytics/** — `MetricCard`, `TrendChart` (Recharts area chart),
  `AnalyticsFilters` (7d/30d/90d/all).
- **admin/** — `AdminShell` (separate dark sidebar shell, per §21 of the
  PRD), `UserTable`, `AIUsageTable`, `SystemHealthPanel`,
  `EvaluationPanel`.

## 4. State management

- **Server state:** TanStack Query exclusively. Query keys are scoped by
  entity + id (`['project', projectId]`, `['materials', projectId]`,
  etc.), enabling targeted invalidation after mutations (space/project
  creation, material upload, quiz submission).
- **Background processing:** `ProjectMaterials` polls
  (`refetchInterval`) while any material is still `processing`, and
  stops polling once every material has settled — this is the pattern
  to reuse for any other async job the backend exposes.
- **Global state:** `AuthContext` (session/user), `ProjectContext`
  (active project + concepts + recent activity + top recommendation,
  scoped by route param so nothing outside the current project is
  fetched unnecessarily).
- **Local UI state:** quiz progression, assessment draft text, modal
  open/close, upload drag state — plain `useState`, no global store.

## 5. API integration & mock mode

Every function in `src/api/*.ts` has two branches: a mock branch (default
on, `VITE_MOCK_MODE=true`) backed by `src/mocks`, and a real branch using
the shared `apiClient` (axios, bearer-token interceptor, 401 handling).
Swapping to a live FastAPI backend is a two-line `.env` change — see
`README.md`. `src/mocks/db.ts` is intentionally written to *feel* like a
network call (promises, artificial latency, background stage transitions
for material processing) so no component logic has to change when the
mock is replaced.

## 6. Authentication

`AuthContext` + `useAuth()` wrap login/register/logout, persist the demo
session to `sessionStorage`, and expose `status` (`idle` |
`loading` | `authenticated` | `error`) for the UI to key off. Login and
Register use React Hook Form + Zod for validation with inline field
errors and a distinct server-error state. In mock mode, any email
containing "admin" signs in as the admin persona so `/admin` can be
demoed without a separate login flow; a real backend would return the
user's actual role and `AdminRoute` would gate on that.

## 7. Design system

Token set (Tailwind config) intentionally avoids the generic "AI SaaS"
look (cream + terracotta, dark + neon, identikit rounded cards):

- **Color:** warm grey-green paper background (`#F3F4F0`), near-black
  ink (`#171F2A`) for text, a muted teal "signal" color (`#2F6F6B`) that
  consistently means *measured progress / grounded*, amber (`#B8843A`)
  for *needs attention*, rust (`#B0472E`) for errors/failure states, and
  indigo (`#3E4B8C`) as a secondary accent for "in progress" states.
  Color is used consistently as a signal (mastery, status, AI groundedness),
  never decoratively.
- **Type:** IBM Plex Sans for all UI chrome and body text (functional,
  has a matching mono face for data/timestamps); Fraunces (serif) is
  reserved for a small number of display moments — the dashboard
  greeting, big mastery/score numbers, page titles — to give the product
  a bit of "companion" warmth without turning every label into a
  headline.
- **Layout:** 240px sidebar + content max-width 1200px, dense metric-card
  grids for analytics, generous vertical rhythm elsewhere. Admin uses a
  distinct dark sidebar so the two "apps" are never visually confused.

## 8. Testing

Vitest + React Testing Library, configured in `vitest.config.ts`. Two
representative suites are included: `Login.test.tsx` (form rendering)
and `QuizQuestion.test.tsx` (answer selection + the "don't reveal the
correct answer before submission" requirement). These are meant as a
pattern to extend, not full coverage — see Known Limitations.

## 9. Performance

- Query caching + scoped invalidation via TanStack Query (30s
  `staleTime`, no refetch-on-window-focus, background refetch only for
  in-flight material processing).
- Concept/material/activity lists are small in the demo dataset; if
  volumes grow, `DataTable`-style pagination should be added to
  `UserTable`/`AIUsageTable`/`Activity` before route-level code splitting
  becomes the bottleneck.

## 10. Requirement-to-screen traceability matrix

| PRD requirement | Route | Key component(s) |
|---|---|---|
| Authentication (login/register, validation, states) | `/login`, `/register` | `pages/auth/Login`, `pages/auth/Register` |
| Protected routes / admin authorization | all `/app/*`, `/admin/*` | `routes/ProtectedRoute.tsx` |
| Home dashboard (continue learning, recommendation, areas to improve) | `/app/dashboard` | `pages/Dashboard.tsx` |
| Spaces list + create | `/app/spaces` | `pages/spaces/SpacesList.tsx`, `components/learning/SpaceCard` |
| Space detail | `/app/spaces/:spaceId` | `pages/spaces/SpaceDetail.tsx` |
| Project creation / header / tabs | `/app/projects/:projectId/*` | `pages/projects/ProjectLayout.tsx` |
| Project overview (command center) | `/app/projects/:projectId/overview` | `pages/projects/ProjectOverview.tsx` |
| Materials list, upload, processing states, failure/retry | `/app/projects/:projectId/materials` | `pages/projects/ProjectMaterials.tsx`, `components/materials/*` |
| AI Tutor: context panel, grounded answers, citations, unsupported handling, suggestions | `/app/projects/:projectId/tutor` | `pages/projects/ProjectTutor.tsx`, `components/tutor/*` |
| Persistent contextual-continuity UI | Tutor page sidebar | `components/tutor/ContextPanel.tsx` → `components/learning/LearningContext.tsx` |
| Adaptive quiz (rationale, question types, progress, result, next action) | `/app/projects/:projectId/quiz` | `pages/projects/ProjectQuiz.tsx`, `components/quiz/*` |
| Open-ended assessment + AI feedback breakdown | `/app/projects/:projectId/assessment` | `pages/projects/ProjectAssessment.tsx`, `components/assessment/*` |
| Concept mastery (status, trend, history, "why it changed") | Overview + Growth pages | `components/learning/ConceptCard`, `MasteryChart`, `mocks/data.ts:masteryChanges` |
| Growth analysis (insights, summary narrative, trends) | `/app/projects/:projectId/growth` | `pages/projects/ProjectGrowth.tsx` |
| Recommendations (reusable card, evidence, actions) | Dashboard, Overview, Growth | `components/learning/RecommendationCard.tsx` |
| Project analytics (activity/performance/growth/AI dimensions, date filters) | `/app/projects/:projectId/analytics` | `pages/projects/ProjectAnalytics.tsx` |
| Global analytics | `/app/analytics` | `pages/GlobalAnalytics.tsx` |
| Activity timeline (filterable) | `/app/activity` | `pages/Activity.tsx` |
| Admin dashboard (platform KPIs) | `/admin` | `pages/admin/AdminDashboard.tsx` |
| Admin users (table + detail + learning journey) | `/admin/users`, `/admin/users/:userId` | `pages/admin/AdminUsers.tsx`, `AdminUserDetail.tsx` |
| Admin spaces/projects | `/admin/projects` | `pages/admin/AdminProjects.tsx` |
| Admin activity | `/admin/activity` | `pages/admin/AdminActivity.tsx` |
| Admin learning analytics | `/admin/analytics` | `pages/admin/AdminLearningAnalytics.tsx` |
| Admin AI usage (observability) | `/admin/ai-usage` | `pages/admin/AdminAIUsage.tsx`, `components/admin/AIUsageTable` |
| Admin AI evaluation (groundedness, retrieval, assessment, recommendation quality) | `/admin/ai-evaluation` | `pages/admin/AdminAIEvaluation.tsx`, `components/admin/EvaluationPanel` |
| Admin system health | `/admin/system-health` | `pages/admin/AdminSystemHealth.tsx`, `components/admin/SystemHealthPanel` |
| Loading / empty / error states | throughout | `components/ui/Skeleton`, `EmptyState`, `ErrorState` |
| Mock data / mock API mode | all | `src/mocks/*`, `VITE_MOCK_MODE` in every `src/api/*.ts` |
| Settings | `/app/settings` | `pages/Settings.tsx` |

## 11. Known limitations

This is a frontend scaffold built to demo the full connected learning
loop end to end, not a production-hardened application. Explicitly out
of scope / simplified for this pass:

- **No real backend.** Everything runs against `src/mocks`; the API
  layer is written so a FastAPI backend is a drop-in swap (see §5), but
  it has not been tested against one.
- **Auth is a demo shim.** Login accepts any email/password in mock
  mode and infers the admin role from the email string; a real backend
  must own authentication and role assignment, and the frontend must
  never be trusted as the authorization boundary (`AdminRoute` is a UX
  convenience, not a security control).
- **Streaming Tutor responses, flashcards, concept maps, study
  streaks, command palette, and other P1/P2 items from §53–54 of the
  PRD are not implemented** — the priority order in the PRD explicitly
  defers them.
- **Route-level code splitting is not wired up.** With ~25 routes this
  is a straightforward `React.lazy`/`Suspense` pass once real bundle
  size is measurable.
- **Test coverage is a starting pattern (2 suites), not the full 15-flow
  checklist from §50** — Login rendering and quiz answer-reveal are
  covered as examples; expanding to the rest of the list (protected
  routes, material upload states, citation rendering, admin
  authorization, etc.) follows the same `render()` + RTL pattern.
- **Admin "Spaces & Projects", "Learning Analytics" and "AI Evaluation"
  pages use lighter aggregate mock data** rather than fully
  cross-referencing every user's underlying records — sufficient for a
  demo, not for real multi-tenant admin reporting.
- **Accessibility has a solid baseline** (semantic labels, keyboard
  handling in the modal and dropzone, visible focus rings, reduced-motion
  media query) but has not been audited with a screen reader end to end.
