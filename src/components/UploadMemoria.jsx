import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, Send } from 'lucide-react';

const EMOJIS = ['😂', '❤️', '🔥', '💃', '🎉', '😭', '✨', '👑'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadMemoria = ({ studentName, onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [legenda, setLegenda] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setErrorMsg('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate if it is an image
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Por favor, escolhe uma imagem válida.');
      return;
    }

    // Validate size (10MB)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMsg('A imagem é muito grande. O tamanho máximo é 10MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewURL(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleEmojiClick = (emoji) => {
    setSelectedEmoji(prev => (prev === emoji ? '' : emoji));
  };

  const handleClose = () => {
    if (uploading) return; // Prevent closing during upload
    setIsOpen(false);
    setFile(null);
    setPreviewURL('');
    setLegenda('');
    setSelectedEmoji('');
    setErrorMsg('');
    setProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Tira ou escolhe uma foto primeiro!');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      await onUpload(file, legenda, selectedEmoji, (progressVal) => {
        setProgress(progressVal);
      });
      handleClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao enviar a foto. Tenta novamente.');
      setUploading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.button
        className="fab-upload"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.8, stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Adicionar Memória"
      >
        <Plus size={28} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="upload-modal-overlay">
            <motion.div
              className="upload-modal glass-card"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            >
              <div className="modal-header">
                <h3>Partilhar Momento</h3>
                <button 
                  className="btn-close-modal" 
                  onClick={handleClose} 
                  disabled={uploading}
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="upload-form">
                {errorMsg && <div className="upload-error-message">{errorMsg}</div>}

                {/* Photo Input / Preview Area */}
                <div className="photo-upload-area">
                  {previewURL ? (
                    /* Polaroid Preview */
                    <div className="polaroid-preview-card">
                      <div className="polaroid-preview-img-wrapper">
                        <img src={previewURL} alt="Preview" />
                        {selectedEmoji && (
                          <div className="polaroid-preview-emoji-overlay">
                            {selectedEmoji}
                          </div>
                        )}
                      </div>
                      <div className="polaroid-preview-footer">
                        <span className="polaroid-preview-name">{studentName}</span>
                      </div>
                    </div>
                  ) : (
                    /* Trigger Box */
                    <div 
                      className="photo-placeholder"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Camera size={48} className="text-rose-500" />
                      <span>Tirar Foto / Carregar Imagem</span>
                      <small>Câmara do telemóvel ou galeria</small>
                    </div>
                  )}

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                  />

                  {previewURL && !uploading && (
                    <button 
                      type="button" 
                      className="btn-change-photo"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Alterar Foto
                    </button>
                  )}
                </div>

                {/* Emoji Mood Selector */}
                <div className="emoji-selector-section">
                  <label>Como te sentes? (Emoji)</label>
                  <div className="emojis-row">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-btn ${selectedEmoji === emoji ? 'active' : ''}`}
                        onClick={() => handleEmojiClick(emoji)}
                        disabled={uploading}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption input */}
                <div className="caption-section">
                  <div className="caption-label-row">
                    <label>Legenda (Opcional)</label>
                    <span className={`char-counter ${legenda.length > 135 ? 'text-rose-500' : ''}`}>
                      {legenda.length}/150
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={150}
                    placeholder="Escreve uma legenda para a tua polaroid..."
                    value={legenda}
                    onChange={(e) => setLegenda(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                {/* Action Buttons / Progress */}
                <div className="modal-actions-area">
                  {uploading ? (
                    <div className="upload-progress-wrapper">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">A enviar... {progress}%</span>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn-premium btn-submit-memory"
                      disabled={!file}
                    >
                      Partilhar Polaroid <Send size={16} />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UploadMemoria;
