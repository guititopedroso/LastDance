import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../api/firebase';

const AppAuthContext = createContext(null);

const SESSION_KEY = 'ld_session';

export const AppAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login: Permite entrar diretamente na App sem verificar se está inscrito na base de dados
  const login = useCallback(async (fullName, schoolCode) => {
    setLoading(true);
    setError(null);
    try {
      const session = {
        nif: "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5), // Identificador único gerado na hora
        nomeAluno: fullName.trim(),
        turma: 'Geral',
        fotoPerfilURL: null,
        codigoEscola: schoolCode.toUpperCase(),
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao ligar. Tenta novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AppAuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AppAuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within AppAuthProvider');
  return ctx;
};

export default AppAuthContext;
