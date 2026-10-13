import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const me = await authApi.fetchMe();
            setUser(me);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const result = await authApi.login(email, password);
        setUser(result.user);
        return result;
    };

    const register = async (name, email, password, passwordConfirmation) => {
        const result = await authApi.register(name, email, password, passwordConfirmation);
        setUser(result.user);
        return result;
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            login,
            register,
            logout,
            refreshUser: loadUser,
        }),
        [user, loading, loadUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
