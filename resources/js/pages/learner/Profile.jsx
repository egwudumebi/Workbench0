import { useEffect, useState } from 'react';
import { fetchLearnerProfile, updateLearnerProfile } from '../../api/academy';
import GamePageHero from '../../components/academy/GamePageHero';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingState from '../../components/ui/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useAcademyStats } from '../../context/AcademyStatsContext';
import { levelTitle } from '../../utils/levelTitles';
import { learnerDisplayName, learnerInitials } from '../../utils/learnerIdentity';

export default function Profile() {
    const { user: authUser } = useAuth();
    const { refresh: refreshAcademyStats } = useAcademyStats();
    const [data, setData] = useState(null);
    const [prefs, setPrefs] = useState({ daily_reminder: false, display_name: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await fetchLearnerProfile();
                setData(response);
                setPrefs({
                    daily_reminder: response.profile.preferences?.daily_reminder ?? false,
                    display_name: response.profile.preferences?.display_name ?? '',
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await updateLearnerProfile({ preferences: prefs });
            await refreshAcademyStats();
            setSaved(true);
        } catch (err) {
            setError(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;
    if (!data) return null;

    const profile = data.profile;
    const xpFloor = profile.level_xp_floor ?? 0;
    const xpCeiling = profile.level_xp_ceiling ?? xpFloor + 200;
    const xpSpan = Math.max(1, xpCeiling - xpFloor);
    const xpPct = Math.min(100, ((profile.xp - xpFloor) / xpSpan) * 100);
    const displayName = learnerDisplayName(authUser, { profile: { preferences: prefs } });

    return (
        <div className="wb-gamehub-page">
            <GamePageHero
                eyebrow="Player card"
                title="Profile & preferences"
                subtitle="Your evaluator identity, streak, and learning settings."
                stats={[
                    { value: `Lv ${profile.level}`, label: levelTitle(profile.level), variant: 'gold' },
                    { value: profile.xp, label: 'XP' },
                    { value: `${profile.streak_days}🔥`, label: 'Streak', variant: 'fire' },
                ]}
            />

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="wb-gamehub-player-card">
                        <div className="wb-gamehub-player-banner" aria-hidden />
                        <div className="wb-gamehub-player-avatar">
                            {learnerInitials(displayName, data.user.email)}
                        </div>
                        <h2 className="wb-gamehub-player-name">{displayName}</h2>
                        <p className="wb-gamehub-player-email">{data.user.email}</p>
                        {authUser?.email?.includes('demo') && (
                            <span className="wb-gamehub-demo-badge">Demo Account</span>
                        )}
                        <div className="wb-gamehub-level-block">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="wb-gamehub-level-badge">Level {profile.level}</span>
                                <span className="small fw-semibold text-muted">{levelTitle(profile.level)}</span>
                            </div>
                            <div className="wb-gamehub-progress-bar">
                                <div className="wb-gamehub-progress-fill gold" style={{ width: `${xpPct}%` }} />
                            </div>
                            <div className="wb-gamehub-xp-labels">
                                <span>{profile.xp.toLocaleString()} XP</span>
                                <span>{xpCeiling.toLocaleString()} XP to Lv {profile.level + 1}</span>
                            </div>
                        </div>
                        <div className="wb-gamehub-player-stats">
                            <div>
                                <strong>{profile.streak_days}</strong>
                                <span>Day streak</span>
                            </div>
                            <div>
                                <strong>{profile.xp_to_next_level}</strong>
                                <span>XP to next</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-7">
                    <form onSubmit={handleSave} className="wb-gamehub-panel">
                        <h2 className="wb-gamehub-panel-title">Loadout — preferences</h2>
                        <p className="wb-gamehub-panel-sub">Tune reminders and how you appear in Workbench0.</p>
                        <div className="mb-3">
                            <label className="wb-gamehub-field-label">Display name (optional)</label>
                            <input
                                className="form-control wb-gamehub-input"
                                value={prefs.display_name}
                                onChange={(e) => setPrefs({ ...prefs, display_name: e.target.value })}
                            />
                        </div>
                        <label className="wb-gamehub-toggle">
                            <input
                                type="checkbox"
                                checked={prefs.daily_reminder}
                                onChange={(e) => setPrefs({ ...prefs, daily_reminder: e.target.checked })}
                            />
                            <span className="wb-gamehub-toggle-ui" />
                            <span>Remind me to practice daily (demo preference)</span>
                        </label>
                        <div className="d-flex align-items-center gap-2 mt-4">
                            <button type="submit" className="btn wb-gamehub-btn-primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Save loadout'}
                            </button>
                            {saved && <span className="text-success small fw-semibold">Saved ✓</span>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
