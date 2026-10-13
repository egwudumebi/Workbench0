import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';

function HeartIcon() {
    return (
        <svg className="wb-footer-heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    );
}

export default function SiteFooter() {
    return (
        <footer className="wb-site-footer">
            <div className="wb-footer-watermark" aria-hidden="true">workbench0</div>

            <div className="wb-footer-inner">
                <div className="wb-footer-main">
                    <div>
                        <div className="wb-footer-label">AI Response Evaluation</div>
                        <h2 className="wb-footer-heading">
                            Train smarter. Evaluate with confidence.
                        </h2>
                        <Link to="/register" className="wb-landing-cta-pill">
                            Get Started
                        </Link>
                    </div>

                    <div className="wb-footer-columns">
                        <div className="wb-footer-col">
                            <div className="wb-footer-col-title">Platform</div>
                            <Link to="/login">Sign In</Link>
                            <Link to="/register">Register</Link>
                            <Link to="/login">Dashboard</Link>
                        </div>
                        <div className="wb-footer-col">
                            <div className="wb-footer-col-title">Training</div>
                            <Link to="/register">Practice Tasks</Link>
                            <Link to="/register">Lessons</Link>
                            <Link to="/register">Assessments</Link>
                        </div>
                        <div className="wb-footer-col">
                            <div className="wb-footer-col-title">About</div>
                            <a href="https://aelurahq.com" target="_blank" rel="noopener noreferrer">
                                Aelura Solutions
                            </a>
                        </div>
                    </div>
                </div>

                <div className="wb-footer-bottom">
                    <Logo size="sm" className="wb-footer-brand-bold" />
                    <span className="wb-footer-credit">
                        made with love
                        <HeartIcon />
                        <a href="https://aelurahq.com" target="_blank" rel="noopener noreferrer">
                            Aelura Solutions LTD
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
