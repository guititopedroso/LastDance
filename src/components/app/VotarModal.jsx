import React, { useState, useEffect } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  const filteredOptions = (categoria.opcoes || []).filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Centered Modal Wrapper */}
      <div className="modal-wrapper">
        {/* Modal */}
        <motion.div
          className="votar-modal glass-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ paddingBottom: '30px' }}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <div className="modal-categoria-tag">
                {categoria.emoji} {categoria.titulo}
              </div>
              <h2 className="modal-title">
                {categoria.tipo === 'opcoes' ? 'Escolha uma Opção' : 'Votação por Nome'}
              </h2>
            </div>
            <button id="votar-modal-close" className="btn btn-icon" onClick={onClose}>✕</button>
          </div>

          {categoria.tipo === 'opcoes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Search Bar */}
              <div className="modal-search" style={{ margin: '0 20px 8px' }}>
                <span className="modal-search-icon">🔍</span>
                <input
                  type="text"
                  className="modal-search-input"
                  placeholder="Pesquisar opção..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Options List */}
              <div className="modal-list" style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredOptions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Nenhuma opção encontrada
                  </p>
                ) : (
                  filteredOptions.map(opt => {
                    const isMe = currentName && opt.toLowerCase() === currentName.toLowerCase();
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`aluno-item ${isMe ? 'aluno-item--me' : ''}`}
                        disabled={isMe}
                        onClick={() => {
                          setVotedName(opt);
                          setConfirming(true);
                        }}
                      >
                        <div 
                          className="aluno-avatar avatar" 
                          style={{ 
                            backgroundColor: getAvatarColorByName(opt),
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '0.85rem'
                          }}
                        >
                          {getInitials(opt)}
                        </div>
                        <div className="aluno-info">
                          <span className="aluno-name">{opt}</span>
                          {isMe && <span className="aluno-turma">(Não podes votar em ti próprio)</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Form */
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
          )}
        </motion.div>
      </div>

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
            <div className="modal-wrapper" style={{ zIndex: 202 }}>
              <motion.div
                className="confirm-sheet glass-card"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
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
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default VotarModal;
