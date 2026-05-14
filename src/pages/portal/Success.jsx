import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Copy, Download, Info } from 'lucide-react';
import './Success.css';

const Success = () => {
  const location = useLocation();
  const { formData, code } = location.state || { formData: { firstName: 'Inscrito' }, code: 'XXXXXX' };

  const mbData = {
    entity: '21054',
    reference: Math.floor(Math.random() * 900000000 + 100000000).toString().match(/.{1,3}/g).join(' '),
    amount: formData.paymentPlan === 'installments' ? '18,34€' : '55,00€',
    isInstallment: formData.paymentPlan === 'installments'
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <div className="success-page section-padding">
      <div className="container">
        <div className="success-layout">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="success-message"
          >
            <div className="status-icon">
              <CheckCircle size={80} color="var(--color-gold)" />
            </div>
            <h1>Inscrição Pré-Confirmada!</h1>
            <p>Olá <strong>{formData.firstName}</strong>, o teu registo para a escola <strong>{code}</strong> foi recebido com sucesso. Para garantires o teu bilhete, efetua o pagamento por Referência Multibanco abaixo.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="payment-card glass-card"
          >
            <div className="payment-header">
              <CreditCard className="text-gold" />
              <h3>Dados de Pagamento</h3>
            </div>

            <div className="mb-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Logo_Multibanco.svg/2560px-Logo_Multibanco.svg.png" alt="Multibanco" />
            </div>

            <div className="payment-details">
              <div className="detail-row">
                <span>Entidade</span>
                <strong>{mbData.entity}</strong>
                <button onClick={() => copyToClipboard(mbData.entity)}><Copy size={14}/></button>
              </div>
              <div className="detail-row">
                <span>Referência</span>
                <strong>{mbData.reference}</strong>
                <button onClick={() => copyToClipboard(mbData.reference)}><Copy size={14}/></button>
              </div>
               <div className="detail-row">
                 <span>Valor</span>
                 <div style={{ textAlign: 'right' }}>
                   <strong className="text-gold" style={{ display: 'block' }}>{mbData.amount}</strong>
                   {mbData.isInstallment && <small style={{ fontSize: '0.7rem', opacity: 0.7 }}>1ª de 3 Prestações</small>}
                 </div>
               </div>
            </div>

            <div className="payment-footer">
              <div className="info-box">
                <Info size={16} />
                <p>O comprovativo de pagamento será enviado para <strong>{formData.email}</strong> após a validação do sistema (até 24h).</p>
              </div>
              <Link to="/" className="btn-secondary">Voltar ao Início</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Success;
