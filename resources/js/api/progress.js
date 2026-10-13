import client from './client';

export const fetchDashboard = async (projectId) => {
    const { data } = await client.get('/me/dashboard', { params: { project_id: projectId } });
    return data.data;
};

export const fetchSkills = async (projectId) => {
    const { data } = await client.get('/me/skills', { params: { project_id: projectId } });
    return data.data;
};

export const fetchMistakes = async (projectId, page = 1) => {
    const { data } = await client.get('/me/mistakes', {
        params: { project_id: projectId, page },
    });
    return data;
};
