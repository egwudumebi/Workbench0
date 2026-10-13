import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPrograms } from '../../api/academy';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAcademyStats } from '../../context/AcademyStatsContext';

const DIFFICULTY_FILTERS = [
    { id: 'all', label: 'All ranks' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
];

const CAMPAIGN_THEMES = [
    { className: 'wb-explore-theme-indigo', icon: '🎓', rank: 'Campaign I' },
    { className: 'wb-explore-theme-teal', icon: '⚖️', rank: 'Campaign II' },
    { className: 'wb-explore-theme-amber', icon: '🧠', rank: 'Campaign III' },
    { className: 'wb-explore-theme-rose', icon: '🛡️', rank: 'Campaign IV' },
];

function themeForIndex(index) {
    return CAMPAIGN_THEMES[index % CAMPAIGN_THEMES.length];
}

function formatDifficulty(value) {
    if (!value) return 'All levels';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function formatSource(value) {
    if (!value) return null;
    return String(value).replace(/_/g, ' ');
}

export default function ExploreAcademy() {
    const { stats: academy } = useAcademyStats();
    const [programs, setPrograms] = useState([]);
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setPrograms(await fetchPrograms());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const enrolByProgram = useMemo(() => {
        const map = {};
        (academy?.enrolments ?? []).forEach((e) => {
            map[e.training_program_id] = e;
        });
        return map;
    }, [academy]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return programs.filter((p) => {
            if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
            if (!q) return true;
            return (
                p.name?.toLowerCase().includes(q)
                || p.description?.toLowerCase().includes(q)
                || (p.skills_covered ?? []).some((s) => String(s).toLowerCase().includes(q))
            );
        });
    }, [programs, search, difficulty]);

    const spotlight = useMemo(() => {
        if (search.trim() || difficulty !== 'all') return null;
        return programs.find((p) => p.featured) ?? programs[0] ?? null;
    }, [programs, search, difficulty]);

    const gridPrograms = useMemo(() => {
        if (!spotlight) return filtered;
        return filtered.filter((p) => p.id !== spotlight.id);
    }, [filtered, spotlight]);

    const enrolledCount = Object.keys(enrolByProgram).length;
    const profile = academy?.profile;

    return (
        <div className="wb-explore-page">
            <section className="wb-explore-hero">
                <div className="wb-explore-hero-glow" aria-hidden />
                <div className="wb-explore-hero-inner">
                    <div>
                        <p className="wb-explore-eyebrow">Mission select</p>
                        <h1 className="wb-explore-title">Explore Academy</h1>
                        <p className="wb-explore-sub">
                            Pick a training campaign — video lessons, checkpoints, and rubric-aligned skills reviewed by admins.
                        </p>
                    </div>
                    <div className="wb-explore-hero-stats">
                        <div className="wb-explore-stat">
                            <span className="wb-explore-stat-value">{programs.length || '—'}</span>
                            <span className="wb-explore-stat-label">Campaigns</span>
                        </div>
                        <div className="wb-explore-stat">
                            <span className="wb-explore-stat-value">{enrolledCount}</span>
                            <span className="wb-explore-stat-label">Enrolled</span>
                        </div>
                        {profile && (
                            <div className="wb-explore-stat wb-explore-stat-gold">
                                <span className="wb-explore-stat-value">Lv {profile.level}</span>
                                <span className="wb-explore-stat-label">{profile.xp} XP</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="wb-explore-toolbar">
                <div className="wb-explore-search-wrap">
                    <span className="wb-explore-search-icon" aria-hidden>🔍</span>
                    <input
                        className="wb-explore-search"
                        placeholder="Search campaigns, skills, or topics…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="wb-explore-filter-row">
                    {DIFFICULTY_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className={`wb-explore-filter ${difficulty === f.id ? 'active' : ''}`}
                            onClick={() => setDifficulty(f.id)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <LoadingState />
            ) : (
                <>
                    {spotlight && (
                        <SpotlightCampaign
                            program={spotlight}
                            theme={themeForIndex(programs.findIndex((p) => p.id === spotlight.id))}
                            enrolment={enrolByProgram[spotlight.id]}
                        />
                    )}

                    {gridPrograms.length > 0 && (
                        <h2 className="wb-explore-section-title">
                            {spotlight ? 'More campaigns' : 'All campaigns'}
                            <span className="wb-explore-section-count">{filtered.length}</span>
                        </h2>
                    )}

                    <div className="wb-explore-grid">
                        {gridPrograms.map((program, i) => {
                            const programIndex = programs.findIndex((p) => p.id === program.id);
                            return (
                                <CampaignCard
                                    key={program.id}
                                    program={program}
                                    theme={themeForIndex(programIndex >= 0 ? programIndex : i)}
                                    enrolment={enrolByProgram[program.id]}
                                />
                            );
                        })}
                    </div>

                    {!filtered.length && (
                        <div className="wb-explore-empty">
                            <span className="wb-explore-empty-icon">🗺️</span>
                            <p>No campaigns match your search. Try another keyword or rank.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function SpotlightCampaign({ program, theme, enrolment }) {
    const progress = enrolment?.progress_percent ?? 0;
    const enrolled = Boolean(enrolment);
    const source = formatSource(program.source_classification);

    return (
        <Link to={`/explore/${program.id}`} className={`wb-explore-spotlight ${theme.className}`}>
            <div className="wb-explore-spotlight-art">
                <span className="wb-explore-spotlight-icon">{theme.icon}</span>
                <span className="wb-explore-spotlight-glow" aria-hidden />
            </div>
            <div className="wb-explore-spotlight-body">
                <div className="wb-explore-spotlight-badges">
                    <span className="wb-explore-badge featured">Featured quest</span>
                    <span className="wb-explore-badge rank">{theme.rank}</span>
                    <span className="wb-explore-badge diff">{formatDifficulty(program.difficulty)}</span>
                </div>
                <h2 className="wb-explore-spotlight-title">{program.name}</h2>
                <p className="wb-explore-spotlight-desc">{program.description}</p>
                <div className="wb-explore-spotlight-meta">
                    <span>{program.estimated_hours}h</span>
                    <span>{program.modules_count ?? '—'} modules</span>
                    <span>{program.lessons_count ?? '—'} lessons</span>
                    {source && <span className="wb-explore-meta-muted">{source}</span>}
                </div>
                {enrolled && (
                    <div className="wb-explore-progress-block">
                        <div className="wb-explore-progress-head">
                            <span>Campaign progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="wb-explore-progress-bar">
                            <div className="wb-explore-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                        </div>
                    </div>
                )}
                <span className="wb-explore-spotlight-cta">
                    {enrolled ? 'Continue campaign →' : 'Enter campaign →'}
                </span>
            </div>
        </Link>
    );
}

function CampaignCard({ program, theme, enrolment }) {
    const progress = enrolment?.progress_percent ?? 0;
    const enrolled = Boolean(enrolment);
    const source = formatSource(program.source_classification);

    return (
        <Link to={`/explore/${program.id}`} className={`wb-explore-card ${theme.className}`}>
            <div className="wb-explore-card-cover">
                <span className="wb-explore-card-icon">{theme.icon}</span>
                {program.featured && <span className="wb-explore-card-featured">Featured</span>}
            </div>
            <div className="wb-explore-card-body">
                <div className="wb-explore-card-tags">
                    <span className="wb-explore-badge diff">{formatDifficulty(program.difficulty)}</span>
                    {enrolled && (
                        <span className="wb-explore-badge enrolled">
                            {progress > 0 ? 'In progress' : 'Enrolled'}
                        </span>
                    )}
                </div>
                <h3 className="wb-explore-card-title">{program.name}</h3>
                <p className="wb-explore-card-desc">{program.description}</p>
                <div className="wb-explore-card-meta">
                    <span>⏱ {program.estimated_hours}h</span>
                    <span>📚 {program.lessons_count ?? '—'} lessons</span>
                </div>
                {source && <div className="wb-explore-card-source">{source}</div>}
                {enrolled && (
                    <div className="wb-explore-progress-bar compact">
                        <div className="wb-explore-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                )}
                <span className="wb-explore-card-cta">
                    {enrolled ? 'Continue →' : 'View programme →'}
                </span>
            </div>
        </Link>
    );
}
