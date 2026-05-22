import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Trophy,
  LogOut, 
  Plus, 
  Search, 
  CheckCircle,
  Clock,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  RefreshCw
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
import {
  db
} from '../../api/firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, onSnapshot, writeBatch
} from 'firebase/firestore';

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
          <img src="/logo_transparent.webp" alt="Last Dance" className="admin-logo-img" />
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
        <Link to="/admin/premios" className={activeTab === 'premios' ? 'active' : ''} onClick={() => setActiveTab('premios')} style={{ color: activeTab === 'premios' ? '#e11d48' : undefined }}>
          <Trophy size={20} /> Prémios / Votação
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
          <Route path="/premios" element={<PremiosManager />} />
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
  const [newSchool, setNewSchool] = useState({ name: '', location: '', ballDate: '' });
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
    if (!newSchool.name || !newSchool.location || !newSchool.ballDate) return;

    // Alphanumeric code generator (8 chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 8; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      await addSchoolCode(newCode, newSchool.name, newSchool.location, newSchool.ballDate);
      setNewSchool({ name: '', location: '', ballDate: '' });
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
          <form onSubmit={handleCreateCode} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Nome da Escola</label>
              <input 
                type="text" 
                placeholder="Ex: Escola Secundária de Camões" 
                value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                required 
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Localização</label>
              <input 
                type="text" 
                placeholder="Ex: Lisboa" 
                value={newSchool.location}
                onChange={(e) => setNewSchool({...newSchool, location: e.target.value})}
                required 
              />
            </div>
            <div className="input-group-simple" style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Data do Baile</label>
              <input 
                type="date" 
                value={newSchool.ballDate}
                onChange={(e) => setNewSchool({...newSchool, ballDate: e.target.value})}
                required 
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <button type="submit" className="btn-premium" style={{ height: '48px', whiteSpace: 'nowrap' }}>Criar Agora</button>
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
                <th>Data do Baile</th>
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
                    {c.ballDate
                      ? new Date(c.ballDate + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                      : <span style={{ color: 'var(--color-gray-400)', fontSize: '0.85rem' }}>Sem data</span>
                    }
                  </td>
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
    firstName: '', lastName: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full'
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
      setNewAttendee({ firstName: '', lastName: '', email: '', phone: '', schoolCode: '', paymentPlan: 'full' });
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
              <input type="email" placeholder="Email" value={newAttendee.email} onChange={e => setNewAttendee({...newAttendee, email: e.target.value})} required />
              <input type="tel" placeholder="Telemóvel" value={newAttendee.phone} onChange={e => setNewAttendee({...newAttendee, phone: e.target.value})} required />
            </div>
            <div className="form-row">
              <select value={newAttendee.schoolCode} onChange={e => setNewAttendee({...newAttendee, schoolCode: e.target.value})} required>
                <option value="">Selecionar Escola</option>
                {schools.map(s => <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>)}
              </select>
              <select value={newAttendee.paymentPlan} onChange={e => setNewAttendee({...newAttendee, paymentPlan: e.target.value})}>
                <option value="full">Pagamento Total</option>
                <option value="installments">5 Prestações</option>
              </select>
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
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
                  <td>{a.paymentPlan === 'installments' ? '5 Prestações' : 'Total'}</td>
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
                  <div className="detail-item"><span>Inscrição ID:</span> <strong style={{ fontSize: '0.85em' }}>{selectedAttendee.id}</strong></div>
                </div>
              </div>

              <div className="detail-section payment-status-section">
                <h4>Estado de Pagamento</h4>
                <div className="payment-summary">
                  <div className="plan-info detail-row-inline">
                    <span>Plano Escolhido:</span>
                    <strong>{selectedAttendee.paymentPlan === 'installments' ? '5 Prestações (5x 11.00€)' : 'Pagamento Total (55€)'}</strong>
                  </div>
                  <div className="progress-info detail-row-inline">
                    <span>Progresso:</span>
                    <div className="payment-pills" style={{ marginTop: 0 }}>
                      {selectedAttendee.paymentPlan === 'installments' ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`pill ${selectedAttendee.paidInstallments > i ? 'paid' : ''}`}
                            >
                              {i + 1}ª Prest. {selectedAttendee.paidInstallments > i ? '(Paga)' : '(Pendente)'}
                            </span>
                          ))}
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

