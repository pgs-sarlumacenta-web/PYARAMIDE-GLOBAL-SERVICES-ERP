
import React, { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/DataContext.tsx';

// Layouts
import MainLayout from './components/MainLayout.tsx';
import ClientLayout from './components/portal/ClientLayout.tsx';

// Pages
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { Academie } from './pages/Academie.tsx';
// FIX: Changed to a named import for Studio as it is not a default export.
import { Studio } from './pages/Studio.tsx';
import Decor from './pages/Decor.tsx';
import Shop from './pages/Shop.tsx';
import Wifizone from './pages/Wifizone.tsx';
import Achats from './pages/Achats.tsx';
import Finances from './pages/Finances.tsx';
import { Personnel } from './pages/Personnel.tsx';
import Clients from './pages/Clients.tsx';
import Inventaire from './pages/Inventaire.tsx';
import { Securite } from './pages/Securite.tsx';
import Settings from './pages/Settings.tsx';
import Users from './pages/Users.tsx';
import Profile from './pages/Profile.tsx';

// Client Portal Pages
import ClientLogin from './pages/portal/ClientLogin.tsx';
import ClientDashboard from './pages/portal/ClientDashboard.tsx';
import ClientProjects from './pages/portal/ClientProjects.tsx';
import ClientInvoices from './pages/portal/ClientInvoices.tsx';
import ClientProfile from './pages/portal/ClientProfile.tsx';

// Wifizone Captive Portal
import CaptivePortalLogin from './pages/portal/CaptivePortalLogin.tsx';

// Wrapper for employee-only routes
const PrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Wrapper for client-only routes
const ClientPrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { client } = useAuth();
    return client ? <>{children}</> : <Navigate to="/portal/login" replace />;
};


const App: React.FC = () => {
  const { authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pgs-red">PGS-SARLU</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement de l'application...</p>
        </div>
      </div>
    );
  }


  return (
    <Routes>
      {/* Main App Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="academie" element={<Academie />} />
        <Route path="studio" element={<Studio />} />
        <Route path="decor" element={<Decor />} />
        <Route path="shop" element={<Shop />} />
        <Route path="wifizone" element={<Wifizone />} />
        <Route path="achats" element={<Achats />} />
        <Route path="finances" element={<Finances />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="clients" element={<Clients />} />
        <Route path="inventaire" element={<Inventaire />} />
        <Route path="securite" element={<Securite />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Client Portal Routes */}
      <Route path="/portal/login" element={<ClientLogin />} />
      <Route path="/portal" element={
        <ClientPrivateRoute>
            <ClientLayout />
        </ClientPrivateRoute>
      }>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="profile" element={<ClientProfile />} />
      </Route>
      
      {/* Captive Portal */}
      <Route path="/wifi-login" element={<CaptivePortalLogin />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
