import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const AppAuthContext = createContext(null);

const SESSION_KEY = 'ld_session';

const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('ld_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('ld_device_id', deviceId);
  }
  return deviceId;
};

const normalizeName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Removes accents
};

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
  const login = useCallback(async (fullName, schoolCode, schoolName) => {
    setLoading(true);
    setError(null);
    try {
      const deviceId = getOrCreateDeviceId();
      const codeUpper = schoolCode.toUpperCase();
      const nameClean = fullName.trim();
      const nameNorm = normalizeName(nameClean);

      // Check device association in Firestore
      const q = query(
        collection(db, "device_associations"), 
        where("deviceId", "==", deviceId),
        where("schoolCode", "==", codeUpper)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const association = querySnapshot.docs[0].data();
        const assocNameNorm = normalizeName(association.nomeAluno);
        
        if (assocNameNorm !== nameNorm) {
          setError(`Este telemóvel já está associado ao aluno "${association.nomeAluno}" nesta escola.`);
          return false;
        }
      } else {
        // Create new device association
        await addDoc(collection(db, "device_associations"), {
          deviceId,
          schoolCode: codeUpper,
          nomeAluno: nameClean,
          createdAt: new Date().toISOString()
        });
      }

      const session = {
        nif: "guest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5), // Identificador único gerado na hora
        nomeAluno: nameClean,
        turma: 'Geral',
        fotoPerfilURL: null,
        codigoEscola: codeUpper,
        nomeEscola: schoolName || codeUpper,
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
