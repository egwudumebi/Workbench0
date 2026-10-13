import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Link } from 'react-router-dom';

const STATUS = {
    locked: 'locked',
    available: 'available',
    in_progress: 'in_progress',
    completed: 'completed',
};

const LESSON_XP = 50;
const SEGMENTS = 4;

function waveOffset(index) {
    return Math.sin(index * 0.85) * 36;
}

function resolveNodeStatus(lessonId, lessonProgress, index, orderedLessons) {
    const saved = lessonProgress[lessonId];
    if (saved === 'completed') return STATUS.completed;
    if (saved === 'in_progress') return STATUS.in_progress;

    if (index === 0) return STATUS.available;

    const prev = orderedLessons[index - 1];
    const prevStatus = lessonProgress[prev.id];
    if (prevStatus === 'completed') return STATUS.available;

    return STATUS.locked;
}

function segmentFill(status) {
    if (status === STATUS.completed) return SEGMENTS;
    if (status === STATUS.in_progress) return 2;
    if (status === STATUS.available) return 1;
    return 0;
}

function buildPathSegments(points, nodes) {
    const segments = [];
    for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        if (!a || !b) continue;

        const mx = (a.x + b.x) / 2;
        const dy = (b.y - a.y) * 0.15;
        const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${mx.toFixed(1)} ${(a.y + dy).toFixed(1)}, ${mx.toFixed(1)} ${(b.y - dy).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;

        let cleared = false;
        if (i === 1) {
            cleared = nodes[0]?.status !== STATUS.locked;
        } else {
            cleared = nodes[i - 2]?.status === STATUS.completed;
        }

        segments.push({ d, cleared, index: i - 1, fromHub: i === 1 });
    }
    return segments;
}

function SkillCard({
    node,
    lessonLinkPrefix,
    isFocus,
    isHovered,
    onHover,
    onLeave,
}) {
    const filled = segmentFill(node.status);
    const mastered = node.status === STATUS.completed;
    const active = node.status === STATUS.in_progress
        || (node.status === STATUS.available && isFocus);
    const locked = node.status === STATUS.locked;

    const cardClass = [
        'wb-path-skill-card',
        mastered ? 'mastered' : '',
        active ? 'active' : '',
        locked ? 'locked' : '',
        isHovered ? 'hover' : '',
        isFocus ? 'focus' : '',
    ].filter(Boolean).join(' ');

    const summary = node.summary ?? node.moduleTitle ?? 'Build evaluator skills step by step.';

    const body = (
        <>
            <div className="wb-path-skill-head">
                <span className="wb-path-skill-head-icon" aria-hidden>📖</span>
                <span className="wb-path-skill-badge">Skill</span>
                {mastered && <span className="wb-path-skill-spark" aria-hidden>✨</span>}
            </div>
            <div className="wb-path-skill-body">
                <h3 className="wb-path-skill-title">{node.title}</h3>
                <p className="wb-path-skill-desc">{summary}</p>
                <div className="wb-path-skill-meta">
                    {node.estimated_minutes ? <span>{node.estimated_minutes} min</span> : null}
                    <span>Lesson {node.index + 1}</span>
                </div>
                <div className="wb-path-skill-segments" aria-hidden>
                    {Array.from({ length: SEGMENTS }).map((_, si) => (
                        <span key={si} className={si < filled ? 'on' : ''} />
                    ))}
                </div>
                <div className="wb-path-skill-foot">
                    {mastered ? (
                        <span className="wb-path-skill-btn mastered">🏆 Mastered</span>
                    ) : locked ? (
                        <span className="wb-path-skill-btn locked">🔒 Locked</span>
                    ) : (
                        <span className="wb-path-skill-btn continue">▸ Continue</span>
                    )}
                    <span className="wb-path-skill-xp">{mastered ? LESSON_XP + 70 : LESSON_XP}</span>
                </div>
            </div>
        </>
    );

    if (locked) {
        return (
            <div
                className={cardClass}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
            >
                {body}
            </div>
        );
    }

    return (
        <Link
            to={`${lessonLinkPrefix}/${node.id}`}
            className={`${cardClass} text-decoration-none`}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            {body}
        </Link>
    );
}

