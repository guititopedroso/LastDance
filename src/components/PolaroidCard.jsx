import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Trash2, AlertTriangle } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const PolaroidCard = ({ memory, index, currentStudentNif, onDelete, onReport }) => {
  const { id, nomeAluno, nif, fotoURL, legenda, emoji, timestamp } = memory;
  const [showConfirm, setShowConfirm] = useState(false);

  // Deterministic random rotation: seed is last 4 characters of memory ID
  const idStr = id ? String(id) : '';
  const parsedSeed = idStr ? parseInt(idStr.slice(-4), 16) : index;
  const seed = isNaN(parsedSeed) ? index : parsedSeed;
  const rotation = (seed % 13) - 6; // Values between -6deg and +6deg

  // Size variation (alternating 3 sizes by index)
  const sizes = ['polaroid-size-sm', 'polaroid-size-md', 'polaroid-size-lg'];
  const sizeClass = sizes[index % 3];

  // Deterministic avatar HSL color based on student NIF
  const numericNif = nif ? parseInt(nif, 10) : 0;
  const hue = isNaN(numericNif) ? 0 : numericNif % 360;
  const avatarStyle = {
    backgroundColor: `hsl(${hue}, 70%, 45%)`,
    color: '#fff'
  };

  const isOwner = String(currentStudentNif) === String(nif);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    if (window.confirm("Queres denunciar esta fotografia por conteúdo inadequado?")) {
      onReport(id);
    }
  };

  return (
    <motion.div
      className={`polaroid-card ${sizeClass}`}
      initial={{ y: -80, opacity: 0, rotate: rotation }}
      animate={{ y: 0, opacity: 1, rotate: rotation }}
      exit={{ y: -120, opacity: 0, scale: 0.8, rotate: rotation + 5 }}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 15, 
        delay: index * 0.05 
      }}
      whileHover={{ 
        scale: 1.08, 
        rotate: 0, 
        zIndex: 10,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Confirm Delete Overlay inside the card */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            className="polaroid-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent triggering card interactions
          >
            <div className="confirm-content">
              <AlertTriangle className="confirm-icon" size={28} />
              <h4>Apagar Polaroid?</h4>
              <p>Esta ação não poderá ser desfeita.</p>
              <div className="confirm-buttons">
                <button 
                  type="button"
                  className="btn-confirm-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id, fotoURL);
                    setShowConfirm(false);
                  }}
                >
                  Eliminar
                </button>
                <button 
                  type="button"
                  className="btn-confirm-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Wrapper */}
      <div className="polaroid-image-container">
        <img src={fotoURL} alt={`Momento de ${nomeAluno}`} loading="lazy" />
        
        {/* Mood Emoji Overlay */}
        {emoji && (
          <div className="polaroid-emoji-tag">
            {emoji}
          </div>
        )}

        {/* Circular Avatar in Top Right */}
        <div className="polaroid-avatar-badge" style={avatarStyle} title={nomeAluno}>
          {getInitials(nomeAluno)}
        </div>
      </div>

      {/* Hand-written text area */}
      <div className="polaroid-content">
        <h4 className="polaroid-student-name">{nomeAluno}</h4>
        {legenda && <p className="polaroid-caption">{legenda}</p>}
        
        {/* Actions Area */}
        <div className="polaroid-actions">
          {isOwner ? (
            <button 
              className="btn-action-delete" 
              onClick={handleDeleteClick}
              title="Eliminar Polaroid"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <button 
              className="btn-action-report" 
              onClick={handleReportClick}
              title="Reportar Foto"
            >
              <Flag size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PolaroidCard;
