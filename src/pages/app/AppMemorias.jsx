import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '../../context/AppAuthContext';
import { useAppMemorias } from '../../hooks/useAppMemorias';
import PolaroidCard from '../../components/app/PolaroidCard';
import UploadMemoria from '../../components/app/UploadMemoria';
import './AppMemorias.css';

const AppMemorias = () => {
  const { user } = useAppAuth();
  const { memorias, loading, error, uploadMemoria, deleteMemoria, reportMemoria } = useAppMemorias(user);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleUpload = async (file, legenda, emoji, onProgress) => {
    try {
      await uploadMemoria(file, legenda, emoji, onProgress);
      setShowUpload(false);
      showToast('📸 Polaroid adicionada!');
    } catch (err) {
      showToast('❌ Erro ao carregar foto.');
      throw err;
    }
  };

  const handleDelete = async (id, storagePath) => {
    try {
      await deleteMemoria(id, storagePath);
      showToast('🗑️ Polaroid eliminada.');
    } catch {
      showToast('❌ Erro ao eliminar.');
    }
  };

  const handleReport = async (id) => {
    try {
      await reportMemoria(id);
      showToast('🚩 Foto reportada.');
    } catch {
      showToast('❌ Erro ao reportar.');
    }
  };

  return (
    <div className="memorias-page page-with-nav">
      {/* Header */}
      <div className="memorias-header">
        <h1 className="memorias-title">
          <span className="font-caveat">Memórias</span>
        </h1>
        <p className="memorias-subtitle">Os vossos momentos inesquecíveis</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="memorias-loading">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Erro ao carregar</h3>
          <p>Verifica a tua ligação e tenta novamente.</p>
        </div>
      ) : memorias.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <h3>Sem memórias ainda</h3>
          <p>Sê o primeiro a partilhar um momento desta noite!</p>
        </div>
      ) : (
        <div className="polaroid-wall">
          <AnimatePresence>
            {memorias.map((m, i) => (
              <PolaroidCard
                key={m.id}
                memory={m}
                index={i}
                currentStudentNif={user?.nif}
                onDelete={handleDelete}
                onReport={handleReport}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB Upload Button */}
      <motion.button
        id="memorias-upload-fab"
        className="fab-btn"
        onClick={() => setShowUpload(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
        title="Adicionar memória"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
          <line x1="12" y1="8" x2="12" y2="14"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
        </svg>
      </motion.button>

      {/* Upload Sheet */}
      <AnimatePresence>
        {showUpload && (
          <UploadMemoria
            onUpload={handleUpload}
            onClose={() => setShowUpload(false)}
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

export default AppMemorias;
