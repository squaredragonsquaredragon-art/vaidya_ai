import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('vaidya_user');
    const savedToken = localStorage.getItem('vaidya_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('vaidya_user');
        localStorage.removeItem('vaidya_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('vaidya_token', access_token);
    localStorage.setItem('vaidya_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name) => {
    const response = await authAPI.register({ email, password, full_name });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('vaidya_token', access_token);
    localStorage.setItem('vaidya_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('vaidya_token');
    localStorage.removeItem('vaidya_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
