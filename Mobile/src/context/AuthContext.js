import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        setToken(t);
      } catch (e) {
        setToken(null);
      }
    };
    load();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (e) {}
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
