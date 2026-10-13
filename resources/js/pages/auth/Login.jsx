import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorAlert from '../../components/ui/ErrorAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login, isAuthenticated, loading, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!loading && isAuthenticated) {
        return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const session = await login(email, password);
            const admin = session.user?.role === 'admin';
            navigate(admin ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            heroTitle="Train like a professional AI evaluator"
            heroDescription="Practice response evaluation, get structured feedback, track your weaknesses, and measure readiness before real assessments."
            heroPoints={[
                'Rubric-based practice tasks',
                'Immediate structured feedback',
                'Readiness assessments',
            ]}
        >
            <h2 className="h4 fw-bold mb-1">Welcome back</h2>
            <p className="text-muted mb-0">Sign in to continue your training</p>

            <ErrorAlert error={error} onDismiss={() => setError(null)} className="mt-4" />

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="form-control wb-auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                    />
                </div>

                <PasswordInput
                    id="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="mb-4"
                />

                <button type="submit" className="btn wb-auth-btn w-100" disabled={submitting}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <p className="text-center text-muted small mt-4 mb-0">
                No account? <Link to="/register" className="fw-medium">Create one</Link>
            </p>
        </AuthLayout>
    );
}
