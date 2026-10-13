export default function XpProgressRing({ level, xp, xpToNext, streakDays, size = 120 }) {
    const levels = [0, 200, 500, 900, 1400, 2000, 2700, 3500];
    const currentThreshold = levels[level - 1] ?? 0;
    const nextThreshold = levels[level] ?? currentThreshold + xpToNext;
    const span = Math.max(1, nextThreshold - currentThreshold);
    const progress = xpToNext === 0 ? 1 : Math.min(1, (xp - currentThreshold) / span);
    const circumference = 2 * Math.PI * 42;
    const offset = circumference * (1 - progress);

    return (
        <div className="wb-xp-ring" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="wb-xp-ring-svg" aria-hidden>
                <circle cx="50" cy="50" r="42" className="wb-xp-ring-track" />
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="wb-xp-ring-fill"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="wb-xp-ring-center">
                <div className="wb-xp-ring-level">LV {level}</div>
                <div className="wb-xp-ring-xp">{xp} XP</div>
            </div>
            {streakDays > 0 && (
                <div className="wb-streak-pill" title="Learning streak">
                    <span className="wb-streak-flame" aria-hidden>🔥</span>
                    {streakDays}
                </div>
            )}
        </div>
    );
}
