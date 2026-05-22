import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Download, Info, Share, MoreVertical, ArrowLeft, Camera, Trophy, Ticket, Bell } from 'lucide-react';
import './DownloadApp.css';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const DownloadApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    setIsIosDevice(isIOS());
    setIsStandalone(isInStandaloneMode());

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowIOSGuide(true);
      return;
    }
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: <Camera className="feature-icon" size={24} />,
      title: 'Mural de Polaroids',
      desc: 'Tira fotos no baile e partilha-as em tempo real com toda a gente.'
    },
    {
      icon: <Trophy className="feature-icon" size={24} />,
      title: 'Prémios da Noite',
      desc: 'Vota nos teus colegas para Rei/Rainha e outras categorias hilariantes.'
    },
    {
      icon: <Ticket className="feature-icon" size={24} />,
      title: 'Bilhete Digital',
      desc: 'Acede ao teu bilhete e estado do teu pagamento, mesmo sem internet.'
    },
    {
      icon: <Bell className="feature-icon" size={24} />,
      title: 'Notificações da Festa',
      desc: 'Sabe o momento exato em que abrem os buffets ou a pista de dança.'
    }
  ];

  return (
    <div className="download-page section-padding">
      <div className="container">
        <Link to="/" className="back-to-site-btn">
          <ArrowLeft size={18} /> Voltar ao site
        </Link>

        <div className="download-hero-grid">
          {/* Visual Area - Smartphone mockup */}
          <motion.div 
            className="mockup-side"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="phone-outer">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-app-header">
                  <img src="/logo_transparent.webp" alt="LastDance" className="phone-logo" />
                  <span className="live-pill">GALA 2026</span>
                </div>
                <div className="phone-app-content">
                  <div className="app-card">
                    <span className="app-card-emoji">📸</span>
                    <h4>Mural Polaroid Ativo</h4>
                    <p>87 fotos publicadas há instantes</p>
                  </div>
                  <div className="app-card gold-border">
                    <span className="app-card-emoji">👑</span>
                    <h4>Votações Abertas</h4>
                    <p>Vota agora para Rei e Rainha</p>
                  </div>
                  <div className="app-photo-grid">
                    <div className="photo-stub stub-1" />
                    <div className="photo-stub stub-2" />
                  </div>
                </div>
                <div className="phone-app-navbar">
                  <span>🏠</span>
                  <span>📸</span>
                  <span>🏆</span>
                  <span>👤</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Area & Install Controls */}
          <motion.div 
            className="info-side"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="app-badge">LastDance WebApp</div>
            <h1>Acede à Aplicação Oficial</h1>
            <p className="hero-desc">
              Não precisas de procurar na App Store ou Google Play. Instala diretamente através do browser e vive a noite ao máximo.
            </p>

            {/* Install Button & Direct Link */}
            <div className="install-actions-box">
              {isStandalone ? (
                <div className="standalone-status glass-card">
                  <span className="status-emoji">🎉</span>
                  <div>
                    <h4>Já estás na App!</h4>
                    <p>Agora podes navegar livremente e partilhar momentos.</p>
                  </div>
                </div>
              ) : (
                <>
                  {isIosDevice ? (
                    <button className="btn-download-premium" onClick={() => setShowIOSGuide(true)}>
                      Como Instalar no iOS <Smartphone size={20} />
                    </button>
                  ) : (
                    <button 
                      className="btn-download-premium" 
                      onClick={handleInstallClick}
                      disabled={installing}
                    >
                      {installing ? 'A instalar...' : 'Instalar App'} <Download size={20} />
                    </button>
                  )}
                  
                  <Link to="/app" className="btn-secondary-link">
                    Aceder no Browser (Sem instalar) ➔
                  </Link>

                  <div className="desktop-qr-section glass-card">
                    <img src="/qr_code_dark.png" alt="Scan to install" className="qr-code-img" />
                    <div className="qr-text">
                      <h4>Estás no computador?</h4>
                      <p>Aponta a câmara do telemóvel para abrir a App instantaneamente.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Features list */}
            <div className="features-section">
              <h3>O que podes fazer na App:</h3>
              <div className="features-grid">
                {features.map((f, i) => (
                  <div key={i} className="feature-item glass-card">
                    <div className="feature-icon-container">
                      {f.icon}
                    </div>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* iOS Step-by-step Modal / Sheet */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              className="ios-guide-backdrop-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              className="ios-guide-sheet-full glass-card"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="ios-sheet-header">
                <h3>Instalação no iPhone / iPad</h3>
                <button className="close-sheet" onClick={() => setShowIOSGuide(false)}>×</button>
              </div>

              <div className="ios-sheet-steps">
                <div className="ios-sheet-step">
                  <div className="step-num">1</div>
                  <div className="step-content-text">
                    <strong>Toca no botão Partilhar</strong>
                    <p>É o ícone <Share size={16} className="inline-icon-img" /> na barra inferior do Safari.</p>
                  </div>
                </div>

                <div className="ios-sheet-step">
                  <div className="step-num">2</div>
                  <div className="step-content-text">
                    <strong>Seleciona "Adicionar ao Ecrã Principal"</strong>
                    <p>Desliza para baixo na lista de opções para encontrar.</p>
                  </div>
                </div>

                <div className="ios-sheet-step">
                  <div className="step-num">3</div>
                  <div className="step-content-text">
                    <strong>Toca em "Adicionar"</strong>
                    <p>O ícone da app será adicionado ao teu ecrã como qualquer outra aplicação!</p>
                  </div>
                </div>
              </div>

              <button className="btn-close-sheet-action" onClick={() => setShowIOSGuide(false)}>
                Entendido
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DownloadApp;
