import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../api/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

  // Login: verifica alunos/{codigoEscola}/lista/{nif} no Firestore
  const login = useCallback(async (nif, codigoEscola) => {
    setLoading(true);
    setError(null);
    try {
      const cleanNif = nif.trim();
      const cleanCode = codigoEscola.trim().toUpperCase();

      const alunoRef = doc(db, 'alunos', cleanCode, 'lista', cleanNif);
      const alunoSnap = await getDoc(alunoRef);

      if (!alunoSnap.exists()) {
        setError('NIF não encontrado neste evento.');
        return false;
      }

      const data = alunoSnap.data();
      const session = {
        nif: cleanNif,
        nomeAluno: data.nomeAluno || 'Aluno',
        turma: data.turma || '',
        fotoPerfilURL: data.fotoPerfilURL || null,
        codigoEscola: cleanCode,
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
