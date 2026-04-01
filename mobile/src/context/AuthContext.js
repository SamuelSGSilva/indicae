import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('indicae_user_id');
        const storedUserName = await SecureStore.getItemAsync('indicae_user_name');
        
        if (storedUserId) {
          setUser({
            id: Number(storedUserId),
            name: storedUserName
          });
        }
      } catch (e) {
        console.error("Error loading user context", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('indicae_user_id', String(userData.id));
    await SecureStore.setItemAsync('indicae_user_name', userData.name);
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('indicae_user_id');
    await SecureStore.deleteItemAsync('indicae_user_name');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
