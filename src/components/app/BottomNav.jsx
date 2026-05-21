import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './BottomNav.css';

const NAV_ITEMS = [
  { id: 'memorias', path: '/app/memorias', emoji: '📸', label: 'Memórias' },
  { id: 'home',     path: '/app',         emoji: '🏠', label: 'Início' },
  { id: 'premios',  path: '/app/premios',  emoji: '🏆', label: 'Prémios' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const getActive = () => {
    if (currentPath === '/app' || currentPath === '/app/') return 'home';
    if (currentPath.startsWith('/app/memorias')) return 'memorias';
    if (currentPath.startsWith('/app/premios')) return 'premios';
    return '';
  };

  const active = getActive();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.div
                className="nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="nav-emoji">{item.emoji}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
