import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './UploadMemoria.css';

const EMOJIS = ['😊', '🎉', '🥳', '💃', '🕺', '🔥', '❤️', '⭐', '🌙', '🎶', '📸', '✨'];

const UploadMemoria = ({ onUpload, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file, legenda, selectedEmoji, setProgress);
    } catch {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="upload-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!uploading ? onClose : undefined}
      />

      {/* Sheet */}
      <motion.div
        className="upload-sheet glass-card"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {/* Handle */}
        <div className="upload-handle" />

        <div className="upload-header">
          <h2>Nova Memória</h2>
          {!uploading && (
            <button id="upload-close-btn" className="btn btn-icon" onClick={onClose}>✕</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Photo picker */}
          {!preview ? (
            <button
              type="button"
              id="upload-photo-btn"
              className="upload-photo-picker"
              onClick={() => fileInputRef.current.click()}
            >
              <span className="upload-photo-icon">📷</span>
              <span>Escolher Foto</span>
              <span className="upload-photo-hint">JPG, PNG ou HEIF</span>
            </button>
          ) : (
            <div className="upload-preview-wrapper">
              <img src={preview} alt="Preview" className="upload-preview-img" />
              {!uploading && (
                <button
                  type="button"
                  className="upload-change-photo"
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  Trocar
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Legenda */}
          <div className="input-group">
            <label className="input-label" htmlFor="legenda-input">Legenda</label>
            <input
              id="legenda-input"
              className="input-field"
              type="text"
              placeholder="Uma frase para este momento..."
              value={legenda}
              onChange={e => setLegenda(e.target.value)}
              maxLength={80}
              disabled={uploading}
            />
          </div>

          {/* Emoji Picker */}
          <div className="input-group">
            <label className="input-label">Mood</label>
            <div className="emoji-picker">
              {EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${selectedEmoji === em ? 'emoji-btn--active' : ''}`}
                  onClick={() => setSelectedEmoji(prev => prev === em ? '' : em)}
                  disabled={uploading}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="upload-progress-wrapper">
              <div className="upload-progress-bar">
                <motion.div
                  className="upload-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="upload-progress-text">{progress}%</span>
            </div>
          )}

          <button
            type="submit"
            id="upload-submit-btn"
            className="btn btn-primary"
            disabled={!file || uploading}
            style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '1rem' }}
          >
            {uploading ? '📤 A carregar...' : '📸 Publicar Polaroid'}
          </button>
        </form>
      </motion.div>
    </>
  );
};

export default UploadMemoria;
