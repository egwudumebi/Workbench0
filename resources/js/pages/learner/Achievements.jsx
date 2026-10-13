import { useEffect, useMemo, useState } from 'react';
import { fetchAcademyDashboard } from '../../api/academy';
import GamePageHero from '../../components/academy/GamePageHero';
import LoadingState from '../../components/ui/LoadingState';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { formatDate } from '../../utils/format';
import {
    achievementIcon,
    achievementProgressLabel,
    achievementProgressPercent,
} from '../../utils/achievementMeta';

export default function Achievements() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        (async () => {
            try {
                setData(await fetchAcademyDashboard());
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const achievements = data?.achievements ?? [];
    const earnedCount = achievements.filter((a) => a.earned_at).length;

    const filtered = useMemo(() => {
        if (filter === 'earned') return achievements.filter((a) => a.earned_at);
        if (filter === 'locked') return achievements.filter((a) => !a.earned_at);
        return achievements;
    }, [achievements, filter]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div className="wb-gamehub-page">
            <GamePageHero
                eyebrow="Trophy room"
                title="Achievements"
                subtitle="Unlocked by real lessons, practice wins, and XP — never fabricated progress."
                stats={[
                    { value: `${earnedCount}/${achievements.length}`, label: 'Unlocked', variant: 'gold' },
                    { value: data?.profile?.xp ?? 0, label: 'Total XP' },
                    { value: data?.profile?.level ?? 1, label: 'Level' },
                ]}
            />

            <div className="wb-gamehub-filter-row mb-3">
                {[
                    { id: 'all', label: 'All badges' },
                    { id: 'earned', label: 'Unlocked' },
                    { id: 'locked', label: 'Locked' },
                ].map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className={`wb-gamehub-filter ${filter === f.id ? 'active' : ''}`}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="wb-gamehub-badge-grid">
                {filtered.map((a) => {
                    const earned = Boolean(a.earned_at);
                    const pct = achievementProgressPercent(a);

                    return (
                        <article
                            key={a.slug}
                            className={`wb-gamehub-badge-card ${earned ? 'is-earned' : 'is-locked'}`}
                        >
                            <div className="wb-gamehub-badge-medallion">
                                <span className="wb-gamehub-badge-icon">{achievementIcon(a.slug)}</span>
                                {!earned && <span className="wb-gamehub-badge-lock" aria-hidden>🔒</span>}
                            </div>
                            <h3 className="wb-gamehub-badge-name">{a.name}</h3>
                            <p className="wb-gamehub-badge-desc">{a.description}</p>
                            {!earned && (
                                <div className="wb-gamehub-badge-progress">
                                    <div className="wb-gamehub-progress-head">
                                        <span>Progress</span>
                                        <span>{achievementProgressLabel(a)}</span>
                                    </div>
                                    <div className="wb-gamehub-progress-bar compact">
                                        <div className="wb-gamehub-progress-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="wb-gamehub-badge-footer">
                                {earned ? (
                                    <span className="wb-gamehub-badge-tag earned">Earned {formatDate(a.earned_at)}</span>
                                ) : (
                                    <span className="wb-gamehub-badge-tag locked">Locked</span>
                                )}
                                {a.xp_reward > 0 && (
                                    <span className="wb-gamehub-xp-chip">+{a.xp_reward} XP</span>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
