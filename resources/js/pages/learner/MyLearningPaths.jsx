import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAcademyDashboard, fetchMyAcademies } from '../../api/academy';
import GamePageHero from '../../components/academy/GamePageHero';
import LoadingState from '../../components/ui/LoadingState';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { useAuth } from '../../context/AuthContext';

const PATH_THEMES = ['wb-gamehub-path-indigo', 'wb-gamehub-path-teal', 'wb-gamehub-path-amber'];
const PATH_ICONS = ['🎓', '⚖️', '🧠'];

export default function MyLearningPaths() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [academies, setAcademies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setDashboard(await fetchAcademyDashboard());
                setAcademies(await fetchMyAcademies());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <LoadingState />;
    if (error) return <ErrorAlert error={error} />;

    const enrolments = dashboard?.enrolments ?? [];
    const published = academies.filter((a) => a.status === 'published');
    const profile = dashboard?.profile;
    const avgProgress = enrolments.length
        ? Math.round(enrolments.reduce((s, e) => s + (e.progress_percent ?? 0), 0) / enrolments.length)
        : 0;

    return (
        <div className="wb-gamehub-page">
            <GamePageHero
                eyebrow="Quest log"
                title="My Learning Paths"
                subtitle="Start by choosing a training project, then follow campaigns, lessons, practice, and games on your path."
                stats={[
                    { value: enrolments.length, label: 'Enrolled' },
                    { value: `${avgProgress}%`, label: 'Avg progress' },
                    { value: published.length, label: 'Custom' },
                    profile
                        ? { value: profile.streak_days, label: 'Day streak', variant: 'fire' }
                        : null,
                ].filter(Boolean)}
            />

            <section className="wb-gamehub-section">
                <h2 className="wb-gamehub-section-title">
                    <span className="wb-gamehub-section-icon">🎯</span>
                    Training project focus
                </h2>
                <div className="wb-gamehub-empty-slot wb-gamehub-empty-slot-inline">
                    <span className="wb-gamehub-empty-icon">📂</span>
                    <p>
                        Pick the evaluation project you are training for (videos, lessons, practice studio, arena,
                        assessment).
                    </p>
                    <Link to="/projects" className="btn wb-gamehub-btn-primary">
                        Choose training project →
                    </Link>
                </div>
            </section>

            <section className="wb-gamehub-section">
                <h2 className="wb-gamehub-section-title">
                    <span className="wb-gamehub-section-icon">🗺️</span>
                    Explore Academy
                </h2>
                {enrolments.length === 0 ? (
                    <div className="wb-gamehub-empty-slot">
                        <span className="wb-gamehub-empty-icon">🔒</span>
                        <p>No enrolled campaigns yet.</p>
                        <Link to="/explore" className="btn wb-gamehub-btn-primary">Browse campaigns</Link>
                    </div>
                ) : (
                    <div className="wb-gamehub-path-grid">
                        {enrolments.map((e, i) => {
                            const pct = Math.min(100, e.progress_percent ?? 0);
                            const theme = PATH_THEMES[i % PATH_THEMES.length];
                            const icon = PATH_ICONS[i % PATH_ICONS.length];
                            const status = pct >= 100 ? 'Complete' : pct > 0 ? 'In progress' : 'Enrolled';

                            return (
                                <article key={e.id} className={`wb-gamehub-path-card ${theme}`}>
                                    <div className="wb-gamehub-path-cover">
                                        <span className="wb-gamehub-path-icon">{icon}</span>
                                        <span className={`wb-gamehub-path-status ${pct >= 100 ? 'done' : ''}`}>{status}</span>
                                    </div>
                                    <div className="wb-gamehub-path-body">
                                        <h3 className="wb-gamehub-path-title">{e.program?.name ?? 'Programme'}</h3>
                                        <div className="wb-gamehub-progress-head">
                                            <span>Campaign XP trail</span>
                                            <span>{Math.round(pct)}%</span>
                                        </div>
                                        <div className="wb-gamehub-progress-bar">
                                            <div className="wb-gamehub-progress-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                        <Link to={`/explore/${e.training_program_id}`} className="wb-gamehub-path-cta">
                                            {pct > 0 ? 'Continue campaign →' : 'Start campaign →'}
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="wb-gamehub-section">
                <h2 className="wb-gamehub-section-title">
                    <span className="wb-gamehub-section-icon">🏗️</span>
                    Build My Academy
                </h2>
                {published.length === 0 ? (
                    <div className="wb-gamehub-empty-slot">
                        <span className="wb-gamehub-empty-icon">✨</span>
                        <p>
                            {user?.name?.split(' ')[0] ?? 'Learner'}, forge a custom academy from your guidelines.
                        </p>
                        <Link to="/build-academy" className="btn wb-gamehub-btn-primary">Build one</Link>
                    </div>
                ) : (
                    <div className="wb-gamehub-list">
                        {published.map((a) => (
                            <div key={a.id} className="wb-gamehub-list-row">
                                <div className="wb-gamehub-list-icon">📜</div>
                                <div className="wb-gamehub-list-text">
                                    <div className="fw-bold">{a.title}</div>
                                    <div className="small text-muted">Personal curriculum from uploaded guidelines</div>
                                </div>
                                <Link to={`/my-academies/${a.id}/study`} className="btn btn-sm wb-gamehub-btn-outline">
                                    Study
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
