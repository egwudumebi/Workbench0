import { Link } from 'react-router-dom';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import { useLearnerIdentity } from '../../hooks/useLearnerIdentity';

export default function AppTopBar() {
    const { stats } = useAcademyStats();
    const { initials, firstName } = useLearnerIdentity();

    return (
        <header className="wb-hub-topbar d-none d-lg-flex">
            <div className="wb-hub-search-wrap flex-grow-1">
                <span className="wb-hub-search-icon" aria-hidden>⌕</span>
                <input
                    type="search"
                    className="wb-hub-search"
                    placeholder="Search programs, lessons, or skills…"
                    aria-label="Search"
                />
            </div>
            <div className="wb-hub-topbar-actions">
                {stats && (
                    <>
                        <div className="wb-hub-pill wb-hub-pill-streak">
                            <span aria-hidden>🔥</span>
                            {stats.profile.streak_days} day streak
                        </div>
                        <div className="wb-hub-pill wb-hub-pill-xp">
                            <span className="wb-hub-coin" aria-hidden>◉</span>
                            {stats.profile.xp.toLocaleString()} XP
                        </div>
                    </>
                )}
                <button type="button" className="wb-hub-notify" aria-label="Notifications">
                    🔔
                    <span className="wb-hub-notify-badge">5</span>
                </button>
                <Link to="/profile" className="wb-hub-user-chip text-decoration-none">
                    <span className="wb-hub-avatar">{initials}</span>
                    <span className="wb-hub-user-name">{firstName}</span>
                    <span className="wb-hub-chevron" aria-hidden>▾</span>
                </Link>
            </div>
        </header>
    );
}
