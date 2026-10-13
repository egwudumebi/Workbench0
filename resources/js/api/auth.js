import client, { setToken } from './client';

export const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    setToken(data.data.token);
    return data.data;
};

export const register = async (name, email, password, password_confirmation) => {
    const { data } = await client.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation,
    });
    setToken(data.data.token);
    return data.data;
};

export const logout = async () => {
    try {
        await client.post('/auth/logout');
    } finally {
        setToken(null);
    }
};

export const fetchMe = async () => {
    const { data } = await client.get('/auth/me');
    return data.data;
};
