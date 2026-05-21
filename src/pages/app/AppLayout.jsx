import React, { Suspense } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppAuthProvider, useAppAuth } from '../../context/AppAuthContext';
import BottomNav from '../../components/app/BottomNav';
import './AppLayout.css';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in:      { opacity: 1, x: 0 },
  out:     { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.25,
};

const PageLoader = () => (
  <div style={{
    minHeight: '100dvh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#09090b'
  }}>
    <div className="spinner" />
  </div>
);

// Protected routes inside the layout
const AppLayoutContent = () => {
  const { user, loading } = useAppAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === '/app/login' || location.pathname === '/app/login/';

  if (loading) {
    return <PageLoader />;
  }

  // Route guard: if not logged in and not on login, redirect to login
  if (!user && !isLoginPage) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // If logged in and on login, redirect to home
  if (user && isLoginPage) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="ld-app-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Show Bottom Nav if logged in and not on login page */}
      {user && !isLoginPage && <BottomNav />}
    </div>
  );
};

const AppLayout = () => {
  return (
    <AppAuthProvider>
      <div className="ld-app-root">
        <AppLayoutContent />
      </div>
    </AppAuthProvider>
  );
};

export default AppLayout;
