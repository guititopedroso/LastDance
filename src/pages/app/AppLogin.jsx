import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '../../context/AppAuthContext';
import './AppLogin.css';

const AppLogin = () => {
  const [nif, setNif] = useState('');
  const [codigoEscola, setCodigoEscola] = useState('');
  const { login, loading, error, clearError } = useAppAuth();
  const navigate = useNavigate();

  const handleNifChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setNif(val);
    if (error) clearError();
  };

  const handleCodeChange = (e) => {
    setCodigoEscola(e.target.value.toUpperCase());
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nif.length !== 9) return;
    const ok = await login(nif, codigoEscola);
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
          >
            <span>LD</span>
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
            <label className="input-label" htmlFor="nif-input">NIF</label>
            <input
              id="nif-input"
              className="input-field"
              type="tel"
              inputMode="numeric"
              placeholder="Ex: 123456789"
              value={nif}
              onChange={handleNifChange}
              maxLength={9}
              required
              autoComplete="off"
            />
            <span className="input-hint">{nif.length}/9 dígitos</span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="code-input">Código do Evento</label>
            <input
              id="code-input"
              className="input-field"
              type="text"
              placeholder="Ex: ESC2025"
              value={codigoEscola}
              onChange={handleCodeChange}
              required
              autoComplete="off"
              autoCapitalize="characters"
            />
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
            disabled={loading || nif.length !== 9 || !codigoEscola}
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
