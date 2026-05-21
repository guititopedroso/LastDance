import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VotarModal.css';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (nif) => {
  const n = parseInt(nif, 10);
  const hue = isNaN(n) ? 0 : n % 360;
  return `hsl(${n}, 60%, 42%)`;
};

const VotarModal = ({ categoria, currentNif, codigoEscola, loadAlunos, onVotar, onClose }) => {
  const [alunos, setAlunos] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlunos().then(data => {
      setAlunos(data);
      setLoading(false);
    });
  }, []);

  const filtered = alunos.filter(a =>
    a.nomeAluno?.toLowerCase().includes(search.toLowerCase()) ||
    (a.turma && a.turma.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (aluno) => {
    if (aluno.nif === currentNif) return;
    setSelected(aluno);
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    await onVotar(selected.nif, selected.nomeAluno);
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
      >
        {/* Handle */}
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-categoria-tag">
              {categoria.emoji} {categoria.titulo}
            </div>
            <h2 className="modal-title">Escolhe quem queres votar</h2>
          </div>
          <button id="votar-modal-close" className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div className="modal-search">
          <span className="modal-search-icon">🔍</span>
          <input
            id="votar-search-input"
            type="text"
            className="modal-search-input"
            placeholder="Pesquisar por nome ou turma..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* List */}
        <div className="modal-list">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>Sem resultados</h3>
              <p>Tenta outro nome ou turma.</p>
            </div>
          ) : (
            filtered.map((aluno) => {
              const isMe = aluno.nif === currentNif;
              return (
                <motion.button
                  key={aluno.nif}
                  id={`aluno-item-${aluno.nif}`}
                  className={`aluno-item ${isMe ? 'aluno-item--me' : ''}`}
                  onClick={() => handleSelect(aluno)}
                  disabled={isMe}
                  whileHover={!isMe ? { scale: 1.02 } : {}}
                  whileTap={!isMe ? { scale: 0.98 } : {}}
                >
                  <div
                    className="aluno-avatar avatar avatar-md"
                    style={{ backgroundColor: getAvatarColor(aluno.nif) }}
                  >
                    {getInitials(aluno.nomeAluno)}
                  </div>
                  <div className="aluno-info">
                    <span className="aluno-name">{aluno.nomeAluno}</span>
                    {aluno.turma && <span className="aluno-turma">{aluno.turma}</span>}
                  </div>
                  {isMe && <span className="aluno-me-tag">És tu!</span>}
                </motion.button>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Confirmation Sheet */}
      <AnimatePresence>
        {confirming && selected && (
          <>
            <motion.div
              className="modal-backdrop"
              style={{ zIndex: 201 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setConfirming(false); setSelected(null); }}
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
                  style={{ backgroundColor: getAvatarColor(selected.nif) }}
                >
                  {getInitials(selected.nomeAluno)}
                </div>
                <h3 className="confirm-title">
                  Votar em <span className="text-rose">{selected.nomeAluno}</span>
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
                    onClick={() => { setConfirming(false); setSelected(null); }}
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
