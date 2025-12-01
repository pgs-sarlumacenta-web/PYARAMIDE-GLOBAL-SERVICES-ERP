import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/DataContext.tsx';
import { HomeIcon, BriefcaseIcon, CurrencyDollarIcon, UserCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext.tsx';

const ClientHeader: React.FC = () => {
    const { client, clientLogout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (!client) return null;

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-pgs-red">Portail Client</h1>
            <div className="flex items-center space-x-4">
                 <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-500" />}
                </button>
                <div className="text-right">
                    <p className="font-semibold">{client.name}</p>
                    <button onClick={clientLogout} className="text-sm text-red-500 hover:underline">Déconnexion</button>
                </div>
            </div>
        </header>
    );
};

const ClientSidebar: React.FC = () => {
    const navItems = [
        { to: '/portal/dashboard', label: 'Tableau de Bord', icon: HomeIcon },
        { to: '/portal/projects', label: 'Mes Projets & Commandes', icon: BriefcaseIcon },
        { to: '/portal/invoices', label: 'Mes Factures', icon: CurrencyDollarIcon },
        { to: '/portal/profile', label: 'Mon Profil', icon: UserCircleIcon },
    ];
    
    const linkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-pgs-blue/10 hover:text-pgs-blue dark:hover:text-pgs-white transition-colors duration-200 rounded-lg";
    const activeLinkClasses = "bg-pgs-blue text-white dark:text-white";

    return (
         <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r p-4">
            <div className="flex items-center mb-8">
                <h1 className="text-2xl font-bold text-pgs-red">PGS-SARLU</h1>
            </div>
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                    >
                        <item.icon className="h-6 w-6 mr-3" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};


const ClientLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark text-pgs-text-light dark:text-pgs-text-dark">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
