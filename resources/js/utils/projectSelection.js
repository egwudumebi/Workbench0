const STORAGE_KEY = 'workbench0:selectedProjectId';

export function getStoredProjectId() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setStoredProjectId(projectId) {
    if (!projectId) return;
    try {
        localStorage.setItem(STORAGE_KEY, String(projectId));
    } catch {
        // ignore storage failures
    }
}

export function selectDefaultProject(projects, preferredId = null) {
    if (!projects?.length) return null;

    const storedId = preferredId ?? getStoredProjectId();
    if (storedId) {
        const stored = projects.find((p) => String(p.id) === String(storedId));
        if (stored) return stored;
    }

    const template = projects.find((p) => p.slug === 'ai-response-evaluation');
    return template ?? projects[0];
}
