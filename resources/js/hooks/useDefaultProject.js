import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProjects } from '../api/projects';
import { selectDefaultProject, setStoredProjectId } from '../utils/projectSelection';

export function useDefaultProject() {
    const [searchParams] = useSearchParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const paramId = searchParams.get('project');

        (async () => {
            try {
                const response = await fetchProjects();
                if (!cancelled) {
                    const selected = selectDefaultProject(response.data, paramId);
                    setProject(selected);
                    if (selected) {
                        setStoredProjectId(selected.id);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message ?? 'Failed to load projects.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    return { project, projectId: project?.id, loading, error };
}
