import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSkills } from '../../api/progress';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import GamePageHero from '../../components/academy/GamePageHero';
import { useDefaultProject } from '../../hooks/useDefaultProject';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { formatLabel } from '../../utils/format';

const SKILL_ICONS = {
    consistency: '🔄',
    'decision-accuracy': '🎯',
    'evidence-evaluation': '🔍',
    'explanation-quality': '✍️',
    'factual-accuracy': '📊',
    'instruction-following': '📋',
};

function skillIcon(slug) {
    return SKILL_ICONS[slug] ?? '⚡';
}

function masteryTier(score) {
    if (score >= 80) return { label: 'Mastered', className: 'master' };
    if (score >= 60) return { label: 'Skilled', className: 'skilled' };
    if (score >= 40) return { label: 'Training', className: 'training' };
    return { label: 'Rookie', className: 'rookie' };
}

function trendClass(trend) {
    if (trend === 'improving') return 'up';
    if (trend === 'declining') return 'down';
    return 'flat';
}

export default function Skills() {
    const { stats: academy } = useAcademyStats();
    const { project, projectId, loading: projectLoading, error: projectError } = useDefaultProject();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        (async () => {
            try {
                setSkills(await fetchSkills(projectId));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [projectId]);

    const overview = useMemo(() => {
        if (!skills.length) return { avg: 0, mastered: 0 };
        const avg = skills.reduce((s, k) => s + k.mastery_score, 0) / skills.length;
        const mastered = skills.filter((k) => k.mastery_score >= 80).length;
        return { avg: Math.round(avg), mastered };
    }, [skills]);

    if (projectLoading || loading) return <LoadingState message="Loading skills…" />;
    if (projectError) return <ErrorAlert error={projectError} />;
    if (error) return <ErrorAlert error={error} />;

    return (
        <div className="wb-gamehub-page">
            <GamePageHero
                eyebrow="Stat sheet"
                title="Readiness & progress"
                subtitle={project?.name ?? 'Skill mastery from practice tasks and evaluations.'}
                stats={[
                    { value: `${overview.avg}%`, label: 'Avg mastery' },
                    { value: `${overview.mastered}/${skills.length}`, label: 'Mastered', variant: 'gold' },
                    { value: academy?.profile?.level ?? 1, label: 'Level' },
                ]}
            />

            {!skills.length ? (
                <EmptyState title="No skill data yet" description="Complete practice tasks to track your skills." />
            ) : (
                <div className="wb-gamehub-skill-grid">
                    {skills.map((skill) => {
                        const tier = masteryTier(skill.mastery_score);
                        const recent = Math.round(skill.recent_score);

                        return (
                            <article key={skill.slug} className={`wb-gamehub-skill-card tier-${tier.className}`}>
                                <div className="wb-gamehub-skill-header">
                                    <span className="wb-gamehub-skill-icon">{skillIcon(skill.slug)}</span>
                                    <div>
                                        <h2 className="wb-gamehub-skill-name">{skill.name}</h2>
                                        <span className={`wb-gamehub-skill-tier ${tier.className}`}>{tier.label}</span>
                                    </div>
                                    <div className="wb-gamehub-skill-score">
                                        <span className="wb-gamehub-skill-pct">{Math.round(skill.mastery_score)}%</span>
                                        <span className="wb-gamehub-skill-pct-label">Mastery</span>
                                    </div>
                                </div>
                                <p className="wb-gamehub-skill-desc">{skill.description}</p>
                                <div className="wb-gamehub-skill-meter">
                                    <div
                                        className={`wb-gamehub-skill-meter-fill ${tier.className}`}
                                        style={{ width: `${Math.min(100, skill.mastery_score)}%` }}
                                    />
                                </div>
                                <div className="wb-gamehub-skill-stats">
                                    <div>
                                        <strong>{skill.attempt_count}</strong>
                                        <span>Attempts</span>
                                    </div>
                                    <div>
                                        <strong>{skill.correct_count}</strong>
                                        <span>Correct</span>
                                    </div>
                                    <div>
                                        <strong>{recent}%</strong>
                                        <span>Recent</span>
                                    </div>
                                </div>
                                {skill.trend && (
                                    <span className={`wb-gamehub-trend ${trendClass(skill.trend)}`}>
                                        {formatLabel(skill.trend)}
                                    </span>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="wb-gamehub-tip-bar mt-4">
                <span>🎮</span>
                <p>
                    Boost stats in the <Link to="/practice-arena">Practice Arena</Link> or keep your campaign going in{' '}
                    <Link to="/explore">Explore Academy</Link>.
                </p>
            </div>
        </div>
    );
}
