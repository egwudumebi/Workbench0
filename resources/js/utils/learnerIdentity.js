export function learnerDisplayName(authUser, academyStats) {
    const custom = academyStats?.profile?.preferences?.display_name?.trim();
    if (custom) {
        return custom;
    }
    return authUser?.name?.trim() || 'Learner';
}

export function learnerInitials(displayName, email) {
    const name = displayName?.trim();
    if (name) {
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    return (email ?? '??').slice(0, 2).toUpperCase();
}

export function learnerFirstName(displayName) {
    const first = displayName?.trim().split(/\s+/)[0];
    return first || 'Learner';
}
