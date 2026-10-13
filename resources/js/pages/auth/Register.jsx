import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import ErrorAlert from '../../components/ui/ErrorAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
    const { register, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!loading && isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await register(form.name, form.email, form.password, form.password_confirmation);
            navigate('/dashboard');
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            heroTitle="Start building evaluator skills today"
            heroDescription="Create a free account to access lessons, practice tasks, skill tracking, and simulated assessments."
            heroPoints={[
                'Original evaluation tasks',
                'Adaptive skill training',
                'Progress and readiness tracking',
            ]}
        >
            <h2 className="h4 fw-bold mb-1">Create account</h2>
            <p className="text-muted mb-0">Join Workbench0 to start training</p>

            <ErrorAlert error={error} onDismiss={() => setError(null)} className="mt-4" />

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-medium">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="form-control wb-auth-input"
                        value={form.name}
                        onChange={update('name')}
                        required
                        autoComplete="name"
                        placeholder="Your name"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="form-control wb-auth-input"
                        value={form.email}
                        onChange={update('email')}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                    />
                </div>

                <PasswordInput
                    id="password"
                    label="Password"
                    value={form.password}
                    onChange={update('password')}
                    required
                    autoComplete="new-password"
                />

                <PasswordInput
                    id="password_confirmation"
                    label="Confirm password"
                    value={form.password_confirmation}
                    onChange={update('password_confirmation')}
                    required
                    autoComplete="new-password"
                    className="mb-4"
                />

                <button type="submit" className="btn wb-auth-btn w-100" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            <p className="text-center text-muted small mt-4 mb-0">
                Already have an account? <Link to="/login" className="fw-medium">Sign in</Link>
            </p>
        </AuthLayout>
    );
}
