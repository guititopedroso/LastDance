import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Ticket, CreditCard, Clock, User, LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getStudentByNameAndSchool, getAllCodes } from '../../api/firebase';
import './ClientArea.css';

const ClientArea = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('search'); // 'search' | 'dashboard'
  const [registration, setRegistration] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('multibanco');

  useEffect(() => {
    // Check for active session
    const activeSession = localStorage.getItem('student_session');
    if (activeSession) {
      setRegistration(JSON.parse(activeSession));
      
      // Redirect if from state is present
      const redirectTarget = location.state?.from?.pathname || location.state?.from || null;
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        setStep('dashboard');
      }
    }

    const fetchSchools = async () => {
      try {
        const schoolsData = await getAllCodes();
        setSchools(schoolsData);
      } catch (err) {
        console.error("Error loading schools:", err);
      }
    };
    fetchSchools();
  }, [navigate, location]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !selectedSchoolCode) {
      alert("Por favor, preenche todos os campos.");
      return;
    }
    setLoading(true);
    
    try {
      const studentData = await getStudentByNameAndSchool(fullName, selectedSchoolCode);
      if (studentData) {
        // Fetch school name
        let schoolName = 'Escola não especificada';
        let ballDate = null;
        const schoolData = schools.find(s => s.code.toUpperCase() === selectedSchoolCode.toUpperCase());
        if (schoolData) {
          schoolName = schoolData.schoolName;
          ballDate = schoolData.ballDate || null;
        }

        const sessionData = {
          name: `${studentData.firstName} ${studentData.lastName}`,
          school: schoolName,
          schoolCode: studentData.schoolCode || null,
          ballDate: ballDate,
          status: studentData.status || 'pending_payment',
          nif: studentData.nif || '',
          reference: studentData.paymentReference || 'Gerando...',
          entity: studentData.paymentEntity || '21054',
          amount: studentData.paymentPlan === 'installments' ? '11.00€' : '55.00€',
          paymentMethod: studentData.paymentMethod || 'multibanco',
          paymentPlan: studentData.paymentPlan,
          mbwayPhone: studentData.mbwayPhone || null,
          paidInstallments: studentData.paidInstallments || 0,
          totalInstallments: studentData.paymentPlan === 'installments' ? 5 : 1
        };

        setRegistration(sessionData);
        localStorage.setItem('student_session', JSON.stringify(sessionData));
        
        const redirectTarget = location.state?.from?.pathname || location.state?.from || null;
        if (redirectTarget) {
          navigate(redirectTarget, { replace: true });
        } else {
          setStep('dashboard');
        }
      } else {
        alert("Inscrição não encontrada. Verifica se o nome e a escola estão corretos.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Ocorreu um erro ao aceder. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_session');
    setRegistration(null);
    setFullName('');
    setSelectedSchoolCode('');
    setStep('search');
  };


  return (
    <div className="client-area-page section-padding">
      <div className="container">
        <Link to="/" className="back-to-site">
          <ArrowLeft size={18} /> Voltar para o site
        </Link>
        <div className="client-header">
          <h1 className="text-gold">Área do Aluno</h1>
          <p>Consulta o estado da tua inscrição e dados de pagamento.</p>
        </div>

        {step === 'search' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card search-card"
          >
            <h3>Aceder à Inscrição</h3>
            <p>Introduz o teu nome e seleciona a tua escola para começar.</p>
            <form onSubmit={handleLoginSubmit} className="search-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="input-group-simple" style={{ width: '100%' }}>
                <input 
                  type="text" 
                  placeholder="Nome Completo (Ex: João Silva)" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group-simple" style={{ width: '100%' }}>
                <select 
                  required 
                  value={selectedSchoolCode}
                  onChange={(e) => setSelectedSchoolCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" style={{ background: '#111' }}>Selecionar Escola...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.code} style={{ background: '#111' }}>{s.schoolName}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-premium" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'A aceder...' : 'Entrar na Área de Aluno'} <Search size={18} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 'dashboard' && registration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="client-dashboard"
          >
            <div className="dashboard-grid">
              <div className="glass-card profile-info">
                <div className="user-avatar">
                  <User size={40} className="text-gold" />
                </div>
                <h2>Olá, {registration.name}</h2>
                <span className={`status-pill ${registration.status}`}>
                  {registration.status === 'pending_payment' ? 'Aguardar Pagamento' : 
                   registration.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
                <p className="school-name">{registration.school}</p>
                <button className="btn-logout-client" onClick={handleLogout}>
                  <LogOut size={16} /> Sair
                </button>
              </div>

              <div className="glass-card ticket-status">
                <div className="card-header-client">
                  <Ticket size={20} className="text-gold" />
                  <h3>Teu Bilhete</h3>
                </div>
                <div className="ticket-placeholder">
                  {registration.paidInstallments >= registration.totalInstallments ? (
                    <div className="ticket-ready">
                      <button className="btn-premium">Descarregar Bilhete PDF</button>
                    </div>
                  ) : (
                    <div className="ticket-locked">
                      <p>O teu bilhete ficará disponível assim que todas as prestações ({registration.paidInstallments}/{registration.totalInstallments}) forem pagas.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card event-info-card">
                <div className="card-header-client">
                  <Clock size={20} className="text-gold" />
                  <h3>Informações do Evento</h3>
                </div>
                <div className="event-details-list">
                  <div className="event-item">
                    <strong>Data:</strong>
                    <span>
                      {registration.ballDate
                        ? new Date(registration.ballDate + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'A definir'}
                    </span>
                  </div>
                  <div className="event-item">
                    <strong>Local:</strong>
                    <span>Quinta das Pirâmides, Quinta do Conde</span>
                  </div>
                  <div className="event-item">
                    <strong>Check-in:</strong>
                    <span>A partir das 16:00</span>
                  </div>
                  <div className="event-item">
                    <strong>Dress Code:</strong>
                    <span>Gala / Formal</span>
                  </div>
                </div>
              </div>

              {/* WebApp App Promo Card */}
              <div className="glass-card webapp-promo-card">
                <div className="card-header-client">
                  <span style={{ fontSize: '24px' }}>📸</span>
                  <h3>App LastDance</h3>
                </div>
                <div className="webapp-promo-content">
                  <p>
                    Acede à nossa WebApp para partilhares as tuas polaroids no mural digital e votares nos teus colegas para os Prémios da Noite em tempo real!
                  </p>
                  <Link to="/app" className="btn-open-app-link" style={{ width: '100%' }}>
                    Entrar na App 🎉
                  </Link>
                </div>
              </div>

              {registration.paymentPlan === 'installments' && (
                <div className="glass-card installment-management full-width-card">
                  <div className="card-header-client">
                    <CheckCircle2 size={20} className="text-gold" />
                    <h3>Gestão de Prestações</h3>
                  </div>
                  
                  <div className="installments-progress">
                    <div className="progress-info">
                      <span>Progresso do Pagamento</span>
                      <strong>{registration.paidInstallments} de {registration.totalInstallments} pagas</strong>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${(registration.paidInstallments / registration.totalInstallments) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="installments-list">
                    {[...Array(registration.totalInstallments)].map((_, i) => (
                      <div key={i} className={`installment-item ${i < registration.paidInstallments ? 'paid' : (i === registration.paidInstallments ? 'next' : 'pending')}`}>
                        <div className="inst-number">{i + 1}ª</div>
                        <div className="inst-details">
                          <span className="inst-label">Prestação {i + 1}</span>
                          <span className="inst-status">
                            {i < registration.paidInstallments ? 'Paga' : (i === registration.paidInstallments ? 'Pendente' : 'Futura')}
                          </span>
                        </div>
                        <div className="inst-price">11.00€</div>
                        {i === registration.paidInstallments && (
                          <button 
                            className="btn-pay-now" 
                            onClick={() => setShowPaymentModal(true)}
                          >
                            Pagar Agora
                          </button>
                        )}
                        {i < registration.paidInstallments && (
                          <div className="paid-icon"><CheckCircle2 size={16} /></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card payment-modal"
            >
              <button className="close-modal" onClick={() => setShowPaymentModal(false)}>×</button>
              <h3>Escolher Método de Pagamento</h3>
              <p>Seleciona como pretendes pagar a tua {registration.paidInstallments + 1}ª prestação.</p>
              
              <div className="modal-methods-grid">
                <div 
                  className={`modal-method-card ${selectedMethod === 'multibanco' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('multibanco')}
                >
                  <img src="https://cdn.worldvectorlogo.com/logos/multibanco.svg" alt="Multibanco" />
                  <span>Multibanco</span>
                </div>
                <div 
                  className={`modal-method-card ${selectedMethod === 'mbway' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('mbway')}
                >
                  <img src="https://endpoint-mbway.azureedge.net/wp-content/uploads/2020/07/Logo_MBWay@2x.png" alt="MBWAY" />
                  <span>MBWAY</span>
                </div>
                <div 
                  className={`modal-method-card ${selectedMethod === 'transfer' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('transfer')}
                >
                  <img src="https://cdn.worldvectorlogo.com/logos/sepa-1.svg" alt="Transferência" />
                  <span>Transferência</span>
                </div>
              </div>

              <div className="modal-payment-details">
                {selectedMethod === 'multibanco' && (
                  <div className="details-box">
                    <div className="detail-row">
                      <span>Entidade:</span>
                      <strong>21054</strong>
                    </div>
                    <div className="detail-row">
                      <span>Referência:</span>
                      <strong>{registration.reference}</strong>
                    </div>
                  </div>
                )}
                
                {selectedMethod === 'mbway' && (
                  <div className="details-box">
                    <p>Insere o teu número MBWAY e confirma a notificação na App.</p>
                    <div className="input-group-simple">
                      <input type="tel" placeholder="912 345 678" defaultValue={registration.mbwayPhone || registration.nif} />
                    </div>
                  </div>
                )}

                {selectedMethod === 'transfer' && (
                  <div className="details-box">
                    <div className="detail-row">
                      <span>IBAN:</span>
                      <strong>PT50 0000 0000 0000 0000 0000 0</strong>
                    </div>
                  </div>
                )}

                <div className="modal-amount">
                  <span>Valor a pagar:</span>
                  <strong className="text-gold">11.00€</strong>
                </div>
              </div>

              <button className="btn-premium full-width" onClick={() => alert("Simulação: Pedido de pagamento enviado!")}>
                Confirmar Pagamento
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientArea;
