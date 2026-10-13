import client from './client';

export const fetchAcademyDashboard = async () => {
    const { data } = await client.get('/me/academy-dashboard');
    return data.data;
};

export const fetchPrograms = async (params = {}) => {
    const { data } = await client.get('/programs', { params });
    return data.data;
};

export const fetchProgram = async (id) => {
    const { data } = await client.get(`/programs/${id}`);
    return data.data;
};

export const fetchProgramProgress = async (id) => {
    const { data } = await client.get(`/programs/${id}/progress`);
    return data.data;
};

export const fetchLearnerProfile = async () => {
    const { data } = await client.get('/me/profile');
    return data.data;
};

export const updateLearnerProfile = async (payload) => {
    const { data } = await client.put('/me/profile', payload);
    return data.data;
};

export const fetchAssessmentIntegrityRules = async () => {
    const { data } = await client.get('/integrity/assessment');
    return data.data;
};

export const fetchAssessmentIntegrityStatus = async () => {
    const { data } = await client.get('/integrity/assessment/status');
    return data.data;
};

export const acknowledgeAssessmentIntegrity = async () => {
    const { data } = await client.post('/integrity/assessment/acknowledge', { acknowledged: true });
    return data.data;
};

export const fetchAcademyCurriculum = async (academyId) => {
    const { data } = await client.get(`/my-academies/${academyId}/curriculum`);
    return data.data;
};

export const enrolProgram = async (id) => {
    const { data } = await client.post(`/programs/${id}/enrol`);
    return data.data;
};

export const fetchAcademyLesson = async (id) => {
    const { data } = await client.get(`/academy-lessons/${id}`);
    return data.data;
};

export const updateLessonProgress = async (id, payload) => {
    const { data } = await client.post(`/academy-lessons/${id}/progress`, payload);
    return data.data;
};

export const submitCheckpoint = async (id, answer) => {
    const { data } = await client.post(`/checkpoints/${id}/submit`, { answer });
    return data.data;
};

export const submitQuiz = async (id, answers) => {
    const { data } = await client.post(`/quizzes/${id}/submit`, { answers });
    return data.data;
};

export const fetchPracticeChallenges = async (params = {}) => {
    const { data } = await client.get('/practice-arena/challenges', { params });
    return data.data;
};

export const fetchPracticeChallenge = async (id) => {
    const { data } = await client.get(`/practice-arena/challenges/${id}`);
    return data.data;
};

export const submitPracticeChallenge = async (id, submission) => {
    const { data } = await client.post(`/practice-arena/challenges/${id}/submit`, { submission });
    return data.data;
};

export const fetchMyAcademies = async () => {
    const { data } = await client.get('/my-academies');
    return data.data;
};

export const createMyAcademy = async (payload) => {
    const { data } = await client.post('/my-academies', payload);
    return data.data;
};

export const fetchMyAcademy = async (id) => {
    const { data } = await client.get(`/my-academies/${id}`);
    return data.data;
};

export const uploadGuidelineDocument = async (id, formData) => {
    const { data } = await client.post(`/my-academies/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

export const generateAcademyCurriculum = async (id) => {
    const { data } = await client.post(`/my-academies/${id}/generate`);
    return data.data;
};

export const publishMyAcademy = async (id) => {
    const { data } = await client.post(`/my-academies/${id}/publish`);
    return data.data;
};
