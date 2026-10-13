import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/learner/Dashboard';
import Projects from './pages/learner/Projects';
import ProjectDetail from './pages/learner/ProjectDetail';
import ExploreAcademy from './pages/learner/ExploreAcademy';
import ProgramDetail from './pages/learner/ProgramDetail';
import AcademyLessonView from './pages/learner/AcademyLessonView';
import PracticeArena from './pages/learner/PracticeArena';
import BuildMyAcademy from './pages/learner/BuildMyAcademy';
import Achievements from './pages/learner/Achievements';
import MyLearningPaths from './pages/learner/MyLearningPaths';
import Profile from './pages/learner/Profile';
import PublishedAcademyStudy from './pages/learner/PublishedAcademyStudy';
import AdminTrainingPrograms from './pages/admin/AdminTrainingPrograms';
import AdminTrainingProgramDetail from './pages/admin/AdminTrainingProgramDetail';
import Lessons from './pages/learner/Lessons';
import LessonDetail from './pages/learner/LessonDetail';
import Practice from './pages/learner/Practice';
import Skills from './pages/learner/Skills';
import Mistakes from './pages/learner/Mistakes';
import History from './pages/learner/History';
import Assessment from './pages/learner/Assessment';
import AssessmentResult from './pages/learner/AssessmentResult';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminProjectDetail from './pages/admin/AdminProjectDetail';
import AdminTasks from './pages/admin/AdminTasks';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminLearners from './pages/admin/AdminLearners';
import AdminLearnerDetail from './pages/admin/AdminLearnerDetail';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminPracticeArena from './pages/admin/AdminPracticeArena';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        element={
                            <ProtectedRoute learnerOnly>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="explore" element={<ExploreAcademy />} />
                        <Route path="explore/:id" element={<ProgramDetail />} />
                        <Route path="academy-lessons/:id" element={<AcademyLessonView />} />
                        <Route path="practice-arena" element={<PracticeArena />} />
                        <Route path="build-academy" element={<BuildMyAcademy />} />
                        <Route path="my-paths" element={<MyLearningPaths />} />
                        <Route path="achievements" element={<Achievements />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="my-academies/:id/study" element={<PublishedAcademyStudy />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projects/:id" element={<ProjectDetail />} />
                        <Route path="lessons" element={<Lessons />} />
                        <Route path="lessons/:id" element={<LessonDetail />} />
                        <Route path="practice" element={<Practice />} />
                        <Route path="skills" element={<Skills />} />
                        <Route path="mistakes" element={<Mistakes />} />
                        <Route path="history" element={<History />} />
                        <Route path="assessment" element={<Assessment />} />
                        <Route path="assessment/:id/result" element={<AssessmentResult />} />
                        <Route path="assessment/:id" element={<Assessment />} />
                    </Route>

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboard />} />
                        <Route path="learners" element={<AdminLearners />} />
                        <Route path="learners/:id" element={<AdminLearnerDetail />} />
                        <Route path="achievements" element={<AdminAchievements />} />
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="projects/:id" element={<AdminProjectDetail />} />
                        <Route path="tasks" element={<AdminTasks />} />
                        <Route path="practice-arena" element={<AdminPracticeArena />} />
                        <Route path="audit-logs" element={<AdminAuditLogs />} />
                        <Route path="training-programs" element={<AdminTrainingPrograms />} />
                        <Route path="training-programs/:id" element={<AdminTrainingProgramDetail />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
