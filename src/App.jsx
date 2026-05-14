import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import Home from './pages/public/Home';
import Register from './pages/portal/Register';
import AccountSetup from './pages/portal/AccountSetup';
import Success from './pages/portal/Success';
import ClientArea from './pages/portal/ClientArea';
import AdminDashboard from './pages/admin/Dashboard';
import Footer from './layouts/Footer';
import Preloader from './components/Preloader';
import CookiePolicy from './pages/public/CookiePolicy';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import Terms from './pages/public/Terms';
import AdminLogin from './pages/admin/AdminLogin';
import StarCanvas from './components/StarCanvas';

function App() {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if preloader has already been shown in this session
    return sessionStorage.getItem('preloaderShown') !== 'true';
  });

  const handleLoadingComplete = () => {
    sessionStorage.setItem('preloaderShown', 'true');
    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isLoading]);

  return (
    <Router>
      <div className="app-wrapper">
        {isLoading && <Preloader onLoadingComplete={handleLoadingComplete} />}
        {!isLoading && <StarCanvas />}
        
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
      </div>
    </Router>
  );
}

export default App;
