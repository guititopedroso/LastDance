import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Admin.css';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'lddc2026') {
      onLogin('admin');
    } else if (password === 'staffld2026') {
      onLogin('staff');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="admin-login-page">
      <Link to="/" className="back-to-site admin-back">
        <ArrowLeft size={18} /> Voltar para o site
      </Link>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card login-card"
      >
        <div className="login-header">
          <div className="lock-icon">
            <Lock size={32} className="text-gold" />
          </div>
          <h1>Acesso Restrito</h1>
          <p>Introduz a password administrativa para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="input-group-simple">
            <input 
              type="password" 
              placeholder="Password de Administrador" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'error' : ''}
              required 
            />
          </div>
          {error && <p className="error-text">Password incorreta!</p>}
          <button type="submit" className="btn-premium w-full">
            Entrar no Painel <LogIn size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
