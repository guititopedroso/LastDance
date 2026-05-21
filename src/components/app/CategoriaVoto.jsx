import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultadoVoto from './ResultadoVoto';
import './CategoriaVoto.css';

const CategoriaVoto = ({ categoria, index, voto, codigoEscola, onVotar }) => {
  const { id, emoji, titulo, descricao, mostrarResultados } = categoria;
  const hasVoted = !!voto;
  const canSeeResults = hasVoted && mostrarResultados;

  return (
    <motion.div
      id={`categoria-${id}`}
      className={`categoria-card glass-card ${hasVoted ? 'categoria-card--voted' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
      layout
    >
      {/* Top Row */}
      <div className="categoria-top">
        <div className="categoria-emoji-wrap">
          <span className="categoria-emoji">{emoji}</span>
        </div>
        <div className="categoria-info">
          <h3 className="categoria-titulo">{titulo}</h3>
          <p className="categoria-desc">{descricao}</p>
        </div>
      </div>

      {/* Status & Action */}
      <div className="categoria-bottom">
        {hasVoted ? (
          <span className="badge badge-voted">
            ✓ Já votaste em {voto.nomeVotado}
          </span>
        ) : (
          <span className="badge badge-pending">
            Ainda não votaste
          </span>
        )}

        {!hasVoted ? (
          <button
            id={`votar-btn-${id}`}
            className="btn btn-primary categoria-btn"
            onClick={onVotar}
          >
            Votar
          </button>
        ) : mostrarResultados ? (
          <span className="categoria-reveal-hint">Ver pódio ↓</span>
        ) : (
          <span className="categoria-pending-hint">Resultados em breve 👀</span>
        )}
      </div>

      {/* Results (shown when admin reveals) */}
      <AnimatePresence>
        {canSeeResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="categoria-divider" />
            <ResultadoVoto categoriaId={id} codigoEscola={codigoEscola} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoriaVoto;
