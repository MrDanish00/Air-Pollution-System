import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load user from local storage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserProfile(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/auth/user/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:8000/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Backend returns 'access' and 'refresh' (or refresh in cookie)
                const accessToken = data.access || data.key || data.access_token;
                const refreshToken = data.refresh || data.refresh_token;

                if (accessToken) {
                    localStorage.setItem('token', accessToken);
                    if (refreshToken) localStorage.setItem('refresh', refreshToken);
                    await fetchUserProfile(accessToken);
                    return { success: true };
                } else {
                    return { success: false, error: 'No access token received' };
                }
            } else {
                return { success: false, error: data.non_field_errors?.[0] || 'Login failed' };
            }
        } catch (error) {
            console.error('Login Error:', error);
            return { success: false, error: error.message === 'Failed to fetch' ? 'Unable to connect to server.' : 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
