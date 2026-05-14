import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Ticket, CreditCard, Clock, User, LogOut, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentByNIF, validateSchoolCode } from '../../api/firebase';
import './ClientArea.css';

const ClientArea = () => {
  const navigate = useNavigate();
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('nif'); // 'nif' | 'password' | 'dashboard'
  const [tempData, setTempData] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('multibanco');

  useEffect(() => {
    // Check for incomplete registration
    const savedRegData = localStorage.getItem('temp_reg_data');
    if (savedRegData) {
      const parsed = JSON.parse(savedRegData);
      if (parsed.schoolCode) {
        navigate(`/register/${parsed.schoolCode}`);
        return;
      }
    }

    // Check for active session
    const activeSession = localStorage.getItem('student_session');
    if (activeSession) {
      setRegistration(JSON.parse(activeSession));
      setStep('dashboard');
    }
  }, [navigate]);

  const handleNifSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await getStudentByNIF(nif);
      if (data) {
        setTempData(data);
        setStep('password');
      } else {
        alert("Inscrição não encontrada. Verifica se o NIF está correto.");
      }
    } catch (error) {
      console.error("Search Error:", error);
      alert("Ocorreu um erro ao procurar. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (tempData.password === password) {
      // Fetch school name
      let schoolName = 'Escola não especificada';
      let ballDate = null;
      if (tempData.schoolCode) {
        const schoolData = await validateSchoolCode(tempData.schoolCode);
        if (schoolData) {
          schoolName = schoolData.schoolName;
          ballDate = schoolData.ballDate || null;
        }
      }

      const sessionData = {
        name: `${tempData.firstName} ${tempData.lastName}`,
        school: schoolName,
        ballDate: ballDate,
        status: tempData.status || 'pending_payment',
        nif: tempData.nif,
        reference: tempData.paymentReference || 'Gerando...',
        entity: tempData.paymentEntity || '21054',
        amount: tempData.paymentPlan === 'installments' ? '11.00€' : '55.00€',
        paymentMethod: tempData.paymentMethod || 'multibanco',
        paymentPlan: tempData.paymentPlan,
        mbwayPhone: tempData.mbwayPhone || null,
        paidInstallments: tempData.paidInstallments || 0,
        totalInstallments: tempData.paymentPlan === 'installments' ? 5 : 1
      };

      setRegistration(sessionData);
      localStorage.setItem('student_session', JSON.stringify(sessionData));
      setStep('dashboard');
    } else {
      alert("Password incorreta. Tenta novamente.");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('student_session');
    setRegistration(null);
    setTempData(null);
    setPassword('');
    setStep('nif');
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

        {step === 'nif' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card search-card"
          >
            <h3>Aceder à Inscrição</h3>
            <p>Introduz o teu NIF para começar.</p>
            <form onSubmit={handleNifSubmit} className="search-form">
              <div className="input-group-simple">
                <input 
                  type="text" 
                  placeholder="Teu NIF (Ex: 123456789)" 
                  maxLength={9}
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" disabled={loading} className="btn-premium">
                {loading ? 'A validar...' : 'Próximo'} <Search size={18} />
              </button>
            </form>
          </motion.div>
        )}

        {step === 'password' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card search-card"
          >
            <button onClick={() => setStep('nif')} className="btn-back-step">
              <ArrowLeft size={16} /> Alterar NIF
            </button>
            <h3>Confirmar Identidade</h3>
            <p>Olá <strong>{tempData.firstName}</strong>, introduz a tua password de acesso.</p>
            <form onSubmit={handlePasswordSubmit} className="search-form">
              <div className="input-group-simple password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Tua password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-premium">
                {loading ? 'A entrar...' : 'Entrar na Área de Aluno'}
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
