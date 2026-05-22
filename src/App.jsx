import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import Home from './pages/public/Home';
import Preloader from './components/Preloader';

// Lazy load heavy components and other pages
const Register = lazy(() => import('./pages/portal/Register'));
const Success = lazy(() => import('./pages/portal/Success'));
const ClientArea = lazy(() => import('./pages/portal/ClientArea'));
const Memorias = lazy(() => import('./pages/portal/Memorias'));
const DownloadApp = lazy(() => import('./pages/public/DownloadApp'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Footer = lazy(() => import('./layouts/Footer'));
const CookiePolicy = lazy(() => import('./pages/public/CookiePolicy'));
const CookieConsent = lazy(() => import('./components/CookieConsent'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/public/Terms'));
const StarCanvas = lazy(() => import('./components/StarCanvas'));
const InstallAppBanner = lazy(() => import('./components/InstallAppBanner'));

// Lazy load PWA WebApp pages
const AppLayout = lazy(() => import('./pages/app/AppLayout'));
const AppLogin = lazy(() => import('./pages/app/AppLogin'));
const AppHome = lazy(() => import('./pages/app/AppHome'));
const AppMemorias = lazy(() => import('./pages/app/AppMemorias'));
const AppPremios = lazy(() => import('./pages/app/AppPremios'));

// Simple route guard for student portal
const ProtectedRoute = ({ children }) => {
  const session = localStorage.getItem('student_session');
  const location = useLocation();
  if (!session) {
    return <Navigate to="/area-cliente" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  // Detetar se é mobile/touch para desativar o Preloader e o StarCanvas
  const isMobile = useRef(
    typeof window !== 'undefined' &&
    (window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0)
  ).current;

  // Em mobile, nunca mostra o preloader
  const [isLoading, setIsLoading] = useState(() => {
    if (isMobile) return false; // mobile: sem preloader, scroll imediato
    return sessionStorage.getItem('preloaderShown') !== 'true';
  });

  const handleLoadingComplete = () => {
    sessionStorage.setItem('preloaderShown', 'true');
    setIsLoading(false);
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Suspense fallback={null}>
          {isLoading && <Preloader onLoadingComplete={handleLoadingComplete} />}
          {!isLoading && !isMobile && <StarCanvas />}
          <InstallAppBanner />
          
          <Routes>
            {/* Admin routes don't show the main Navbar */}
            <Route path="/admin/*" element={<AdminDashboard />} />
            
            {/* App (PWA) routes - separate layout, no main Navbar/Footer */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppHome />} />
              <Route path="login" element={<AppLogin />} />
              <Route path="memorias" element={<AppMemorias />} />
              <Route path="premios" element={<AppPremios />} />
            </Route>
            
            {/* Public/Portal routes show the main Navbar */}
            <Route path="*" element={
              <>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/register/:code" element={<Register />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/area-cliente" element={<ClientArea />} />
                    <Route path="/memorias" element={
                      <ProtectedRoute>
                        <Memorias />
                      </ProtectedRoute>
                    } />
                    <Route path="/app-install" element={<DownloadApp />} />
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
