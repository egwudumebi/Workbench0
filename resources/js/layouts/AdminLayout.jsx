import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/brand/Logo';
import NavIcon from '../components/ui/NavIcons';
import { useAuth } from '../context/AuthContext';

const adminNav = [
    { section: 'Operations' },
    { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
    { to: '/admin/learners', label: 'Learners', icon: 'skills' },
    { to: '/admin/achievements', label: 'Achievements', icon: 'skills' },
    { section: 'Content' },
    { to: '/admin/projects', label: 'Training projects', icon: 'projects' },
    { to: '/admin/training-programs', label: 'Programmes', icon: 'lessons' },
    { to: '/admin/tasks', label: 'Task bank', icon: 'practice' },
    { to: '/admin/practice-arena', label: 'Practice Arena', icon: 'mistakes' },
    { section: 'Compliance' },
    { to: '/admin/audit-logs', label: 'Audit logs', icon: 'history' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user?.name
        ?.split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? 'AD';

    return (
        <div className="wb-admin-shell d-flex">
            <aside className="wb-admin-sidebar">
                <div className="wb-admin-sidebar-brand">
                    <Logo to="/admin" variant="light" size="sm" />
                    <div className="wb-admin-sidebar-tag">Operations console</div>
                </div>

                <nav className="wb-admin-nav">
                    {adminNav.map((item) =>
                        item.section ? (
                            <div key={item.section} className="wb-admin-nav-section">
                                {item.section}
                            </div>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `wb-admin-nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <NavIcon name={item.icon} />
                                {item.label}
                            </NavLink>
                        ),
                    )}
                </nav>

                <div className="wb-admin-sidebar-foot">
                    <div className="wb-admin-user-chip">
                        <span className="wb-admin-user-avatar">{initials}</span>
                        <div className="min-w-0">
                            <div className="wb-admin-user-name text-truncate">{user?.name}</div>
                            <div className="wb-admin-user-role">Administrator</div>
                        </div>
                    </div>
                    <p className="wb-admin-sidebar-note">
                        Learner experience uses a separate account. Sign in as{' '}
                        <code>learner@workbench0.local</code> to preview training UI.
                    </p>
                    <button type="button" className="btn btn-sm wb-admin-signout w-100" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="wb-admin-main flex-grow-1">
                <header className="wb-admin-topbar">
                    <span className="wb-admin-topbar-badge">Admin mode</span>
                    <span className="wb-admin-topbar-env">Content &amp; learner management</span>
                </header>
                <main className="wb-admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
