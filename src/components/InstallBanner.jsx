import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X, Share, MoreVertical, Smartphone, Info } from 'lucide-react';

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPWA, setIsPWA] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if already installed/standalone
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
    setIsPWA(checkPWA);

    // Detect if iOS
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(checkIOS);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    setIsDismissed(dismissed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // If already running in PWA standalone mode or dismissed, don't show the banner
  if (isPWA || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="install-banner-container"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="install-banner-header">
          <div className="install-banner-title">
            <Smartphone className="icon-rose text-rose-500" size={20} />
            <span>Instalar App de Memórias</span>
          </div>
          <button className="btn-dismiss" onClick={handleDismiss} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        
        <div className="install-banner-body">
          <p className="install-banner-desc">
            Adiciona ao teu ecrã principal para poderes tirar fotos e partilhá-las diretamente com a câmara no baile, e aceder offline!
          </p>
          
          <div className="instructions-box">
            {isIOS ? (
              <div className="instruction-step">
                <Info size={18} className="text-rose-500 flex-shrink-0" />
                <span>
                  No teu iPhone/iPad (Safari): Toca em <strong>Partilhar <Share size={14} className="inline-icon" /></strong> (na barra inferior) e escolhe <strong>"Adicionar ao Ecrã Principal"</strong>.
                </span>
              </div>
            ) : (
              <div className="instruction-step">
                <Info size={18} className="text-rose-500 flex-shrink-0" />
                <span>
                  No Android/Chrome: Clica no botão abaixo, ou toca nos <strong>3 pontos <MoreVertical size={14} className="inline-icon" /></strong> no canto superior e seleciona <strong>"Instalar"</strong>.
                </span>
              </div>
            )}
          </div>
          
          {deferredPrompt && (
            <div className="install-banner-actions-footer">
              <button className="btn-install" onClick={handleInstallClick}>
                <ArrowDownToLine size={16} /> Instalar Web App
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallBanner;
