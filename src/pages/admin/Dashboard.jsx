import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  FileText, 
  LogOut, 
  Plus, 
  Search, 
  Download,
  CheckCircle,
  Clock,
  Copy,
  Trash2
} from 'lucide-react';
import './Admin.css';
import { 
  getAllCodes, 
  deleteCode, 
  addSchoolCode, 
  getAllRegistrations,
  deleteRegistration,
  registerStudent
} from '../../api/firebase';

import AdminLogin from './AdminLogin';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = () => {
    sessionStorage.setItem('adminAuth', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const Sidebar = () => (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="admin-logo-wrapper">
          <img src="/logo_transparent.png" alt="Last Dance" className="admin-logo-img" />
          <span className="badge-admin">Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/admin" className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={20} /> Painel Geral
        </Link>
        <Link to="/admin/codes" className={activeTab === 'codes' ? 'active' : ''} onClick={() => setActiveTab('codes')}>
          <Key size={20} /> Códigos de Escola
        </Link>
        <Link to="/admin/attendees" className={activeTab === 'attendees' ? 'active' : ''} onClick={() => setActiveTab('attendees')}>
          <Users size={20} /> Gestão de Inscritos
        </Link>
      </nav>
      <div className="sidebar-footer">
        <Link to="/" className="btn-logout"><LogOut size={18} /> Sair</Link>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/codes" element={<CodeManager />} />
          <Route path="/attendees" element={<AttendeeManager />} />
        </Routes>
      </div>
    </div>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAllRegistrations();
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        paid: data.filter(a => a.status === 'paid').length
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Olá, Administrador</h1>
        <p>Resumo em tempo real da LastDance.</p>
      </header>
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <Users size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Inscritos</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <CheckCircle size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.paid}</h3>
            <p>Pagamentos Confirmados</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <Clock size={24} className="text-gold" />
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pagamentos Pendentes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeManager = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', location: '' });
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const data = await getAllCodes();
      setCodes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.location) return;

    // Alphanumeric code generator (8 chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 8; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      await addSchoolCode(newCode, newSchool.name, newSchool.location);
      setNewSchool({ name: '', location: '' });
      setShowForm(false);
      fetchCodes();
      showToast('Código criado com sucesso');
    } catch (error) {
      alert("Erro ao criar código.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apagar este código permanentemente?")) {
      await deleteCode(id);
      fetchCodes();
      showToast('Código apagado');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>Gestor de Códigos</h1>
          <p>Gere os códigos de acesso para cada evento.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-premium">
          {showForm ? 'Cancelar' : 'Gerar Novo Código'}
        </button>
      </header>

      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card admin-form-card"
          style={{ marginBottom: '30px', padding: '30px' }}
        >
          <form onSubmit={handleCreateCode} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div className="input-group-simple" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Nome da Escola</label>
              <input 
                type="text" 
                placeholder="Ex: Escola Secundária de Camões" 
                value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                required 
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Localização</label>
              <input 
                type="text" 
                placeholder="Ex: Lisboa" 
                value={newSchool.location}
                onChange={(e) => setNewSchool({...newSchool, location: e.target.value})}
                required 
              />
            </div>
            <button type="submit" className="btn-premium" style={{ height: '48px' }}>Criar Agora</button>
          </form>
        </motion.div>
      )}

      <div className="admin-table-wrapper glass-card">
        {loading ? <p style={{padding: '20px'}}>A carregar...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Escola</th>
                <th>Localização</th>
                <th>Código</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id}>
                  <td>{c.schoolName}</td>
                  <td>{c.location || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <code className="code-badge">{c.code}</code>
                      <button 
                        onClick={() => {
                          const text = c.code;
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(text);
                          } else {
                            const textArea = document.createElement("textarea");
                            textArea.value = text;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                          }
                          showToast('Código copiado');
                        }}
                        className="btn-icon-small"
                        title="Copiar Código"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(c.id)} className="btn-delete">Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-toast"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
};

