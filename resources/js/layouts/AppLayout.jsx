import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/brand/Logo';
import NavIcon from '../components/ui/NavIcons';
import AppTopBar from '../components/layout/AppTopBar';
import { AcademyStatsProvider } from '../context/AcademyStatsContext';
import { useAuth } from '../context/AuthContext';
import { useLearnerIdentity } from '../hooks/useLearnerIdentity';

function SidebarUserCard({ user, isDemo, onLogout }) {
    const { displayName, initials, email } = useLearnerIdentity();

    return (
        <>
            <div className="wb-sidebar-user-card mt-3">
                <div className="wb-sidebar-user-avatar">{initials}</div>
                <div className="flex-grow-1 min-w-0">
                    <div className="small fw-semibold text-white text-truncate">{displayName}</div>
                    <div className="small wb-brand-sub text-truncate">{email ?? user?.email}</div>
                    {isDemo && <span className="badge bg-warning text-dark mt-1">Demo Account</span>}
                </div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-light w-100 mt-2" onClick={onLogout}>
                Sign out
            </button>
        </>
    );
}

const primaryNav = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/projects', label: 'Training Projects', icon: 'projects' },
    { to: '/explore', label: 'Explore Academy', icon: 'lessons' },
    { to: '/my-paths', label: 'My Learning Paths', icon: 'lessons' },
    { to: '/build-academy', label: 'Build My Academy', icon: 'assessment' },
    { to: '/practice-arena', label: 'Practice Arena', icon: 'practice' },
    { to: '/achievements', label: 'Achievements', icon: 'skills' },
    { to: '/skills', label: 'Readiness & Progress', icon: 'skills' },
    { to: '/profile', label: 'Profile & Preferences', icon: 'dashboard' },
];

export default function AppLayout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);
    const isDemo = user?.email === 'learner@workbench0.local';

    return (
        <AcademyStatsProvider>
            <div className="wb-app-shell d-flex">
                {sidebarOpen && (
                    <div className="wb-sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />
                )}

                <aside className={`wb-sidebar wb-sidebar-hub p-3 ${sidebarOpen ? 'open' : ''}`}>
                    <div className="mb-4 px-2">
                        <Logo to="/dashboard" variant="light" size="sm" />
                        <div className="wb-brand-sub mt-2">Learn • Practice • Get Ready</div>
                    </div>

                    <nav className="flex-grow-1">
                        {primaryNav.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={closeSidebar}
                                className={({ isActive }) => `wb-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <NavIcon name={item.icon} />
                                {item.label}
                            </NavLink>
                        ))}

                        {isAdmin && (
                            <NavLink
                                to="/admin"
                                onClick={closeSidebar}
                                className={({ isActive }) => `wb-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <NavIcon name="admin" />
                                Admin Panel
                            </NavLink>
                        )}

                        <div className="wb-nav-section mt-4">Support</div>
                        <NavLink to="/profile" className="wb-nav-link" onClick={closeSidebar}>
                            <NavIcon name="dashboard" />
                            Settings
                        </NavLink>
                        <NavLink to="/profile" className="wb-nav-link" onClick={closeSidebar}>
                            <NavIcon name="lessons" />
                            Help &amp; Support
                        </NavLink>
                    </nav>

                    <SidebarUserCard user={user} isDemo={isDemo} onLogout={handleLogout} />
                </aside>

                <div className="wb-main wb-main-hub d-flex flex-column flex-grow-1">
                    <header className="wb-topbar d-lg-none">
                        <Logo to="/dashboard" size="sm" className="wb-topbar-logo" />
                        <button
                            type="button"
                            className="btn btn-light btn-sm wb-mobile-toggle"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </header>

                    <AppTopBar />

                    <div className="wb-page wb-page-hub">
                        <Outlet />
                    </div>
                </div>
            </div>
        </AcademyStatsProvider>
    );
}
