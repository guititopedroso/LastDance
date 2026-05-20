import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const sessionStr = localStorage.getItem('student_session');
    if (!sessionStr) {
      navigate('/area-cliente');
      return;
    }
    setStudentSession(JSON.parse(sessionStr));
    setCheckingSession(false);
  }, [navigate]);

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
