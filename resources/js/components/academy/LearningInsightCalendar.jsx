import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function monthGrid(year, month) {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, i) => {
        const cell = new Date(start);
        cell.setDate(start.getDate() + i);
        return cell;
    });
}

function formatMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatDayLabel(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });
}

function activityLevel(activity) {
    if (!activity) return 0;
    return Math.min(3, activity.events + (activity.types?.length ?? 0));
}

export default function LearningInsightCalendar({ calendar, exploreLink }) {
    const today = useMemo(() => new Date(), []);
    const todayKey = dateKey(today);

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedKey, setSelectedKey] = useState(todayKey);

    const activityByDate = calendar?.activity_by_date ?? {};
    const streakSet = useMemo(
        () => new Set(calendar?.streak_dates ?? []),
        [calendar?.streak_dates],
    );
    const insights = calendar?.insights;

    const cells = useMemo(
        () => monthGrid(viewYear, viewMonth),
        [viewYear, viewMonth],
    );

    const selectedActivity = activityByDate[selectedKey];
    const isStreakDay = streakSet.has(selectedKey);

    const shiftMonth = (delta) => {
        const next = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    const weeklyPct = insights
        ? Math.min(100, Math.round((insights.active_this_week / insights.weekly_goal) * 100))
        : 0;

    return (
        <div className="wb-hub-calendar">
            <div className="wb-hub-calendar-head">
                <div>
                    <h3 className="wb-hub-calendar-title">
                        {calendar?.program_name ?? 'Learning path'} — activity calendar
                    </h3>
                    <p className="wb-hub-calendar-sub">Tap a day to see lessons, practice, and streak insights.</p>
                </div>
                <div className="wb-hub-calendar-nav">
                    <button type="button" className="wb-hub-calendar-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                        ‹
                    </button>
                    <span className="wb-hub-calendar-month">{formatMonthLabel(viewYear, viewMonth)}</span>
                    <button type="button" className="wb-hub-calendar-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
                        ›
                    </button>
                </div>
            </div>

            <div className="row g-3 wb-hub-calendar-body">
                <div className="col-lg-8">
                    <div className="wb-hub-calendar-grid-wrap">
                        <div className="wb-hub-calendar-weekdays">
                            {WEEKDAYS.map((d) => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                        <div className="wb-hub-calendar-grid">
                            {cells.map((cell) => {
                                const key = dateKey(cell);
                                const inMonth = cell.getMonth() === viewMonth;
                                const activity = activityByDate[key];
                                const level = activityLevel(activity);
                                const isToday = key === todayKey;
                                const isSelected = key === selectedKey;
                                const streak = streakSet.has(key);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        className={[
                                            'wb-hub-calendar-day',
                                            !inMonth ? 'muted' : '',
                                            level > 0 ? `heat-${level}` : '',
                                            streak ? 'streak' : '',
                                            isToday ? 'today' : '',
                                            isSelected ? 'selected' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => setSelectedKey(key)}
                                    >
                                        <span className="wb-hub-calendar-day-num">{cell.getDate()}</span>
                                        {level > 0 && (
                                            <span className="wb-hub-calendar-dots">
                                                {activity.types?.includes('lesson') && <i className="lesson" />}
                                                {activity.types?.includes('practice') && <i className="practice" />}
                                            </span>
                                        )}
                                        {streak && <span className="wb-hub-calendar-streak-mark" aria-hidden>🔥</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="wb-hub-calendar-legend">
                            <span><i className="dot lesson" /> Lesson</span>
                            <span><i className="dot practice" /> Practice</span>
                            <span><i className="dot streak" /> Streak</span>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4 wb-hub-calendar-insight-col">
                    <div className="wb-hub-calendar-insight">
                        <div className="wb-hub-calendar-insight-top">
                            <div className="wb-hub-calendar-insight-date">{formatDayLabel(selectedKey)}</div>
                            {isStreakDay && <span className="wb-hub-calendar-insight-streak">🔥 Streak</span>}
                        </div>

                        <div className="wb-hub-calendar-chips">
                            {selectedActivity ? (
                                <>
                                    <span className="wb-hub-calendar-chip">
                                        <em>Sessions</em> {selectedActivity.events}
                                    </span>
                                    {selectedActivity.xp > 0 && (
                                        <span className="wb-hub-calendar-chip gold">
                                            <em>XP</em> +{selectedActivity.xp}
                                        </span>
                                    )}
                                    {selectedActivity.types?.includes('lesson') && (
                                        <span className="wb-hub-calendar-chip lesson">Lesson</span>
                                    )}
                                    {selectedActivity.types?.includes('practice') && (
                                        <span className="wb-hub-calendar-chip practice">Practice</span>
                                    )}
                                </>
                            ) : (
                                <span className="wb-hub-calendar-chip muted">
                                    {isStreakDay ? 'Streak day' : 'No activity logged'}
                                </span>
                            )}
                        </div>

                        {insights && (
                            <div className="wb-hub-calendar-weekly">
                                <div className="wb-hub-calendar-weekly-head">
                                    <span>Weekly rhythm</span>
                                    <span>{insights.active_this_week}/{insights.weekly_goal}</span>
                                </div>
                                <div className="wb-hub-xp-bar compact">
                                    <div className="wb-hub-xp-bar-fill" style={{ width: `${weeklyPct}%` }} />
                                </div>
                                <p className="wb-hub-calendar-tip">{insights.message}</p>
                            </div>
                        )}

                        {exploreLink && (
                            <Link to={exploreLink} className="wb-hub-calendar-map-link">
                                Open programme map →
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
