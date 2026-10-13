import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';

export default function AuthLayout({ heroTitle, heroDescription, heroPoints = [], children }) {
    return (
        <div className="wb-auth-page">
            <aside className="wb-auth-hero" aria-hidden="false">
                <div className="wb-auth-hero-overlay" aria-hidden="true" />
                <div className="wb-auth-hero-content">
                    <Logo variant="light" size="lg" className="mb-4" />
                    <h1>{heroTitle}</h1>
                    <p>{heroDescription}</p>
                    {heroPoints.length > 0 && (
                        <ul className="wb-auth-hero-points">
                            {heroPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>

            <div className="wb-auth-form-wrap">
                <div className="wb-auth-form-inner">
                    <div className="wb-auth-card">
                        <div className="wb-auth-card-header">
                            <Logo to="/" size="md" className="mb-3" />
                            {children}
                        </div>
                    </div>

                    <p className="wb-auth-back-home text-center d-lg-none">
                        <Link to="/">← Back to home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
