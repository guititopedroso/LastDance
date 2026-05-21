import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './InstallAppBanner.css';

/**
 * InstallAppBanner
 * ─────────────────────────────────────────────
 * Shows a native-style install prompt for the
 * LastDance PWA when the browser fires the
 * beforeinstallprompt event (Chrome/Android).
 *
 * On iOS (where beforeinstallprompt is not fired)
 * shows manual share-sheet instructions instead.
 *
 * Dismissed state is persisted in localStorage so
 * it doesn't re-appear on every visit.
 */

const DISMISS_KEY = 'ld_install_dismissed';
const INSTALLED_KEY = 'ld_pwa_installed';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const InstallAppBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed or dismissed
    if (
      isInStandaloneMode() ||
      localStorage.getItem(INSTALLED_KEY) === 'true' ||
      localStorage.getItem(DISMISS_KEY) === 'true'
    ) {
      return;
    }

    const ios = isIOS();
    setIsIosDevice(ios);

    if (ios) {
      // iOS — always show manual guide
      setShow(true);
      return;
    }

    // Chrome / Android — listen for native prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If app gets installed via the OS prompt
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowIOSGuide(true);
      return;
    }
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
    }
    setInstalling(false);
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          id="install-app-banner"
          className="install-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Icon */}
          <div className="install-icon">
            <img src="/pwa-192.png" alt="LastDance App" />
          </div>

          {/* Text */}
          <div className="install-text">
            <p className="install-title">Instalar a App LastDance</p>
            <p className="install-desc">
              Acede rapidamente às memórias e prémios sem abrir o browser.
            </p>
          </div>

          {/* Actions */}
          <div className="install-actions">
            {isIosDevice ? (
              <button
                id="install-ios-btn"
                className="install-btn-primary"
                onClick={() => setShowIOSGuide(true)}
              >
                Como instalar
              </button>
            ) : (
              <button
                id="install-android-btn"
                className="install-btn-primary"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? '...' : 'Instalar'}
              </button>
            )}
            <button
              id="install-dismiss-btn"
              className="install-btn-dismiss"
              onClick={handleDismiss}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* iOS Step-by-step guide */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              className="ios-guide-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              className="ios-guide-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="ios-guide-handle" />
              <div className="ios-guide-header">
                <img src="/pwa-192.png" alt="LastDance" className="ios-guide-icon" />
                <div>
                  <h3>Instalar no iPhone / iPad</h3>
                  <p>Segue estes 3 passos simples:</p>
                </div>
              </div>

              <ol className="ios-steps">
                <li className="ios-step">
                  <span className="ios-step-num">1</span>
                  <div className="ios-step-content">
                    <strong>Toca em Partilhar</strong>
                    <p>O botão <span className="ios-icon-inline">⬆</span> na barra inferior do Safari</p>
                  </div>
                </li>
                <li className="ios-step">
                  <span className="ios-step-num">2</span>
                  <div className="ios-step-content">
                    <strong>Seleciona "Adicionar ao Ecrã Início"</strong>
                    <p>Desliza para baixo na lista de opções</p>
                  </div>
                </li>
                <li className="ios-step">
                  <span className="ios-step-num">3</span>
                  <div className="ios-step-content">
                    <strong>Toca em "Adicionar"</strong>
                    <p>A app aparece no teu ecrã como qualquer outra!</p>
                  </div>
                </li>
              </ol>

              <button
                id="ios-guide-close-btn"
                className="ios-guide-close"
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
              >
                Fechar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallAppBanner;
