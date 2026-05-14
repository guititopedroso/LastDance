import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-content">
        <div className="cookie-icon">
          <ShieldCheck size={24} className="text-gold" />
        </div>
        <div className="cookie-text">
          <p>
            Utilizamos cookies para melhorar a sua experiência no nosso site. 
            Ao continuar a navegar, está a concordar com a nossa{' '}
            <Link to="/cookies">Política de Cookies</Link>.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="btn-decline" onClick={handleDecline}>Recusar</button>
          <button className="btn-accept btn-premium" onClick={handleAccept}>Aceitar Tudo</button>
        </div>
        <button className="cookie-close" onClick={() => setIsVisible(false)}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
