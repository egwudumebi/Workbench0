import { Navigate, useLocation } from 'react-router-dom';
import LoadingState from './ui/LoadingState';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../api/client';

export default function ProtectedRoute({ children, adminOnly = false, learnerOnly = false }) {
    const { user, loading, isAdmin } = useAuth();
    const location = useLocation();
    const hasToken = getToken();

    if (loading) {
        return <LoadingState message="Checking authentication…" />;
    }

    if (!hasToken || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (learnerOnly && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return children;
}
