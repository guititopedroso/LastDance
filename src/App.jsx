import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import Home from './pages/public/Home';
import Preloader from './components/Preloader';

// Lazy load heavy components and other pages
const Register = lazy(() => import('./pages/portal/Register'));
const AccountSetup = lazy(() => import('./pages/portal/AccountSetup'));
const Success = lazy(() => import('./pages/portal/Success'));
const ClientArea = lazy(() => import('./pages/portal/ClientArea'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Footer = lazy(() => import('./layouts/Footer'));
const CookiePolicy = lazy(() => import('./pages/public/CookiePolicy'));
const CookieConsent = lazy(() => import('./components/CookieConsent'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/public/Terms'));
const StarCanvas = lazy(() => import('./components/StarCanvas'));

function App() {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if preloader has already been shown in this session
    return sessionStorage.getItem('preloaderShown') !== 'true';
  });

  const handleLoadingComplete = () => {
    sessionStorage.setItem('preloaderShown', 'true');
    setIsLoading(false);
  };

  // Não bloqueia o scroll — o preloader é um overlay em cima do conteúdo
  // Detetar se é mobile/touch para desativar o StarCanvas
  const isMobile = useRef(window.innerWidth <= 768 || 'ontouchstart' in window).current;

  return (
    <Router>
      <div className="app-wrapper">
        <Suspense fallback={null}>
          {isLoading && <Preloader onLoadingComplete={handleLoadingComplete} />}
          {!isLoading && !isMobile && <StarCanvas />}
          
          <Routes>
            {/* Admin routes don't show the main Navbar */}
            <Route path="/admin/*" element={<AdminDashboard />} />
            
            {/* Public/Portal routes show the main Navbar */}
            <Route path="*" element={
              <>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register/:code" element={<Register />} />
                    <Route path="/setup-account/:code" element={<AccountSetup />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/area-cliente" element={<ClientArea />} />
                    <Route path="/termos" element={<Terms />} />
                    <Route path="/privacidade" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                  </Routes>
                </main>
                <Footer />
                <CookieConsent />
              </>
            } />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
