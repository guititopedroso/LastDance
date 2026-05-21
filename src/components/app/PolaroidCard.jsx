import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PolaroidCard.css';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (nif) => {
  const num = parseInt(nif, 10);
  const hue = isNaN(num) ? 0 : num % 360;
  return `hsl(${hue}, 65%, 42%)`;
};

const PolaroidCard = ({ memory, index, currentStudentNif, onDelete, onReport }) => {
  const { id, nomeAluno, nif, fotoURL, storagePath, legenda, emoji, timestamp } = memory;
  const [showConfirm, setShowConfirm] = useState(false);

  // Deterministic rotation from id
  const seed = id ? parseInt(String(id).slice(-4), 16) || index : index;
  const rotation = (seed % 11) - 5; // –5° to +5°

  const sizes = ['polaroid-sm', 'polaroid-md', 'polaroid-lg'];
  const sizeClass = sizes[index % 3];

  const isOwner = String(currentStudentNif) === String(nif);

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      className={`polaroid-card ${sizeClass}`}
      initial={{ y: -60, opacity: 0, rotate: rotation }}
      animate={{ y: 0, opacity: 1, rotate: rotation }}
      exit={{ y: -100, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 100, damping: 14, delay: index * 0.04 }}
      whileHover={{ scale: 1.07, rotate: 0, zIndex: 20, boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
      whileTap={{ scale: 0.96 }}
      style={{ '--rot': `${rotation}deg` }}
    >
      {/* Confirm delete overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="polaroid-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <p>Apagar este polaroid?</p>
            <div className="polaroid-confirm-btns">
              <button
                className="polaroid-btn-delete"
                onClick={e => { e.stopPropagation(); onDelete(id, storagePath); setShowConfirm(false); }}
              >
                Eliminar
              </button>
              <button
                className="polaroid-btn-cancel"
                onClick={e => { e.stopPropagation(); setShowConfirm(false); }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo */}
      <div className="polaroid-photo">
        <img src={fotoURL} alt={`Momento de ${nomeAluno}`} loading="lazy" />
        {emoji && <span className="polaroid-emoji">{emoji}</span>}
        {/* Avatar badge */}
        <div
          className="polaroid-avatar"
          style={{ backgroundColor: getAvatarColor(nif) }}
          title={nomeAluno}
        >
          {getInitials(nomeAluno)}
        </div>
      </div>

      {/* Caption */}
      <div className="polaroid-body">
        <span className="polaroid-name font-caveat">{nomeAluno}</span>
        {legenda && <p className="polaroid-caption font-caveat">{legenda}</p>}
        <div className="polaroid-footer">
          {timestamp && <span className="polaroid-time">{formatDate(timestamp)}</span>}
          <div className="polaroid-actions">
            {isOwner ? (
              <button
                className="polaroid-action-btn"
                onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
                title="Eliminar"
              >
                🗑️
              </button>
            ) : (
              <button
                className="polaroid-action-btn"
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm('Reportar esta fotografia por conteúdo inadequado?')) {
                    onReport(id);
                  }
                }}
                title="Reportar"
              >
                🚩
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PolaroidCard;
