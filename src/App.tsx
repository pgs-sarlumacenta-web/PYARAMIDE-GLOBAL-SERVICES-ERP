
import React, { ReactNode, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/DataContext';

// Layouts
import MainLayout from './components/MainLayout';
import ClientLayout from './components/portal/ClientLayout';

// Eager Load Login for speed
import Login from './pages/Login';

// Lazy Load Modules to improve performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
// Academie uses named export
const Academie = lazy(() => import('./pages/Academie').then(module => ({ default: module.Academie })));
// Studio uses named export
const Studio = lazy(() => import('./pages/Studio').then(module => ({ default: module.Studio })));
const Decor = lazy(() => import('./pages/Decor'));
const Shop = lazy(() => import('./pages/Shop'));
const Wifizone = lazy(() => import('./pages/Wifizone'));
const Achats = lazy(() => import('./pages/Achats'));
// Finances uses default export
const Finances = lazy(() => import('./pages/Finances'));
// Personnel uses named export as per reconstruction
const Personnel = lazy(() => import('./pages/Personnel').then(module => ({ default: module.Personnel })));
// Clients uses default export
const Clients = lazy(() => import('./pages/Clients'));
// Inventaire uses default export
const Inventaire = lazy(() => import('./pages/Inventaire'));
// Securite uses named export as per reconstruction
const Securite = lazy(() => import('./pages/Securite').then(module => ({ default: module.Securite })));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));

// Client Portal Pages (Lazy)
const ClientLogin = lazy(() => import('./pages/portal/ClientLogin'));
const ClientDashboard = lazy(() => import('./pages/portal/ClientDashboard'));
const ClientProjects = lazy(() => import('./pages/portal/ClientProjects'));
const ClientInvoices = lazy(() => import('./pages/portal/ClientInvoices'));
const ClientProfile = lazy(() => import('./pages/portal/ClientProfile'));
const CaptivePortalLogin = lazy(() => import('./pages/portal/CaptivePortalLogin'));


// Wrapper for employee-only routes
const PrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, authLoading } = useAuth();
    if (authLoading) return null; 
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Wrapper for client-only routes
const ClientPrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { client } = useAuth();
    return client ? <>{children}</> : <Navigate to="/portal/login" replace />;
};

// Loading Component
const PageLoader = () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-900 min-h-[400px]">
        <div className="flex flex-col items-center">
            <div className="h-10 w-10 border-4 border-pgs-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement du module...</p>
        </div>
    </div>
);


const App: React.FC = () => {
  const { authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark">
        <div className="text-center">
            <div className="h-16 w-16 border-4 border-pgs-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-3xl font-bold text-pgs-red">PGS-SARLU</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Démarrage du système...</p>
        </div>
      </div>
    );
  }


  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
};

export default App;
