import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, ArrowLeft } from 'lucide-react';
import './Register.css';
import { registerStudent, getAllCodes } from '../../api/firebase';

const Register = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState(code || '');
  const [school, setSchool] = useState(null);
  const [step, setStep] = useState(1); // 1: Personal Details, 2: Payment Plan
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentPlan: 'full',
    paymentMethod: 'multibanco',
    mbwayPhone: ''
  });

  useEffect(() => {
    const fetchSchoolsAndInitial = async () => {
      try {
        const schoolsData = await getAllCodes();
        setSchools(schoolsData);
        
        if (code) {
          const matchedSchool = schoolsData.find(s => s.code.toUpperCase() === code.toUpperCase());
          if (matchedSchool) {
            setSchool(matchedSchool);
            setSelectedSchoolCode(matchedSchool.code);
          } else {
            alert("Código de escola inválido.");
            navigate('/register');
          }
        }
      } catch (err) {
        console.error("Error loading schools:", err);
      }
    };
    fetchSchoolsAndInitial();
  }, [code, navigate]);

  useEffect(() => {
    if (selectedSchoolCode) {
      const matched = schools.find(s => s.code.toUpperCase() === selectedSchoolCode.toUpperCase());
      setSchool(matched || null);
    } else {
      setSchool(null);
    }
  }, [selectedSchoolCode, schools]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedSchoolCode) {
      alert("Por favor, seleciona uma escola.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        schoolCode: selectedSchoolCode
      };
      const regId = await registerStudent(dataToSubmit);
      navigate('/success', { state: { formData: dataToSubmit, code: selectedSchoolCode, regId } });
    } catch (error) {
      alert("Erro ao realizar inscrição. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="register-page section-padding">
      <div className="container">
        <button onClick={handleBack} className="back-to-site btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={18} /> Voltar ao passo anterior
        </button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="register-header"
        >
          <div className="school-badge">
            <Globe size={16} /> {school ? school.schoolName : 'Seleciona a tua escola...'}
          </div>
          <div className="step-indicator">
            <span className={step === 1 ? 'active' : ''}>1. Dados Pessoais</span>
            <div className="step-line"></div>
            <span className={step === 2 ? 'active' : ''}>2. Pagamento</span>
          </div>
          <h1>{step === 1 ? 'Dados Pessoais' : 'Plano de Pagamento'}</h1>
          <p className="school-info">
            {step === 1 
              ? 'Completa o teu perfil para continuares.' 
              : 'Escolhe a modalidade que preferes para o teu bilhete.'}
          </p>
        </motion.div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card register-card"
        >
          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="register-form">
            {step === 1 ? (
              <div className="form-grid">
                <div className="input-field">
                  <label><User size={16} /> Nome</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: João"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>

                <div className="input-field">
                  <label><User size={16} /> Apelido</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Silva"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>

                <div className="input-field full-width">
                  <label><Globe size={16} /> Escola</label>
                  <select 
                    required 
                    value={selectedSchoolCode}
                    onChange={(e) => setSelectedSchoolCode(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Selecionar Escola...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.code}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field">
                  <label><Mail size={16} /> Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="joao.silva@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="input-field">
                  <label><Phone size={16} /> Telemóvel</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="payment-plans" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <div className="plans-grid">
                  <label className={`plan-card ${formData.paymentPlan === 'full' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentPlan" 
                      value="full" 
                      checked={formData.paymentPlan === 'full'}
                      onChange={() => setFormData({...formData, paymentPlan: 'full'})}
                    />
                    <div className="plan-content">
                      <span className="plan-title">Pagamento Total</span>
                      <span className="plan-price">55€</span>
                      <span className="plan-desc">Pagamento único e imediato</span>
                    </div>
                  </label>

                  <label className={`plan-card ${formData.paymentPlan === 'installments' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentPlan" 
                      value="installments" 
                      checked={formData.paymentPlan === 'installments'}
                      onChange={() => setFormData({...formData, paymentPlan: 'installments'})}
                    />
                    <div className="plan-content">
                      <span className="plan-title">5 Prestações</span>
                      <span className="plan-price">11€ <small>/mês</small></span>
                      <span className="plan-desc">Total de 55€ em 5 meses</span>
                    </div>
                  </label>
                </div>

                <div className="payment-methods" style={{ marginTop: '40px' }}>
                  <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', textAlign: 'center' }}>Método de Pagamento</h3>
                  <div className="methods-grid">
                    <label className={`method-card ${formData.paymentMethod === 'multibanco' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="multibanco" 
                        checked={formData.paymentMethod === 'multibanco'}
                        onChange={() => setFormData({...formData, paymentMethod: 'multibanco'})}
                      />
                      <div className="method-content">
                        <img src="https://cdn.worldvectorlogo.com/logos/multibanco.svg" alt="Multibanco" className="payment-logo" />
                        <span>Multibanco</span>
                      </div>
                    </label>

                    <label className={`method-card ${formData.paymentMethod === 'mbway' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="mbway" 
                        checked={formData.paymentMethod === 'mbway'}
                        onChange={() => setFormData({...formData, paymentMethod: 'mbway'})}
                      />
                      <div className="method-content">
                        <img src="https://endpoint-mbway.azureedge.net/wp-content/uploads/2020/07/Logo_MBWay@2x.png" alt="MBWAY" className="payment-logo" />
                        <span>MBWAY</span>
                      </div>
                    </label>

                    <label className={`method-card ${formData.paymentMethod === 'transfer' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="transfer" 
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={() => setFormData({...formData, paymentMethod: 'transfer'})}
                      />
                      <div className="method-content">
                        <img src="https://cdn.worldvectorlogo.com/logos/sepa-1.svg" alt="Transferência" className="payment-logo" />
                        <span>Transferência</span>
                      </div>
                    </label>
                  </div>

                  {formData.paymentMethod === 'mbway' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mbway-phone-input"
                      style={{ marginTop: '20px' }}
                    >
                      <div className="input-field">
                        <label><Phone size={16} /> Número MBWAY</label>
                        <input 
                          type="tel" 
                          placeholder="912 345 678"
                          value={formData.mbwayPhone || formData.phone}
                          onChange={(e) => setFormData({...formData, mbwayPhone: e.target.value})}
                          required
                        />
                        <small style={{ color: 'rgba(255,255,255,0.5)', marginTop: '5px', display: 'block' }}>
                          Irás receber uma notificação na tua app MBWAY para confirmar.
                        </small>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            <div className="form-footer">
              <p className="privacy-notice">
                {step === 1 
                  ? 'Os teus dados pessoais serão tratados com total confidencialidade.' 
                  : 'Ao submeter, concordas com os Termos e Condições e a Política de Privacidade da LastDance.'}
              </p>
              <button type="submit" disabled={loading} className="btn-premium">
                {loading ? 'A processar...' : (step === 1 ? 'Próximo Passo' : 'Confirmar Inscrição')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
