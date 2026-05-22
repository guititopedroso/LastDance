import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Smartphone, Share, MoreVertical, Info, ArrowDownToLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemorias } from '../../hooks/useMemorias';
import InstallBanner from '../../components/InstallBanner';
import GaleriaMemorias from '../../components/GaleriaMemorias';
import UploadMemoria from '../../components/UploadMemoria';
import './Memorias.css';

const Memorias = () => {
  const navigate = useNavigate();
  const [studentSession, setStudentSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('student_session');
    if (!sessionStr) {
      navigate('/area-cliente');
      return;
    }
    setStudentSession(JSON.parse(sessionStr));
    setCheckingSession(false);
  }, [navigate]);

  useEffect(() => {
    const checkMobile = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
      
      const mobileDevice = window.innerWidth <= 768 || 
                           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                           
      setIsMobile(mobileDevice && !isStandalone);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(checkIOS);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', checkMobile);
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

  const {
    memorias,
    loading,
    error,
    uploadMemoria,
    deleteMemoria,
    reportMemoria
  } = useMemorias(studentSession);

  if (checkingSession) {
    return (
      <div className="memorias-page-loading">
        <Loader2 className="spinner text-gold animate-spin" size={40} />
        <p>A validar sessão...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="memorias-page section-padding">
        <div className="container">
          <div className="memorias-back-link-wrapper">
            <Link to="/area-cliente" className="back-to-site">
              <ArrowLeft size={18} /> Voltar para Área de Aluno
            </Link>
          </div>

          <motion.div 
            className="mobile-block-container glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="mobile-block-icon-wrapper">
              <div className="mobile-block-pulse" />
              <div className="mobile-block-icon">
                <Smartphone size={36} />
              </div>
            </div>

            <h2 className="mobile-block-title">Instala a Web App</h2>
            <p className="mobile-block-desc">
              A galeria de memórias e a partilha de fotos no mural do teu baile estão disponíveis exclusivamente através da nossa Web App oficial no telemóvel.
            </p>

            <div className="mobile-instructions-box">
              {isIOS ? (
                <div className="mobile-instruction-step">
                  <Info size={20} className="text-rose-500 flex-shrink-0" style={{ marginTop: '2px' }} />
                  <span>
                    No teu iPhone/iPad (Safari): Toca em <strong>Partilhar <Share size={16} className="inline-icon" /></strong> (na barra inferior) e escolhe <strong>"Adicionar ao Ecrã Principal"</strong>.
                  </span>
                </div>
              ) : (
                <div className="mobile-instruction-step">
                  <Info size={20} className="text-rose-500 flex-shrink-0" style={{ marginTop: '2px' }} />
                  <span>
                    No Android/Chrome: Clica no botão abaixo, ou toca nos <strong>3 pontos <MoreVertical size={16} className="inline-icon" /></strong> no canto superior e seleciona <strong>"Instalar"</strong>.
                  </span>
                </div>
              )}
            </div>

            {deferredPrompt && (
              <button className="btn-mobile-install" onClick={handleInstallClick}>
                <ArrowDownToLine size={20} /> Instalar Web App 📲
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="memorias-page section-padding">
      <div className="container">
        {/* Install Banner */}
        <InstallBanner />

        {/* Back Link to Portal */}
        <div className="memorias-back-link-wrapper">
          <Link to="/area-cliente" className="back-to-site">
            <ArrowLeft size={18} /> Voltar para Área de Aluno
          </Link>
        </div>

        {/* School Info Badge */}
        {studentSession && (
          <motion.div 
            className="school-info-badge-memorias"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span>Escola: <strong>{studentSession.school}</strong></span>
            <span className="separator">•</span>
            <span>Estudante: <strong>{studentSession.name}</strong></span>
          </motion.div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="memorias-content-loading">
            <Loader2 className="spinner text-rose-500 animate-spin" size={40} />
            <p>A carregar o vosso mural de recordações...</p>
          </div>
        ) : error ? (
          <div className="memorias-error-state glass-card">
            <h3>Ops! Ocorreu um erro</h3>
            <p>Não foi possível carregar as memórias. Verifica a tua ligação à Internet.</p>
          </div>
        ) : (
          <GaleriaMemorias
            memorias={memorias}
            currentStudentNif={studentSession?.nif}
            onDelete={deleteMemoria}
            onReport={reportMemoria}
          />
        )}

        {/* Floating Upload Component */}
        {!loading && !error && studentSession && (
          <UploadMemoria
            studentName={studentSession.name}
            onUpload={uploadMemoria}
          />
        )}
      </div>
    </div>
  );
};

export default Memorias;
