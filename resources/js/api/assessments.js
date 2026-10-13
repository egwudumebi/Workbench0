import client from './client';

export const fetchCurrentAssessment = async (projectId) => {
    const { data } = await client.get('/assessments/current', { params: { project_id: projectId } });
    return data.data;
};

export const createAssessment = async (projectId) => {
    const { data } = await client.post('/assessments', { project_id: projectId });
    return data.data;
};

export const fetchAssessment = async (id) => {
    const { data } = await client.get(`/assessments/${id}`);
    return data.data;
};

export const submitAssessmentTask = async (assessmentId, taskVersionId, payload) => {
    const { data } = await client.post(
        `/assessments/${assessmentId}/tasks/${taskVersionId}/submit`,
        payload,
    );
    return data.data;
};

export const finalizeAssessment = async (id) => {
    const { data } = await client.post(`/assessments/${id}/finalize`);
    return data.data;
};

export const fetchAssessmentResult = async (id) => {
    const { data } = await client.get(`/assessments/${id}/result`);
    return data.data;
};
