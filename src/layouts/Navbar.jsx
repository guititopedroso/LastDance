import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, ArrowRight, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '#' },
    { name: 'Quem Somos', path: '#quem-somos' },
    { name: 'Contactos', path: '#contactos' },
  ];

  const hideNavbarPaths = ['/area-cliente', '/register', '/setup-account', '/success'];
  if (hideNavbarPaths.some(path => location.pathname.startsWith(path))) return null;

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container nav-content">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link
            to="/"
            className="navbar-logo"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/logo_transparent.png" alt="Last Dance" className="navbar-logo-img" />
          </Link>
        </motion.div>

        {/* Desktop Menu */}
        <motion.div
          className="nav-links"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
        >
          {navLinks.map((link) => (
            <motion.a
              key={link.name}
              href={link.path}
              className="nav-link-item"
              variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ color: 'var(--color-accent)' }}
              onClick={(e) => {
                if (link.path.startsWith('#')) {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    window.location.href = '/';
                  } else if (link.path === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    document.querySelector(link.path)?.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            >
              {link.name}
            </motion.a>
          ))}
          <motion.a
            href="/#inscricao"
            className="btn-premium-nav"
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Inscrição <ArrowRight size={16} />
          </motion.a>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="nav-actions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link to="/area-cliente" className="btn-premium">
            <User size={18} /> Área de Aluno
          </Link>
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            <AnimatePresence mode="wait">
              {isOpen
                ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><X size={28} /></motion.span>
                : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Menu size={28} /></motion.span>
              }
            </AnimatePresence>
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Botão para fechar no canto superior */}
            <button className="close-menu-btn" onClick={() => setIsOpen(false)}>
              <X size={32} />
            </button>

            <div className="mobile-menu-content">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.path}
                  href={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </motion.a>
              ))}
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: navLinks.length * 0.1 }}
                className="mobile-menu-footer"
              >
                <Link to="/area-cliente" onClick={() => setIsOpen(false)} className="btn-premium-nav">
                  <User size={18} /> Área de Aluno
                </Link>
                <button className="btn-close-text" onClick={() => setIsOpen(false)}>
                  Voltar ao site
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
