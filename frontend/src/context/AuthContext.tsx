import React, { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAuth();
    }, []);

    const loadAuth = async () => {
        try {
            const { value: storedToken } = await Preferences.get({ key: 'auth_token' });
            const { value: storedUser } = await Preferences.get({ key: 'auth_user' });

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Error loading auth state', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        await Preferences.set({ key: 'auth_token', value: newToken });
        await Preferences.set({ key: 'auth_user', value: JSON.stringify(newUser) });
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await Preferences.remove({ key: 'auth_token' });
        await Preferences.remove({ key: 'auth_user' });
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
