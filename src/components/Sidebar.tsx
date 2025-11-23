
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, MusicalNoteIcon, SwatchIcon, CurrencyDollarIcon, UsersIcon, ShoppingBagIcon, BriefcaseIcon, UserGroupIcon, TruckIcon, ArchiveBoxIcon, WifiIcon, ShieldCheckIcon, XMarkIcon, CloudIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { useAuth, usePermissions } from '../context/DataContext.tsx';
import { Permission } from '../types.ts';
import { isSupabaseConfigured } from '../supabaseClient.ts';

const navItems = [
  { to: '/dashboard', label: 'Tableau de Bord', icon: HomeIcon, requiredPermission: undefined },
  { to: '/academie', label: 'PS-ACADÉMIE', icon: BookOpenIcon, requiredPermission: Permission.VIEW_ACADEMIE },
  { to: '/studio', label: 'PS-STUDIO', icon: MusicalNoteIcon, requiredPermission: Permission.VIEW_STUDIO },
  { to: '/decor', label: 'PS-DÉCOR', icon: SwatchIcon, requiredPermission: Permission.VIEW_DECOR },
  { to: '/shop', label: 'PS-SHOP', icon: ShoppingBagIcon, requiredPermission: Permission.VIEW_SHOP },
  { to: '/wifizone', label: 'PS-WIFIZONE', icon: WifiIcon, requiredPermission: Permission.VIEW_WIFIZONE },
  { to: '/securite', label: 'PS-SÉCURITÉ', icon: ShieldCheckIcon, requiredPermission: Permission.VIEW_SECURITE },
  { to: '/achats', label: 'Achats', icon: TruckIcon, requiredPermission: Permission.VIEW_ACHATS },
  { to: '/finances', label: 'Finances', icon: CurrencyDollarIcon, requiredPermission: Permission.VIEW_FINANCES },
  { to: '/personnel', label: 'Personnel', icon: BriefcaseIcon, requiredPermission: Permission.VIEW_PERSONNEL },
  { to: '/clients', label: 'Clients', icon: UserGroupIcon, requiredPermission: Permission.VIEW_CLIENTS },
  { to: '/inventaire', label: 'Inventaire & Stock', icon: ArchiveBoxIcon, requiredPermission: Permission.VIEW_INVENTAIRE },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const linkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-pgs-blue/10 hover:text-pgs-blue dark:hover:text-pgs-white transition-colors duration-200 rounded-lg";
  const activeLinkClasses = "bg-pgs-blue text-white dark:text-white";
  
  const filteredNavItems = useMemo(() => {
    if (!user) return [];
    return navItems.filter(item => {
        return !item.requiredPermission || hasPermission(item.requiredPermission);
    });
  }, [user, hasPermission]);

  const StatusIndicator = () => (
      <div className={`mt-auto mb-4 px-4 py-2 mx-4 rounded-lg text-xs flex items-center justify-center space-x-2 font-medium ${isSupabaseConfigured ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
          {isSupabaseConfigured ? (
              <>
                  <CloudIcon className="h-4 w-4" />
                  <span>Base de données : Connectée</span>
              </>
          ) : (
              <>
                  <SignalSlashIcon className="h-4 w-4" />
                  <span>Mode Démo (Local)</span>
              </>
          )}
      </div>
  );

  return (
    <>
        {/* Mobile Sidebar Overlay */}
        <div 
            className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity md:hidden ${isOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200 pointer-events-none'}`}
            onClick={onClose}
        ></div>

        {/* Mobile Sidebar Panel */}
        <div className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-pgs-border-light dark:border-pgs-border-dark transform transition-transform md:hidden ${isOpen ? 'translate-x-0 ease-out duration-300' : '-translate-x-full ease-in duration-200'}`}>
            <div className="flex items-center justify-between h-16 px-4 border-b border-pgs-border-light dark:border-pgs-border-dark">
                 <h1 className="text-2xl font-bold text-pgs-red">PGS-SARLU</h1>
                 <button onClick={onClose} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                 </button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                        >
                            <item.icon className="h-6 w-6 mr-3" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <StatusIndicator />
            </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-pgs-border-light dark:border-pgs-border-dark p-4 h-full">
          <div className="flex items-center mb-8">
            <h1 className="text-2xl font-bold text-pgs-red">PGS-SARLU</h1>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => (
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
          <StatusIndicator />
        </aside>
    </>
  );
};

export default Sidebar;
