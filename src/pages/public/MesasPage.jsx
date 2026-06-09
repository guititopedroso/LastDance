import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../api/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import mesasData from '../../data/mesas.json';
import { 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Grid,
  Layers,
  Clock
} from 'lucide-react';
import './MesasPage.css';

// Helper to normalize names for comparison
const normalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\(.*\)/g, "") // Remove content in parentheses
    .replace(/12º\s*[a-z0-9]+/gi, "") 
    .replace(/12°\s*[a-z0-9]+/gi, "") 
    .replace(/12\s*[a-z0-9]+/gi, "") 
    .replace(/[^a-z]/g, ""); 
};

const PAGE_CYCLE_TIME = 15; // seconds per page in carousel mode

export default function MesasPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState('overview'); // 'overview' (6x4 grid) or 'carousel' (rotating pages)
  
  // Carousel States
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(PAGE_CYCLE_TIME);
  const [tablesPerPage, setTablesPerPage] = useState(6);

  // General States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls handler for TV screens
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('click', resetControlsTimeout);
    resetControlsTimeout();

    return () => {
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('click', resetControlsTimeout);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Live Firebase connection for school code '39GK8FU7' (Escola Secundária de Alcochete)
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("schoolCode", "==", "39GK8FU7")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = [];
      snapshot.forEach((doc) => {
        regs.push({ id: doc.id, ...doc.data() });
      });
      setRegistrations(regs);
      setLoading(false);
    }, (error) => {
      console.error("Error loading real-time registrations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Map for fast O(1) name lookup
  const registrationMap = useMemo(() => {
    const map = new Map();
    registrations.forEach(reg => {
      const fullName = `${reg.firstName || ''} ${reg.lastName || ''}`.trim();
      const norm = normalizeName(fullName);
      if (norm) {
        map.set(norm, reg);
      }
    });
    return map;
  }, [registrations]);

  // Check if a guest from PDF is checkedIn in Firestore
  const isGuestCheckedIn = (guestName, guestDetail) => {
    const norm = normalizeName(guestName + ' ' + (guestDetail || ''));
    if (!norm) return false;

    if (registrationMap.has(norm)) {
      return !!registrationMap.get(norm).checkedIn;
    }

    for (const [key, value] of registrationMap.entries()) {
      if (key === norm || key.includes(norm) || norm.includes(key)) {
        return !!value.checkedIn;
      }
    }
    return false;
  };

  // Stats calculation
  const totalRegistrations = registrations.length;
  const checkedInCount = useMemo(() => {
    return registrations.filter(r => r.checkedIn).length;
  }, [registrations]);

  const checkInPercentage = totalRegistrations > 0 
    ? Math.round((checkedInCount / totalRegistrations) * 100) 
    : 0;

  // Carousel mode paging
  const totalPages = Math.ceil(mesasData.length / tablesPerPage);
  const currentCarouselTables = useMemo(() => {
    const start = currentPage * tablesPerPage;
    return mesasData.slice(start, start + tablesPerPage);
  }, [currentPage, tablesPerPage]);

  // Carousel Auto-slide effect
  useEffect(() => {
    if (layoutMode !== 'carousel' || !isPlaying) return;

    setSecondsRemaining(PAGE_CYCLE_TIME);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setCurrentPage(current => (current + 1) % totalPages);
          return PAGE_CYCLE_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalPages, currentPage, layoutMode]);

  // Live Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen trigger and listener
  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Error entering fullscreen:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePrevPage = () => {
    setCurrentPage(prev => (prev === 0 ? totalPages - 1 : prev - 1));
    setSecondsRemaining(PAGE_CYCLE_TIME);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
    setSecondsRemaining(PAGE_CYCLE_TIME);
  };

  const formattedTime = currentTime.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`gala-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Gold Borders */}
      <div className="gala-outer-border"></div>
      <div className="gala-inner-border"></div>

      {/* Side Decorative Accents */}
      <div className="gala-side-light left-glow"></div>
      <div className="gala-side-light right-glow"></div>

      {/* Ambient Sparkles */}
      <div className="gala-sparkle sparkle-1">★</div>
      <div className="gala-sparkle sparkle-2">✦</div>
      <div className="gala-sparkle sparkle-3">★</div>
      <div className="gala-sparkle sparkle-4">✦</div>
      <div className="gala-sparkle sparkle-5">★</div>

      {/* Left Vertical Ribbon */}
      <aside className="gala-ribbon">
        <div className="ribbon-content">
          <div className="ribbon-cap-icon"></div>
          <span className="ribbon-text-seating">SEATING</span>
          <span className="ribbon-text-plan">Plan</span>
        </div>
        <div className="ribbon-tail"></div>
      </aside>

      {/* Right Vertical Accent Divider */}
      <aside className="gala-right-accent">
        <div className="accent-line"></div>
        <div className="accent-ornament">◈</div>
        <div className="accent-line-short"></div>
      </aside>

      {/* Auto-fading Floating Controls Panel */}
      <div className={`gala-controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
        <div className="overlay-panel">
          {/* Mode Switcher */}
          <button 
            onClick={() => {
              setLayoutMode(layoutMode === 'overview' ? 'carousel' : 'overview');
              setCurrentPage(0);
            }} 
            className="control-btn"
            title="Mudar Layout"
          >
            {layoutMode === 'overview' ? <Layers size={14} /> : <Grid size={14} />}
            <span>{layoutMode === 'overview' ? 'Modo Rotativo' : 'Modo Geral'}</span>
          </button>

          {/* Carousel Navigation */}
          {layoutMode === 'carousel' && (
            <div className="pagination-group">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className={`control-btn-icon ${isPlaying ? 'active' : ''}`}
                title={isPlaying ? "Pausar Slideshow" : "Iniciar Slideshow"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={handlePrevPage} className="control-btn-icon">
                <ChevronLeft size={14} />
              </button>
              <span className="page-indicator">
                {currentPage + 1}/{totalPages} {isPlaying && `(${secondsRemaining}s)`}
              </span>
              <button onClick={handleNextPage} className="control-btn-icon">
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Tables per Page (in carousel mode) */}
          {layoutMode === 'carousel' && (
            <select 
              value={tablesPerPage} 
              onChange={(e) => {
                setTablesPerPage(Number(e.target.value));
                setCurrentPage(0);
                setSecondsRemaining(PAGE_CYCLE_TIME);
              }}
              className="select-dropdown"
            >
              <option value={4}>4 Mesas</option>
              <option value={6}>6 Mesas</option>
              <option value={8}>8 Mesas</option>
            </select>
          )}

          {/* Time display helper */}
          <div className="clock-indicator">
            <Clock size={14} style={{ marginRight: 6 }} />
            <span>{formattedTime}</span>
          </div>

          {/* Fullscreen Button */}
          <button onClick={toggleFullscreen} className="control-btn-icon" title="Ecrã Inteiro">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* Main Board Canvas */}
      <div className="gala-canvas">
        {/* Main Header */}
        <header className="gala-header">
          <h1 className="gala-main-title">GALA DE FINALISTAS</h1>
          <p className="gala-school-title">ESCOLA SECUNDÁRIA DE ALCOCHETE</p>
          <div className="gala-year-badge">2025 / 2026</div>
          <div className="gala-header-divider">
            <span className="divider-ornament left"></span>
            <span className="divider-diamond"></span>
            <span className="divider-ornament right"></span>
          </div>
        </header>

        {/* Dynamic Seating Plan Body */}
        {loading ? (
          <div className="gala-loading">
            <div className="gold-spinner"></div>
            <p>A carregar o plano de mesas...</p>
          </div>
        ) : (
          <div className="gala-board-content">
            {layoutMode === 'overview' ? (
              /* Overview Mode (6 columns, 4 rows) */
              <div className="overview-grid">
                {mesasData.map((table) => {
                  const tableCheckedInCount = table.guests.filter(g => isGuestCheckedIn(g.name, g.detail)).length;
                  const tableTotalCount = table.guests.length;
                  const isTableComplete = tableCheckedInCount === tableTotalCount && tableTotalCount > 0;

                  return (
                    <div 
                      key={table.id} 
                      className={`gala-card ${isTableComplete ? 'table-complete' : ''}`}
                    >
                      <div className="gala-card-header">
                        <h2>MESA {table.id}</h2>
                      </div>
                      <div className="gala-card-guests">
                        {table.guests.map((guest, gIdx) => {
                          const isPresent = isGuestCheckedIn(guest.name, guest.detail);
                          return (
                            <span 
                              key={gIdx} 
                              className={`gala-guest-name ${isPresent ? 'present' : 'absent'}`}
                            >
                              {guest.name}
                              {guest.detail && (
                                <span className="class-badge"> {guest.detail.replace(/[()]/g, '')}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Carousel Mode */
              <div className={`carousel-grid cols-${tablesPerPage}`}>
                {currentCarouselTables.map((table) => {
                  const tableCheckedInCount = table.guests.filter(g => isGuestCheckedIn(g.name, g.detail)).length;
                  const tableTotalCount = table.guests.length;
                  const isTableComplete = tableCheckedInCount === tableTotalCount && tableTotalCount > 0;

                  return (
                    <div 
                      key={table.id} 
                      className={`gala-card large ${isTableComplete ? 'table-complete' : ''}`}
                    >
                      <div className="gala-card-header">
                        <h2>MESA {table.id}</h2>
                        <span className="card-subtitle">{table.description}</span>
                      </div>
                      <div className="gala-card-guests">
                        {table.guests.map((guest, gIdx) => {
                          const isPresent = isGuestCheckedIn(guest.name, guest.detail);
                          return (
                            <div 
                              key={gIdx} 
                              className={`gala-guest-row ${isPresent ? 'present' : 'absent'}`}
                            >
                              <span className="gala-guest-name">
                                {guest.name}
                                {guest.detail && (
                                  <span className="class-badge"> {guest.detail.replace(/[()]/g, '')}</span>
                                )}
                              </span>
                              {isPresent && <Check size={12} className="check-gold-icon" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Elegant Bottom Footer & Real-time Progress Bar */}
        <footer className="gala-footer">
          {/* Progress bar container integrated nicely */}
          <div className="gala-progress-container">
            <div className="progress-details">
              <span>CONTROLO DE ENTRADAS:</span>
              <span className="percentage-counter">{checkedInCount} / {totalRegistrations} PRESENTES ({checkInPercentage}%)</span>
            </div>
            <div className="gold-progress-bar-wrapper">
              <div 
                className="gold-progress-bar-fill"
                style={{ width: `${checkInPercentage}%` }}
              >
                <div className="progress-bar-shine"></div>
              </div>
            </div>
          </div>

          <p className="gala-footer-thankyou">
            OBRIGADO POR FAZEREM PARTE DESTA NOITE INESQUECÍVEL!
          </p>
        </footer>
      </div>
    </div>
  );
}
