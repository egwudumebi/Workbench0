import client from './client';

export const fetchProjects = async (page = 1) => {
    const { data } = await client.get('/projects', { params: { page } });
    return data;
};

export const fetchProject = async (id) => {
    const { data } = await client.get(`/projects/${id}`);
    return data.data;
};

export const fetchProjectLessons = async (projectId) => {
    const { data } = await client.get(`/projects/${projectId}/lessons`);
    return data.data;
};
