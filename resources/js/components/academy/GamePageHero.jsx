export default function GamePageHero({ eyebrow, title, subtitle, stats }) {
    return (
        <section className="wb-gamehub-hero">
            <div className="wb-gamehub-hero-glow" aria-hidden />
            <div className="wb-gamehub-hero-inner">
                <div>
                    {eyebrow && <p className="wb-gamehub-eyebrow">{eyebrow}</p>}
                    <h1 className="wb-gamehub-title">{title}</h1>
                    {subtitle && <p className="wb-gamehub-sub">{subtitle}</p>}
                </div>
                {stats?.length > 0 && (
                    <div className="wb-gamehub-hero-stats">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className={`wb-gamehub-stat ${stat.variant ? `wb-gamehub-stat-${stat.variant}` : ''}`}
                            >
                                <span className="wb-gamehub-stat-value">{stat.value}</span>
                                <span className="wb-gamehub-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
