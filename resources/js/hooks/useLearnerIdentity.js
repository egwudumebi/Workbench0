import { useMemo } from 'react';
import { useAcademyStats } from '../context/AcademyStatsContext';
import { useAuth } from '../context/AuthContext';
import { learnerDisplayName, learnerFirstName, learnerInitials } from '../utils/learnerIdentity';

export function useLearnerIdentity() {
    const { user } = useAuth();
    const { stats } = useAcademyStats();

    return useMemo(() => {
        const displayName = learnerDisplayName(user, stats);
        return {
            displayName,
            firstName: learnerFirstName(displayName),
            initials: learnerInitials(displayName, user?.email),
            email: user?.email,
        };
    }, [user, stats]);
}
