import React, { createContext, useState, useEffect } from 'react';
import API from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      // Check for 'access' key
      const token = localStorage.getItem('access');
      if (token) {
        try {
          const res = await API.get('/profile/');
          if (res.data && res.data.user) {
            setUser(res.data.user);
          } else {
            setUser(res.data);
          }
        } catch (err) {
          console.error("Token verification failed", err);
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await API.post('/login/', { username, password });
      
      // Save tokens using 'access' and 'refresh'
      if (res.data.access) {
        localStorage.setItem('access', res.data.access);
      }
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }

      if (res.data.user) {
        setUser(res.data.user);
      } else {
        // Fallback: fetch profile
        const profileRes = await API.get('/profile/');
        setUser(profileRes.data.user || profileRes.data);
      }
      
      return res.data;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const register = async (formData) => {
    await API.post('/register/', formData);
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};