/* ══════════════════════════════════════════════════════
   PRÉMIOS MANAGER
   ══════════════════════════════════════════════════════ */
const PremiosManager = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState({ titulo: '', descricao: '', emoji: '🏆', ordem: 1 });
  const [rankings, setRankings] = useState({}); // { [catId]: [{nifVotado, nomeVotado, votos}] }
  const [globalRankings, setGlobalRankings] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const [confirmResetStep, setConfirmResetStep] = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Load school codes
  useEffect(() => {
    getAllCodes().then(data => setSchools(data));
  }, []);

  // Real-time categories listener
  useEffect(() => {
    if (!selectedSchool) { setCategorias([]); return; }
    setLoadingCats(true);
    const q = query(
      collection(db, 'votacao', selectedSchool, 'categorias'),
      orderBy('ordem', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingCats(false);
    });
    return () => unsub();
  }, [selectedSchool]);

  // Real-time global votes listener across all categories
  useEffect(() => {
    if (!selectedSchool || categorias.length === 0) {
      setGlobalRankings([]);
      setRankings({});
      return;
    }

    const unsubs = [];
    const allVotes = {}; // { [catId]: { [nifVotado]: { nomeVotado, votos } } }

    const updateGlobalRanking = () => {
      const aggregates = {}; // { [nifVotado]: { nomeVotado, totalVotos, detalheCategorias } }

      Object.entries(allVotes).forEach(([catId, catCounts]) => {
        const catObj = categorias.find(c => c.id === catId);
        const emoji = catObj?.emoji || '🏆';
        const titulo = catObj?.titulo || '';

        Object.entries(catCounts).forEach(([nif, info]) => {
          if (!aggregates[nif]) {
            aggregates[nif] = {
              nifVotado: nif,
              nomeVotado: info.nomeVotado,
              totalVotos: 0,
              detalheCategorias: []
            };
          }
          aggregates[nif].totalVotos += info.votos;
          aggregates[nif].detalheCategorias.push({
            catId,
            titulo: `${emoji} ${titulo}`,
            votos: info.votos
          });
        });
      });

      const sorted = Object.values(aggregates).sort((a, b) => b.totalVotos - a.totalVotos);
      setGlobalRankings(sorted);
    };

    categorias.forEach(cat => {
      const colRef = collection(db, 'votacao', selectedSchool, 'votos', cat.id, 'respostas');
      const unsub = onSnapshot(colRef, (snap) => {
        const catCounts = {};
        snap.docs.forEach(d => {
          const { nifVotado, nomeVotado } = d.data();
          if (!catCounts[nifVotado]) catCounts[nifVotado] = { nomeVotado, votos: 0 };
          catCounts[nifVotado].votos++;
        });

        const sortedCat = Object.values(catCounts).sort((a, b) => b.votos - a.votos);
        setRankings(prev => ({ ...prev, [cat.id]: sortedCat }));

        allVotes[cat.id] = catCounts;
        updateGlobalRanking();
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [selectedSchool, categorias]);

  const handleExpandCat = (catId) => {
    if (expandedCat === catId) { setExpandedCat(null); return; }
    setExpandedCat(catId);
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    if (!selectedSchool) { showToast('Seleciona uma escola primeiro.'); return; }
    try {
      await addDoc(collection(db, 'votacao', selectedSchool, 'categorias'), {
        ...newCat,
        ordem: Number(newCat.ordem),
        ativa: true,
        mostrarResultados: false,
      });
      setNewCat({ titulo: '', descricao: '', emoji: '🏆', ordem: 1 });
      setShowForm(false);
      showToast('✅ Categoria criada!');
    } catch (err) {
      showToast('❌ Erro ao criar categoria.');
    }
  };

  const handleToggle = async (catId, field, current) => {
    try {
      await updateDoc(doc(db, 'votacao', selectedSchool, 'categorias', catId), { [field]: !current });
      showToast(field === 'mostrarResultados' ? (current ? '🔒 Resultados ocultados' : '👁️ Resultados revelados!') : (current ? '⏸️ Categoria desativada' : '▶️ Categoria ativada'));
    } catch { showToast('❌ Erro ao atualizar.'); }
  };

  const handleDeleteCat = async (catId) => {
    if (!window.confirm('Apagar esta categoria e todos os votos?')) return;
    try {
      await deleteDoc(doc(db, 'votacao', selectedSchool, 'categorias', catId));
      showToast('🗑️ Categoria apagada.');
    } catch { showToast('❌ Erro ao apagar.'); }
  };

  const handleResetVotes = (cat) => {
    setConfirmReset(cat);
    setConfirmResetStep(1);
  };

  const executeReset = async () => {
    if (!confirmReset) return;
    try {
      const colRef = collection(db, 'votacao', selectedSchool, 'votos', confirmReset.id, 'respostas');
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showToast('🔄 Votos resetados!');
    } catch { showToast('❌ Erro ao resetar votos.'); }
    setConfirmReset(null);
    setConfirmResetStep(0);
  };

  return (
    <div className="admin-page">
      <header className="admin-header split">
        <div>
          <h1>🏆 Prémios / Votação</h1>
          <p>Gere as categorias e resultados de votação por escola.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 16px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem' }}
          >
            <option value="">Selecionar Escola</option>
            {schools.map(s => (
              <option key={s.id} value={s.code}>{s.schoolName} ({s.code})</option>
            ))}
          </select>
          {selectedSchool && (
            <button onClick={() => setShowForm(!showForm)} className="btn-premium">
              {showForm ? 'Cancelar' : <><Plus size={16} /> Nova Categoria</>}
            </button>
          )}
        </div>
      </header>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="glass-card admin-form-card"
            style={{ marginBottom: 28, padding: 28 }}
          >
            <form onSubmit={handleCreateCat} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 64px' }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emoji</label>
                <input type="text" value={newCat.emoji} onChange={e => setNewCat({...newCat, emoji: e.target.value})} maxLength={2} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: 'white', fontSize: '1.4rem', textAlign: 'center' }} required />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Título</label>
                <input type="text" placeholder="Ex: Mais Popular" value={newCat.titulo} onChange={e => setNewCat({...newCat, titulo: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white' }} required />
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrição</label>
                <input type="text" placeholder="Vota no aluno mais popular..." value={newCat.descricao} onChange={e => setNewCat({...newCat, descricao: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white' }} />
              </div>
              <div style={{ flex: '0 0 80px' }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ordem</label>
                <input type="number" min={1} value={newCat.ordem} onChange={e => setNewCat({...newCat, ordem: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: 'white' }} />
              </div>
              <button type="submit" className="btn-premium" style={{ height: 48, whiteSpace: 'nowrap' }}>Criar Categoria</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / No school selected */}
      {!selectedSchool && (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
          <Trophy size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>Seleciona uma escola para gerir as categorias de votação.</p>
        </div>
      )}

      {/* Resumo Geral de Votações */}
      {selectedSchool && globalRankings.length > 0 && (
        <div className="glass-card" style={{ marginBottom: 28, padding: '24px 28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            📊 Resumo Geral de Votação (Mais Votados)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {globalRankings.slice(0, 6).map((r, i) => (
              <div 
                key={r.nifVotado} 
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  padding: 16, 
                  borderRadius: 12, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div 
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: '50%', 
                        background: i === 0 ? 'rgba(255, 215, 0, 0.15)' : i === 1 ? 'rgba(192, 192, 192, 0.15)' : i === 2 ? 'rgba(205, 127, 50, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: i === 0 ? '#ffd700' : i === 1 ? '#e2e8f0' : i === 2 ? '#cd7f32' : 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{r.nomeVotado}</span>
                  </div>
                  <span style={{ background: 'rgba(225,29,72,0.12)', color: '#fda4af', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
                    {r.totalVotos} {r.totalVotos === 1 ? 'voto' : 'votos'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.detalheCategorias.map((d, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.04)', 
                        border: '1px solid rgba(255, 255, 255, 0.06)', 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        padding: '2px 8px', 
                        borderRadius: 6, 
                        fontSize: '0.72rem' 
                      }}
                    >
                      {d.titulo} ({d.votos})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Table */}
      {selectedSchool && !loadingCats && (
        <div className="admin-table-wrapper glass-card">
          {categorias.length === 0 ? (
            <p style={{ padding: 24, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Sem categorias. Cria a primeira acima.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Ativa</th>
                  <th>Mostrar Resultados</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => (
                  <React.Fragment key={cat.id}>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.4rem' }}>{cat.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{cat.titulo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{cat.descricao}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-icon-small"
                          onClick={() => handleToggle(cat.id, 'ativa', cat.ativa)}
                          title={cat.ativa ? 'Desativar' : 'Ativar'}
                          style={{ color: cat.ativa ? '#4ade80' : undefined }}
                        >
                          {cat.ativa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-icon-small"
                          onClick={() => handleToggle(cat.id, 'mostrarResultados', cat.mostrarResultados)}
                          title={cat.mostrarResultados ? 'Ocultar resultados' : 'Revelar resultados'}
                          style={{ color: cat.mostrarResultados ? '#fbbf24' : undefined }}
                        >
                          {cat.mostrarResultados ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleExpandCat(cat.id)}
                            title="Ver ranking"
                            style={{ color: expandedCat === cat.id ? '#e11d48' : undefined }}
                          >
                            📊
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleResetVotes(cat)}
                            title="Resetar votos"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteCat(cat.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline ranking row */}
                    {expandedCat === cat.id && (
                      <tr>
                        <td colSpan={4} style={{ background: 'rgba(225,29,72,0.04)', padding: '16px 24px' }}>
                          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>🏅 Ranking ao Vivo — {cat.emoji} {cat.titulo}</p>
                          {!rankings[cat.id] || rankings[cat.id].length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Sem votos ainda.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {rankings[cat.id].map((r, i) => (
                                <div key={r.nifVotado} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ width: 24, fontWeight: 800, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)' }}>{i + 1}.</span>
                                  <span style={{ flex: 1, fontWeight: 600 }}>{r.nomeVotado}</span>
                                  <span style={{ background: 'rgba(225,29,72,0.15)', color: '#fb7185', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>{r.votos} {r.votos === 1 ? 'voto' : 'votos'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {loadingCats && <p style={{ padding: '20px', color: 'rgba(255,255,255,0.4)' }}>A carregar categorias...</p>}

      {/* Reset confirmation modal */}
      {confirmReset && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-modal glass-card delete-confirm-modal"
            style={{ maxWidth: 440, textAlign: 'center' }}
          >
            <div className="delete-icon-large"><RefreshCw size={36} /></div>
            <h2>Resetar Votos</h2>
            {confirmResetStep === 1 ? (
              <>
                <p>Apagar <strong>todos os votos</strong> da categoria <strong>{confirmReset.emoji} {confirmReset.titulo}</strong>? Esta ação é irreversível.</p>
                <div className="modal-actions" style={{ justifyContent: 'center', gap: 16, marginTop: 28 }}>
                  <button className="btn-outline-gold" onClick={() => { setConfirmReset(null); setConfirmResetStep(0); }}>Cancelar</button>
                  <button className="btn-delete" style={{ padding: '12px 20px' }} onClick={() => setConfirmResetStep(2)}>Continuar →</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#ff4d4d', fontWeight: 700, marginTop: 8 }}>Última confirmação. Tens a certeza absoluta?</p>
                <div className="modal-actions" style={{ justifyContent: 'center', gap: 16, marginTop: 28 }}>
                  <button className="btn-outline-gold" onClick={() => { setConfirmReset(null); setConfirmResetStep(0); }}>Cancelar</button>
                  <button className="btn-delete" style={{ padding: '12px 20px' }} onClick={executeReset}>Sim, Resetar Tudo</button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

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

export default AdminDashboard;
