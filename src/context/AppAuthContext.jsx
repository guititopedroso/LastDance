import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, getStudentByNameAndSchool } from '../api/firebase';

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

  // Login: verifica registrations pelo Nome e Código de Escola no Firestore
  const login = useCallback(async (fullName, schoolCode) => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await getStudentByNameAndSchool(fullName, schoolCode);

      if (!studentData) {
        setError(`Inscrição não encontrada para o nome "${fullName}" na escola selecionada.`);
        return false;
      }

      const session = {
        nif: studentData.id, // Usar o ID da inscrição como identificador único 'nif' na App
        nomeAluno: `${studentData.firstName} ${studentData.lastName || ''}`.trim(),
        turma: studentData.turma || '',
        fotoPerfilURL: studentData.fotoPerfilURL || null,
        codigoEscola: schoolCode.toUpperCase(),
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao conectar. Verifica a tua ligação.');
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
