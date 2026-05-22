import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '../../context/AppAuthContext';
import { getAllCodes } from '../../api/firebase';
import './AppLogin.css';

const AppLogin = () => {
  const [fullName, setFullName] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');
  const { login, loading, error, clearError } = useAppAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsData = await getAllCodes();
        setSchools(schoolsData);
      } catch (err) {
        console.error("Error loading schools:", err);
      }
    };
    fetchSchools();
  }, []);

  const handleNameChange = (e) => {
    setFullName(e.target.value);
    if (error) clearError();
  };

  const handleSchoolChange = (e) => {
    setSelectedSchoolCode(e.target.value);
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !selectedSchoolCode) return;
    const ok = await login(fullName, selectedSchoolCode);
    if (ok) navigate('/app', { replace: true });
  };

  return (
    <div className="login-page">
      {/* Background decorations */}
      <div className="login-bg-glow" />
      <div className="login-bg-grid" />

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Logo & Brand */}
        <div className="login-brand">
          <motion.div
            className="login-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            style={{ background: 'transparent', boxShadow: 'none' }}
          >
            <img src="/logo_transparent.webp" alt="Last Dance" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="login-title">LastDance App</h1>
            <p className="login-subtitle">A tua festa, as tuas memórias.</p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.form
          className="login-form glass-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="form-title">Entrar</h2>

          <div className="input-group">
            <label className="input-label" htmlFor="name-input">Nome Completo</label>
            <input
              id="name-input"
              className="input-field"
              type="text"
              placeholder="Ex: João Silva"
              value={fullName}
              onChange={handleNameChange}
              required
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="school-select">Escola</label>
            <select
              id="school-select"
              className="input-field"
              value={selectedSchoolCode}
              onChange={handleSchoolChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                outline: 'none',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: '#111' }}>Selecionar Escola...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.code} style={{ background: '#111' }}>{s.schoolName}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            id="login-btn"
            className="btn btn-primary login-btn"
            disabled={loading || !fullName.trim() || !selectedSchoolCode}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Entrar na Festa 🎉'
            )}
          </button>
        </motion.form>

        <p className="login-footer">
          Não consegues entrar? Fala com os organizadores.
        </p>
      </motion.div>
    </div>
  );
};

export default AppLogin;
