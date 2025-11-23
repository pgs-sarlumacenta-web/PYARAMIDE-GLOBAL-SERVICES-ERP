import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, MusicalNoteIcon, SwatchIcon, CurrencyDollarIcon, UsersIcon, ShoppingBagIcon, BriefcaseIcon, UserGroupIcon, TruckIcon, Cog6ToothIcon, ArchiveBoxIcon, ClipboardDocumentListIcon, WifiIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
// FIX: Updated import path for useAuth and usePermissions to break circular dependency.
import { useAuth, usePermissions } from '../context/DataContext.tsx';
import { Permission } from '../types.ts';

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

const Sidebar: React.FC = () => {
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


  return (
    <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-pgs-border-light dark:border-pgs-border-dark p-4">
      <div className="flex items-center mb-8">
        <h1 className="text-2xl font-bold text-pgs-red">PGS-SARLU</h1>
      </div>
      <nav className="flex-1 space-y-2">
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
    </aside>
  );
};

export default Sidebar;