const AttendeeManager = () => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // Attendee to delete
  const [schools, setSchools] = useState([]);
  const [newAttendee, setNewAttendee] = useState({
    firstName: '', lastName: '', nif: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full'
  });

  const fetchData = async () => {
    setLoading(true);
    const [regData, schoolData] = await Promise.all([
      getAllRegistrations(),
      getAllCodes()
    ]);
    setAttendees(regData);
    setSchools(schoolData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRegistration(confirmDelete.id);
      setConfirmDelete(null);
      setSelectedAttendee(null);
      fetchData();
    } catch (error) {
      alert("Erro ao eliminar.");
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      await registerStudent({
        ...newAttendee,
        status: 'pending',
        paidInstallments: 0,
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setNewAttendee({ firstName: '', lastName: '', nif: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full' });
      fetchData();
    } catch (error) {
      alert("Erro ao adicionar inscrito.");
    }
  };

  const getStatusBadge = (status) => {
    const labels = { pending: 'Pendente', paid: 'Pago', partial: 'Parcial' };
    return <span className={`status-badge ${status}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>Lista de Inscritos</h1>
          <p>Gere as inscrições e pagamentos manualmente.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-premium">
          {showAddForm ? 'Cancelar' : 'Adicionar Manualmente'}
        </button>
      </header>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card admin-form-card"
          style={{ marginBottom: '30px', padding: '30px' }}
        >
          <form onSubmit={handleManualAdd} className="admin-manual-form">
            <div className="form-row">
              <input type="text" placeholder="Nome" value={newAttendee.firstName} onChange={e => setNewAttendee({...newAttendee, firstName: e.target.value})} required />
              <input type="text" placeholder="Apelido" value={newAttendee.lastName} onChange={e => setNewAttendee({...newAttendee, lastName: e.target.value})} required />
            </div>
            <div className="form-row">
              <input type="text" placeholder="NIF" value={newAttendee.nif} onChange={e => setNewAttendee({...newAttendee, nif: e.target.value})} required />
              <select value={newAttendee.schoolCode} onChange={e => setNewAttendee({...newAttendee, schoolCode: e.target.value})} required>
                <option value="">Selecionar Escola</option>
                {schools.map(s => <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>)}
              </select>
            </div>
            <div className="form-row">
              <input type="email" placeholder="Email" value={newAttendee.email} onChange={e => setNewAttendee({...newAttendee, email: e.target.value})} required />
              <input type="tel" placeholder="Telemóvel" value={newAttendee.phone} onChange={e => setNewAttendee({...newAttendee, phone: e.target.value})} required />
            </div>
            <div className="form-row">
              <select value={newAttendee.paymentPlan} onChange={e => setNewAttendee({...newAttendee, paymentPlan: e.target.value})}>
                <option value="full">Pagamento Total</option>
                <option value="installments">3 Prestações</option>
              </select>
              <button type="submit" className="btn-premium">Adicionar Aluno</button>
            </div>
          </form>
        </motion.div>
      )}
      <div className="admin-table-wrapper glass-card">
        {loading ? <p style={{padding: '20px'}}>A carregar...</p> : (
          <table className="admin-table clickable">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Escola</th>
                <th>Plano</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map(a => (
                <tr key={a.id} onClick={() => setSelectedAttendee(a)}>
                  <td>{a.firstName} {a.lastName}</td>
                  <td>{a.schoolCode}</td>
                  <td>{a.paymentPlan === 'installments' ? '3 Prestações' : 'Total'}</td>
                  <td>{getStatusBadge(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAttendee && (
        <div className="admin-modal-overlay" onClick={() => setSelectedAttendee(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="admin-modal glass-card"
            onClick={e => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2>Detalhes do Inscrito</h2>
              <button className="btn-close" onClick={() => setSelectedAttendee(null)}>&times;</button>
            </header>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Informação Pessoal</h4>
                <div className="detail-grid">
                  <div className="detail-item"><span>Nome:</span> <strong>{selectedAttendee.firstName} {selectedAttendee.lastName}</strong></div>
                  <div className="detail-item"><span>Email:</span> <strong>{selectedAttendee.email}</strong></div>
                  <div className="detail-item"><span>Telemóvel:</span> <strong>{selectedAttendee.phone}</strong></div>
                  <div className="detail-item"><span>NIF:</span> <strong>{selectedAttendee.nif}</strong></div>
                </div>
              </div>

              <div className="detail-section payment-status-section">
                <h4>Estado de Pagamento</h4>
                <div className="payment-summary">
                  <div className="plan-info detail-row-inline">
                    <span>Plano Escolhido:</span>
                    <strong>{selectedAttendee.paymentPlan === 'installments' ? '3 Prestações (3x 18.34€)' : 'Pagamento Total (55€)'}</strong>
                  </div>
                  <div className="progress-info detail-row-inline">
                    <span>Progresso:</span>
                    <div className="payment-pills" style={{ marginTop: 0 }}>
                      {selectedAttendee.paymentPlan === 'installments' ? (
                        <>
                          <span className={`pill ${selectedAttendee.paidInstallments >= 1 ? 'paid' : ''}`}>
                            1ª Prest. {selectedAttendee.paidInstallments >= 1 ? ' (Paga)' : ' (Pendente)'}
                          </span>
                          <span className={`pill ${selectedAttendee.paidInstallments >= 2 ? 'paid' : ''}`}>
                            2ª Prest. {selectedAttendee.paidInstallments >= 2 ? ' (Paga)' : ' (Pendente)'}
                          </span>
                          <span className={`pill ${selectedAttendee.paidInstallments >= 3 ? 'paid' : ''}`}>
                            3ª Prest. {selectedAttendee.paidInstallments >= 3 ? ' (Paga)' : ' (Pendente)'}
                          </span>
                        </>
                      ) : (
                        <span className={`pill ${selectedAttendee.status === 'paid' ? 'paid' : ''}`}>
                          {selectedAttendee.status === 'paid' ? 'Totalidade Paga' : 'Pagamento Total Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-premium">Confirmar Pagamento</button>
                    <button className="btn-outline-gold">Enviar Lembrete</button>
                  </div>
                  <button onClick={() => setConfirmDelete(selectedAttendee)} className="btn-delete" style={{ padding: '12px 20px' }}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {confirmDelete && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-modal glass-card delete-confirm-modal"
            style={{ maxWidth: '400px', textAlign: 'center' }}
          >
            <div className="delete-icon-large">
              <Trash2 size={40} />
            </div>
            <h2>Confirmar Eliminação</h2>
            <p>Tens a certeza que queres apagar <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong>? Esta ação é irreversível.</p>
            
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              <button className="btn-outline-gold" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-delete" onClick={executeDelete}>Sim, Eliminar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
