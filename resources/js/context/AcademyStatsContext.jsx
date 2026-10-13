import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchAcademyDashboard } from '../api/academy';
import { useAuth } from './AuthContext';

const AcademyStatsContext = createContext(null);

export function AcademyStatsProvider({ children }) {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user) {
            setStats(null);
            setLoading(false);
            return;
        }
        try {
            setStats(await fetchAcademyDashboard());
        } catch {
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setLoading(true);
        refresh();
    }, [refresh]);

    const value = { stats, loading, refresh };

    return (
        <AcademyStatsContext.Provider value={value}>
            {children}
        </AcademyStatsContext.Provider>
    );
}

export function useAcademyStats() {
    return useContext(AcademyStatsContext);
}
