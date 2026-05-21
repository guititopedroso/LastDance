import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '../../context/AppAuthContext';
import { useVotacao } from '../../hooks/useVotacao';
import CategoriaVoto from '../../components/app/CategoriaVoto';
import VotarModal from '../../components/app/VotarModal';
import './AppPremios.css';

const AppPremios = () => {
  const { user } = useAppAuth();
  const { categorias, votos, loading, loadAlunos, votar } = useVotacao(user);
  const [activeCategoria, setActiveCategoria] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleVotar = async (nifVotado, nomeVotado) => {
    if (!activeCategoria) return;
    try {
      await votar(activeCategoria.id, nifVotado, nomeVotado);
      setActiveCategoria(null);
      showToast(`✅ Votaste em ${nomeVotado}!`);
    } catch (err) {
      showToast('❌ ' + (err.message || 'Erro ao votar.'));
    }
  };

  return (
    <div className="premios-page page-with-nav">
      {/* Header */}
      <div className="premios-header">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="premios-title">🏆 Prémios LastDance</h1>
          <p className="premios-subtitle">Vota nos teus colegas nas categorias abaixo</p>
        </motion.div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="premios-loading">
          <div className="spinner" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <h3>Sem categorias ainda</h3>
          <p>Os prémios serão anunciados em breve. Fica atento!</p>
        </div>
      ) : (
        <div className="premios-list">
          {categorias.map((cat, i) => (
            <CategoriaVoto
              key={cat.id}
              categoria={cat}
              index={i}
              voto={votos[cat.id]}
              codigoEscola={user?.codigoEscola}
              onVotar={() => setActiveCategoria(cat)}
            />
          ))}
        </div>
      )}

      {/* Vote Modal */}
      <AnimatePresence>
        {activeCategoria && (
          <VotarModal
            categoria={activeCategoria}
            currentNif={user?.nif}
            codigoEscola={user?.codigoEscola}
            loadAlunos={loadAlunos}
            onVotar={handleVotar}
            onClose={() => setActiveCategoria(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppPremios;
