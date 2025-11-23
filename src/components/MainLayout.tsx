
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import FloatingActionButton from './FloatingActionButton.tsx';
import { useFab } from '../context/FabContext.tsx';
import { useAuth, useData } from '../context/DataContext.tsx';
import { LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const MainLayout: React.FC = () => {
  const { fabConfig } = useFab();
  const { isAppLocked } = useAuth();
  const { isDataStale, refreshData, loading } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark text-pgs-text-light dark:text-pgs-text-dark">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAppLocked && (
          <div className="bg-yellow-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center shadow-lg z-50">
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Application Verrouillée (Mode Lecture Seule)
          </div>
        )}
        <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-pgs-bg-light dark:bg-pgs-bg-dark p-4 md:p-6 lg:p-8 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-50">
                <div className="flex items-center space-x-2 text-gray-500">
                    <ArrowPathIcon className="h-6 w-6 animate-spin" />
                    <span className="font-semibold">Chargement des données...</span>
                </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
       {fabConfig && (
        <FloatingActionButton
          onClick={fabConfig.onClick}
          title={fabConfig.title}
        />
      )}
      {isDataStale && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-pgs-blue text-white py-3 px-6 rounded-full shadow-lg flex items-center space-x-4 animate-fade-in">
          <p className="text-sm font-medium">De nouvelles données sont disponibles.</p>
          <button
            onClick={refreshData}
            className="flex items-center bg-white text-pgs-blue font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Actualiser
          </button>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