export default function LearningMap({
    modules = [],
    lessonProgress = {},
    lessonLinkPrefix = '/academy-lessons',
    compact = false,
    continueLessonId = null,
}) {
    const [hoveredId, setHoveredId] = useState(null);
    const [pathSegments, setPathSegments] = useState([]);
    const [trackSize, setTrackSize] = useState({ width: 0, height: 0 });

    const pathGradientId = useId().replace(/:/g, '');
    const scrollRef = useRef(null);
    const trackRef = useRef(null);
    const hubRef = useRef(null);
    const cardRefs = useRef([]);

    const { nodes, moduleLabels } = useMemo(() => {
        const flat = [];
        const labels = [];

        modules.forEach((module, moduleIndex) => {
            const lessons = module.lessons ?? [];
            if (lessons.length) {
                labels.push({ moduleIndex, title: module.title, startIndex: flat.length });
            }
            lessons.forEach((lesson) => {
                flat.push({ ...lesson, moduleTitle: module.title, moduleIndex });
            });
        });

        const withStatus = flat.map((lesson, index) => ({
            ...lesson,
            status: resolveNodeStatus(lesson.id, lessonProgress, index, flat),
            index,
        }));

        return { nodes: withStatus, moduleLabels: labels };
    }, [modules, lessonProgress]);

    const completedCount = nodes.filter((n) => n.status === STATUS.completed).length;
    const progressPct = nodes.length ? Math.round((completedCount / nodes.length) * 100) : 0;
    const focusId = continueLessonId
        ?? nodes.find((n) => n.status === STATUS.in_progress)?.id
        ?? nodes.find((n) => n.status === STATUS.available)?.id;

    const firstLessonId = nodes[0]?.id;
    const journeyStarted = completedCount > 0
        || nodes.some((n) => n.status === STATUS.in_progress);

    const measurePaths = useCallback(() => {
        const track = trackRef.current;
        if (!track || !nodes.length) {
            setPathSegments([]);
            return;
        }

        const trackRect = track.getBoundingClientRect();
        setTrackSize({ width: trackRect.width, height: trackRect.height });

        const anchor = (el, selector) => {
            if (!el) return null;
            const target = selector ? el.querySelector(selector) : el;
            if (!target) return null;
            const r = target.getBoundingClientRect();
            return {
                x: r.left + r.width / 2 - trackRect.left,
                y: r.top + r.height / 2 - trackRect.top,
            };
        };

        const hubPoint = anchor(hubRef.current, '.wb-path-hub-ring');
        const cardPoints = cardRefs.current.map((el) => anchor(el, '.wb-path-skill-card'));

        const points = hubPoint ? [hubPoint, ...cardPoints] : cardPoints;

        setPathSegments(buildPathSegments(points.filter(Boolean), nodes));
    }, [nodes]);

    useLayoutEffect(() => {
        measurePaths();
        const track = trackRef.current;
        if (!track) return undefined;

        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(measurePaths);
        });
        observer.observe(track);

        return () => observer.disconnect();
    }, [measurePaths]);

    useEffect(() => {
        const onResize = () => window.requestAnimationFrame(measurePaths);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [measurePaths]);

    useEffect(() => {
        if (!focusId || !scrollRef.current) return undefined;

        const focusIndex = nodes.findIndex((n) => n.id === focusId);
        const wrap = cardRefs.current[focusIndex];
        if (!wrap) return undefined;

        const timer = window.setTimeout(() => {
            wrap.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 150);

        return () => window.clearTimeout(timer);
    }, [focusId, nodes]);

    if (!nodes.length) {
        return <p className="text-muted mb-0">No lessons on this map yet.</p>;
    }

    const hubTarget = focusId && firstLessonId
        ? `${lessonLinkPrefix}/${journeyStarted ? focusId : firstLessonId}`
        : firstLessonId
            ? `${lessonLinkPrefix}/${firstLessonId}`
            : '#';

    return (
        <div className={`wb-game-map wb-game-map-journey ${compact ? 'wb-game-map-compact' : ''}`}>
            <div className="wb-game-map-toolbar">
                <div>
                    <div className="wb-game-map-title">Learning path</div>
                    <div className="wb-game-map-sub">
                        {completedCount} / {nodes.length} skills mastered on this map
                    </div>
                </div>
                <div className="wb-game-map-toolbar-end">
                    <div className="wb-game-map-progress-wrap">
                        <div className="wb-game-map-progress-bar">
                            <div
                                className="wb-game-map-progress-fill"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="wb-game-map-progress-label">{progressPct}%</span>
                    </div>
                    {focusId && (
                        <Link to={`${lessonLinkPrefix}/${focusId}`} className="wb-game-map-play-btn">
                            Play next →
                        </Link>
                    )}
                </div>
            </div>

            <div className="wb-game-map-legend">
                <span><i className="wb-map-dot completed" /> Mastered</span>
                <span><i className="wb-map-dot current" /> In progress</span>
                <span><i className="wb-map-dot available" /> Ready</span>
                <span><i className="wb-map-dot locked" /> Locked</span>
            </div>

            <div className="wb-game-map-scroll" ref={scrollRef}>
                <div
                    className="wb-game-map-track wb-path-track"
                    ref={trackRef}
                >
                    {trackSize.width > 0 && pathSegments.length > 0 && (
                        <svg
                            className="wb-map-paths"
                            width={trackSize.width}
                            height={trackSize.height}
                            aria-hidden
                        >
                            <defs>
                                <linearGradient id={pathGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="50%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                            {pathSegments.map((seg) => (
                                <path
                                    key={`path-${seg.index}`}
                                    d={seg.d}
                                    className={`wb-map-path-journey ${seg.cleared ? 'cleared' : ''}`}
                                    style={seg.cleared ? { stroke: `url(#${pathGradientId})` } : undefined}
                                    markerEnd="url(#wb-path-arrow)"
                                />
                            ))}
                            <marker
                                id="wb-path-arrow"
                                markerWidth="8"
                                markerHeight="8"
                                refX="6"
                                refY="4"
                                orient="auto"
                            >
                                <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
                            </marker>
                        </svg>
                    )}

                    <div className="wb-path-hub-wrap" ref={hubRef}>
                        <Link to={hubTarget} className="wb-path-hub">
                            <span className="wb-path-hub-orbit" aria-hidden />
                            <span className="wb-path-hub-ring">
                                <span className="wb-path-hub-icon" aria-hidden>📘</span>
                                <span className="wb-path-hub-label">Begin your journey</span>
                                <span className="wb-path-hub-cta">Start here</span>
                            </span>
                        </Link>
                    </div>

                    {nodes.map((node, i) => {
                        const isFocus = focusId === node.id;
                        const isHovered = hoveredId === node.id;
                        const yWave = waveOffset(i);
                        const zone = moduleLabels.find((l) => l.startIndex === i);

                        return (
                            <div
                                key={node.id ?? node.slug ?? i}
                                className="wb-path-card-wrap"
                                ref={(el) => {
                                    cardRefs.current[i] = el;
                                }}
                                style={{ transform: `translateY(${yWave}px)` }}
                            >
                                {zone && (
                                    <div className="wb-path-zone-label">{zone.title}</div>
                                )}
                                <SkillCard
                                    node={node}
                                    lessonLinkPrefix={lessonLinkPrefix}
                                    isFocus={isFocus}
                                    isHovered={isHovered}
                                    onHover={() => setHoveredId(node.id)}
                                    onLeave={() => setHoveredId(null)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
