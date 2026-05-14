import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, ArrowRight, ArrowLeft, Hash, Lock } from 'lucide-react';
import { validateSchoolCode } from '../../api/firebase';
import { isValidNIF } from '../../utils/validation';
import './AccountSetup.css';

const AccountSetup = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nif: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const savedData = localStorage.getItem('temp_reg_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(prev => ({
        ...prev,
        nif: parsed.nif || '',
        password: parsed.password || '',
        confirmPassword: parsed.password || ''
      }));
    }

    const checkCode = async () => {
      const school = await validateSchoolCode(code);
      if (!school) {
        navigate('/');
      }
    };
    checkCode();
  }, [code, navigate]);

  const [errors, setErrors] = useState({
    nif: false,
    passwordMatch: false,
    passwordLength: false
  });

  const handleBack = () => {
    localStorage.removeItem('temp_reg_data');
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isNifValid = isValidNIF(formData.nif);
    const passwordsMatch = formData.password === formData.confirmPassword;
    const isPasswordLongEnough = formData.password.length >= 6;

    setErrors({
      nif: !isNifValid,
      passwordMatch: !passwordsMatch,
      passwordLength: !isPasswordLongEnough
    });

    if (isNifValid && passwordsMatch && isPasswordLongEnough) {
      setLoading(true);
      // Store in local storage for the next step and persistence
      localStorage.setItem('temp_reg_data', JSON.stringify({
        nif: formData.nif,
        password: formData.password,
        schoolCode: code
      }));
      
      setTimeout(() => {
        navigate(`/register/${code}`);
      }, 800);
    }
  };

  return (
    <div className="setup-page">
      <div className="container">
        <button onClick={handleBack} className="back-to-site">
          <ArrowLeft size={18} /> Voltar para o site
        </button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card setup-card"
        >
          <div className="setup-header">
            <div className="lock-icon-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '50%', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <ShieldCheck size={32} className="text-gold" />
                </div>
            </div>
            <h1>Acesso Seguro</h1>
            <p>Define as tuas credenciais de acesso para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="input-field">
              <label><Hash size={16} /> NIF</label>
              <input 
                type="text" 
                required 
                maxLength={9}
                placeholder="Introduz o teu NIF"
                className={errors.nif ? 'error' : ''}
                value={formData.nif}
                onChange={(e) => setFormData({...formData, nif: e.target.value})}
              />
              {errors.nif && <span className="error-text">NIF inválido</span>}
            </div>

            <div className="input-field">
              <label><Lock size={16} /> Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="Define uma password"
                  className={errors.passwordLength ? 'error' : ''}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button" 
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.passwordLength && <span className="error-text">A password deve ter pelo menos 6 caracteres</span>}
            </div>

            <div className="input-field">
              <label><Lock size={16} /> Confirmar Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  placeholder="Repete a password"
                  className={errors.passwordMatch ? 'error' : ''}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button 
                  type="button" 
                  className="eye-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.passwordMatch && <span className="error-text">As passwords não coincidem</span>}
            </div>

            <button type="submit" disabled={loading} className="btn-premium w-full">
              {loading ? 'A processar...' : 'Próximo Passo'} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="setup-footer">
            <p>Os teus dados estão seguros e encriptados.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSetup;
