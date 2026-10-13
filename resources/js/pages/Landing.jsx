import { Link, Navigate } from 'react-router-dom';
import Logo from '../components/brand/Logo';
import SiteFooter from '../components/layout/SiteFooter';
import { useAuth } from '../context/AuthContext';

const trainingLoopSteps = [
    { title: 'Read lessons', tag: 'Learn', icon: '📖' },
    { title: 'Practice tasks', tag: 'Practice', icon: '🎯' },
    { title: 'Receive feedback', tag: 'Correct', icon: '💬' },
    { title: 'Track weaknesses', tag: 'Adapt', icon: '📊' },
    { title: 'Pass assessment', tag: 'Ready', icon: '🏁' },
];

const features = [
    {
        title: 'Structured Practice',
        description: 'Work through original AI response evaluation tasks with immediate, rubric-based feedback after every submission.',
    },
    {
        title: 'Skill Tracking',
        description: 'Monitor mastery across factual accuracy, reasoning, instruction following, and explanation quality over time.',
    },
    {
        title: 'Adaptive Training',
        description: 'The system targets your weak areas automatically — more tasks where you struggle, less where you excel.',
    },
    {
        title: 'Readiness Assessments',
        description: 'Simulated timed assessments measure whether you are ready before you attempt real evaluation work.',
    },
];

export default function Landing() {
    const { isAuthenticated, loading } = useAuth();

    if (!loading && isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="wb-landing">
            <header className="wb-landing-header">
                <div className="wb-landing-header-inner">
                    <Logo to="/" size="md" className="wb-landing-logo" />

                    <nav className="wb-landing-nav">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <Link to="/login">Sign In</Link>
                    </nav>

                    <Link to="/register" className="wb-landing-cta-pill">
                        Get Started
                    </Link>
                </div>
            </header>

            <section className="wb-landing-hero">
                <div className="wb-landing-hero-visual" aria-hidden="true">
                    <picture>
                        <source srcSet="/brand/hero-algorithm.webp" type="image/webp" />
                        <img
                            src="/brand/hero-algorithm.png"
                            alt=""
                            className="wb-landing-hero-bg"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </picture>
                </div>
                <div className="wb-landing-hero-overlay" aria-hidden="true" />
                <div className="wb-landing-hero-inner">
                    <p className="wb-landing-eyebrow">Practice smarter. Evaluate better.</p>
                    <h1 className="wb-landing-hero-title">
                        Evaluate AI.<br />
                        Master the art of <span className="accent">response quality.</span>
                    </h1>
                    <p className="wb-landing-hero-desc">
                        Workbench0 trains you to evaluate AI-generated responses accurately,
                        consistently, and according to defined criteria — before the real assessment.
                    </p>
                    <div className="wb-landing-hero-actions">
                        <Link to="/register" className="wb-landing-btn-white">
                            Start Training
                            <span className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28, fontSize: 14 }}>→</span>
                        </Link>
                        <Link to="/login" className="wb-landing-btn-outline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            <section id="features" className="wb-landing-features">
                <p className="wb-landing-features-label">Why Workbench0</p>
                <h2 className="wb-landing-features-title">
                    Everything you need to become a sharp AI evaluator
                </h2>
                <div className="row g-4">
                    {features.map((feature) => (
                        <div key={feature.title} className="col-md-6 col-lg-3">
                            <div className="wb-landing-feature-card">
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="how-it-works" className="wb-landing-loop">
                <div className="wb-landing-loop-intro">
                    <p className="wb-landing-features-label">The training loop</p>
                    <h2 className="wb-landing-loop-title">
                        A living cycle — not a straight checklist
                    </h2>
                    <p className="wb-landing-loop-lede">
                        Each lap through the loop sharpens your evaluator instincts. Workbench0 keeps you
                        moving around the circuit with feedback, skill tracking, and readiness gates.
                    </p>
                    <div className="wb-landing-loop-pills" aria-hidden>
                        {trainingLoopSteps.map((step) => (
                            <span key={step.tag} className="wb-landing-loop-pill">{step.tag}</span>
                        ))}
                    </div>
                </div>

                <div className="wb-landing-loop-stage">
                    <svg className="wb-landing-loop-svg" viewBox="0 0 1100 220" preserveAspectRatio="none" aria-hidden>
                        <path
                            d="M 24 110 C 180 24, 320 24, 420 110 S 680 196, 820 110 S 980 24, 1076 110"
                            className="wb-landing-loop-path-bg"
                        />
                        <path
                            d="M 24 110 C 180 24, 320 24, 420 110 S 680 196, 820 110 S 980 24, 1076 110"
                            className="wb-landing-loop-path-flow"
                        />
                    </svg>

                    <div className="wb-landing-loop-nodes">
                        {trainingLoopSteps.map((step, i) => (
                            <article
                                key={step.title}
                                className="wb-landing-loop-node"
                                style={{ '--step-i': i, '--step-lift': `${[0, 32, 56, 32, 0][i]}px` }}
                            >
                                <div className="wb-landing-loop-node-orbit" aria-hidden />
                                <div className="wb-landing-loop-node-card">
                                    <span className="wb-landing-loop-node-tag">{step.tag}</span>
                                    <span className="wb-landing-loop-node-icon" aria-hidden>{step.icon}</span>
                                    <span className="wb-landing-loop-node-num">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <h3 className="wb-landing-loop-node-title">{step.title}</h3>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
}
