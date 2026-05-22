import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppAuth } from '../../context/AppAuthContext';
import './AppHome.css';

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.12 + 0.3, type: 'spring', stiffness: 160, damping: 18 }
  })
};

const AppHome = () => {
  const { user, logout } = useAppAuth();
  const navigate = useNavigate();

  const displayName = user?.nomeAluno || 'Olá';

  const sections = [
    {
      id: 'memorias',
      emoji: '📸',
      title: 'Memórias',
      desc: 'O teu mural de polaroids da festa',
      gradient: 'from-violet-600 to-rose-600',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      path: '/app/memorias',
    },
    {
      id: 'premios',
      emoji: '🏆',
      title: 'Prémios',
      desc: 'Vota nos prémios dos teus colegas',
      gradient: 'from-amber-500 to-rose-600',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      path: '/app/premios',
    },
  ];

  return (
    <div className="home-page page-with-nav">
      {/* Ambient glow */}
      <div className="home-ambient" />

      {/* Header */}
      <motion.div
        className="home-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="home-greeting">
          <p className="home-greeting-sub">Bem-vindo de volta,</p>
          <h1 className="home-greeting-name">{displayName} 👋</h1>
          {user?.nomeEscola && (
            <span className="home-school-badge">{user.nomeEscola}</span>
          )}
        </div>
        <button
          id="home-logout-btn"
          className="btn btn-icon"
          onClick={logout}
          title="Terminar sessão"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </motion.div>

      {/* Section Cards */}
      <div className="home-cards">
        {sections.map((s, i) => (
          <motion.button
            key={s.id}
            id={`home-card-${s.id}`}
            className="home-card glass-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={i}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(s.path)}
            style={{ '--glow': s.bgGlow }}
          >
            <div className="home-card-glow" />
            <div className="home-card-emoji">{s.emoji}</div>
            <div className="home-card-text">
              <h2 className="home-card-title">{s.title}</h2>
              <p className="home-card-desc">{s.desc}</p>
            </div>
            <div className="home-card-arrow">→</div>
          </motion.button>
        ))}
      </div>

      {/* Event badge */}
      <motion.div
        className="home-event-badge glass"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <span className="home-event-dot" />
        <span>LastDance está a acontecer agora</span>
      </motion.div>
    </div>
  );
};

export default AppHome;
