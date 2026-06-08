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
      desc: 'Partilha e visualiza fotografias Polaroids da festa.',
      path: '/app/memorias',
      bgGlow: 'rgba(236,72,153,0.15)'
    },
    {
      id: 'premios',
      emoji: '🏆',
      title: 'Prémios LastDance',
      desc: 'Vota nos teus colegas nas categorias dos prémios.',
      path: '/app/premios',
      bgGlow: 'rgba(251,191,36,0.15)'
    }
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
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '15px' }}
      >
        <div className="home-greeting">
          <p className="home-greeting-sub">Bem-vindo de volta,</p>
          <h1 className="home-greeting-name">{displayName} 👋</h1>
          {user?.nomeEscola && (
            <span className="home-school-badge">{user.nomeEscola}</span>
          )}
        </div>
        <button 
          onClick={logout} 
          className="btn-logout-app"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
            outline: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          Sair 🚪
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
