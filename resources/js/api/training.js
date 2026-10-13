import client from './client';

export const startSession = async (projectId) => {
    const { data } = await client.post('/training/sessions', { project_id: projectId });
    return data.data;
};

export const fetchNextTask = async (projectId) => {
    const { data } = await client.get('/training/next-task', { params: { project_id: projectId } });
    return data;
};

export const submitTask = async (taskVersionId, payload) => {
    const { data } = await client.post(`/training/tasks/${taskVersionId}/submit`, payload);
    return data.data;
};

export const fetchHistory = async (page = 1) => {
    const { data } = await client.get('/training/history', { params: { page } });
    return data;
};
