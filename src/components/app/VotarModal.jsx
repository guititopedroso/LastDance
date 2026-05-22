import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VotarModal.css';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColorByName = (name) => {
  if (!name) return 'hsl(0, 60%, 42%)';
  let hash = 0;
  const trimmed = name.trim();
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 42%)`;
};

const VotarModal = ({ categoria, currentNif, currentName, codigoEscola, onVotar, onClose }) => {
  const [votedName, setVotedName] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!votedName.trim()) return;
    
    const cleanVotedName = votedName.trim();
    if (currentName && cleanVotedName.toLowerCase() === currentName.toLowerCase()) {
      alert("Não podes votar em ti próprio.");
      return;
    }
    
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (!votedName.trim()) return;
    const cleanVotedName = votedName.trim();
    const normalizedNif = cleanVotedName.toLowerCase();
    await onVotar(normalizedNif, cleanVotedName);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="votar-modal glass-card"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ paddingBottom: '30px' }}
      >
        {/* Handle */}
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-categoria-tag">
              {categoria.emoji} {categoria.titulo}
            </div>
            <h2 className="modal-title">Votação por Nome</h2>
          </div>
          <button id="votar-modal-close" className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-vote-form" style={{ padding: '0 20px 10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group-simple" style={{ width: '100%' }}>
            <label htmlFor="vote-name-input" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Escreve o nome da pessoa em quem queres votar:
            </label>
            <input
              id="vote-name-input"
              type="text"
              placeholder="Nome Completo (Ex: João Silva)"
              value={votedName}
              onChange={e => setVotedName(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            id="votar-submit-btn"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: '800', fontSize: '1rem' }}
          >
            Votar 🗳️
          </button>
        </form>
      </motion.div>

      {/* Confirmation Sheet */}
      <AnimatePresence>
        {confirming && votedName.trim() && (
          <>
            <motion.div
              className="modal-backdrop"
              style={{ zIndex: 201 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(false)}
            />
            <motion.div
              className="confirm-sheet glass-card"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="modal-handle" />
              <div className="confirm-content">
                <div
                  className="confirm-avatar avatar avatar-xl"
                  style={{ backgroundColor: getAvatarColorByName(votedName) }}
                >
                  {getInitials(votedName)}
                </div>
                <h3 className="confirm-title">
                  Votar em <span className="text-rose">{votedName.trim()}</span>
                </h3>
                <p className="confirm-desc">
                  para a categoria <strong>{categoria.emoji} {categoria.titulo}</strong>?
                </p>
                <p className="confirm-warn">Esta ação não pode ser desfeita.</p>
                <div className="confirm-actions">
                  <button
                    id="confirm-votar-btn"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '1rem' }}
                    onClick={handleConfirm}
                  >
                    ✅ Confirmar Voto
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default VotarModal;
