import client from './client';

export const fetchAdminDashboard = async () => {
    const { data } = await client.get('/admin/dashboard');
    return data.data;
};

export const fetchAdminLearners = async (params = {}) => {
    const { data } = await client.get('/admin/learners', { params });
    return data;
};

export const fetchAdminLearner = async (id) => {
    const { data } = await client.get(`/admin/learners/${id}`);
    return data.data;
};

export const enrolAdminLearner = async (userId, trainingProgramId) => {
    const { data } = await client.post(`/admin/learners/${userId}/enrolments`, {
        training_program_id: trainingProgramId,
    });
    return data.data;
};

export const fetchAdminAchievements = async () => {
    const { data } = await client.get('/admin/achievements');
    return data.data;
};

export const updateAdminAchievement = async (id, payload) => {
    const { data } = await client.put(`/admin/achievements/${id}`, payload);
    return data.data;
};

export const fetchAdminPracticeChallenges = async (params = {}) => {
    const { data } = await client.get('/admin/practice-challenges', { params });
    return data;
};

export const createAdminPracticeChallenge = async (payload) => {
    const { data } = await client.post('/admin/practice-challenges', payload);
    return data.data;
};

export const updateAdminPracticeChallenge = async (id, payload) => {
    const { data } = await client.put(`/admin/practice-challenges/${id}`, payload);
    return data.data;
};

export const fetchAdminProjects = async (page = 1) => {
    const { data } = await client.get('/admin/projects', { params: { page } });
    return data;
};

export const createAdminProject = async (payload) => {
    const { data } = await client.post('/admin/projects', payload);
    return data.data;
};

export const fetchAdminProject = async (id) => {
    const { data } = await client.get(`/admin/projects/${id}`);
    return data.data;
};

export const updateAdminProject = async (id, payload) => {
    const { data } = await client.put(`/admin/projects/${id}`, payload);
    return data.data;
};

export const fetchAdminTaskTypes = async (projectId) => {
    const { data } = await client.get(`/admin/projects/${projectId}/task-types`);
    return data.data;
};

export const fetchAdminTasks = async (params = {}) => {
    const { data } = await client.get('/admin/tasks', { params });
    return data;
};

export const createAdminTask = async (payload) => {
    const { data } = await client.post('/admin/tasks', payload);
    return data.data;
};

export const fetchAdminTrainingPrograms = async () => {
    const { data } = await client.get('/admin/training-programs');
    return data.data;
};

export const fetchAdminTrainingProgram = async (id) => {
    const { data } = await client.get(`/admin/training-programs/${id}`);
    return data.data;
};

export const updateAdminTrainingProgram = async (id, payload) => {
    const { data } = await client.put(`/admin/training-programs/${id}`, payload);
    return data.data;
};

export const createAdminTrainingModule = async (programId, payload) => {
    const { data } = await client.post(`/admin/training-programs/${programId}/modules`, payload);
    return data.data;
};

export const updateAdminTrainingModule = async (moduleId, payload) => {
    const { data } = await client.put(`/admin/training-modules/${moduleId}`, payload);
    return data.data;
};

export const deleteAdminTrainingModule = async (moduleId) => {
    await client.delete(`/admin/training-modules/${moduleId}`);
};

export const createAdminLesson = async (moduleId, payload) => {
    const { data } = await client.post(`/admin/training-modules/${moduleId}/lessons`, payload);
    return data.data;
};

export const updateAdminLesson = async (lessonId, payload) => {
    const { data } = await client.put(`/admin/lessons/${lessonId}`, payload);
    return data.data;
};

export const deleteAdminLesson = async (lessonId) => {
    await client.delete(`/admin/lessons/${lessonId}`);
};

export const fetchAdminLesson = async (lessonId) => {
    const { data } = await client.get(`/admin/lessons/${lessonId}`);
    return data.data;
};

export const createAdminCheckpoint = async (lessonId, payload) => {
    const { data } = await client.post(`/admin/lessons/${lessonId}/checkpoints`, payload);
    return data.data;
};

export const updateAdminCheckpoint = async (checkpointId, payload) => {
    const { data } = await client.put(`/admin/video-checkpoints/${checkpointId}`, payload);
    return data.data;
};

export const deleteAdminCheckpoint = async (checkpointId) => {
    await client.delete(`/admin/video-checkpoints/${checkpointId}`);
};

export const upsertAdminLessonQuiz = async (lessonId, payload) => {
    const { data } = await client.put(`/admin/lessons/${lessonId}/quiz`, payload);
    return data.data;
};

export const createAdminQuizQuestion = async (quizId, payload) => {
    const { data } = await client.post(`/admin/lesson-quizzes/${quizId}/questions`, payload);
    return data.data;
};

export const updateAdminQuizQuestion = async (questionId, payload) => {
    const { data } = await client.put(`/admin/quiz-questions/${questionId}`, payload);
    return data.data;
};

export const deleteAdminQuizQuestion = async (questionId) => {
    await client.delete(`/admin/quiz-questions/${questionId}`);
};

export const unenrolAdminLearner = async (userId, enrolmentId) => {
    await client.delete(`/admin/learners/${userId}/enrolments/${enrolmentId}`);
};

export const fetchAdminAuditLogs = async ({ page = 1, search, actionFilter } = {}) => {
    const { data } = await client.get('/admin/audit-logs', {
        params: {
            page,
            search: search?.trim() || undefined,
            action_filter: actionFilter || undefined,
        },
    });
    return data;
};
