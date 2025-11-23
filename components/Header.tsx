

import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
// FIX: Updated import path for useAuth and usePermissions to break circular dependency.
import { useAuth, usePermissions } from '../context/DataContext.tsx';
import { useData } from '../context/DataContext.tsx';
import { BellIcon, ChevronDownIcon, MagnifyingGlassIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import NotificationPanel from './notifications/NotificationPanel.tsx';
import { Permission } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

// Define a type for search results for clarity
interface SearchResult {
    type: string;
    name: string;
    link: string;
    item: any;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const { 
      notifications, 
      clients,
      students,
      studioProjects,
      decorOrders,
      articles,
      employees,
      suppliers 
  } = useData();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // New states for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  
  // Refs for outside click detection
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const currentUser = user;

  // Effect for performing the search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search Clients
    clients.filter(c => !c.isArchived && c.name.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Client', name: item.name, link: '/clients', item }));

    // Search Students
    students.filter(s => !s.isArchived && s.name.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Apprenant', name: item.name, link: '/academie', item }));
        
    // Search Studio Projects
    studioProjects.filter(p => !p.isArchived && p.projectName.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Projet Studio', name: item.projectName, link: '/studio', item }));

    // Search Decor Orders
    decorOrders.filter(o => !o.isArchived && o.description.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Commande Décor', name: `${item.description} (#${item.id})`, link: '/decor', item }));

    // Search Shop Products
    articles.filter(p => p.isSellable && !p.isArchived && p.name.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Article (Shop)', name: item.name, link: '/shop', item }));
            
    // Search Employees
    employees.filter(e => !e.isArchived && e.name.toLowerCase().includes(query))
        .forEach(item => results.push({ type: 'Employé', name: item.name, link: '/personnel', item }));

    // Search Suppliers
    suppliers.filter(s => !s.isArchived && s.name.toLowerCase().includes(query))
         .forEach(item => results.push({ type: 'Fournisseur', name: item.name, link: '/achats', item }));
         
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, clients, students, studioProjects, decorOrders, articles, employees, suppliers]);


  // Effect for closing popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
            setIsResultsOpen(false);
        }
        if (dropdownRef.current && !dropdownRef.current.contains(target)) {
            setDropdownOpen(false);
        }
        if (notificationsRef.current && !notificationsRef.current.contains(target)) {
            setNotificationsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsResultsOpen(true);
    } else {
      setIsResultsOpen(false);
    }
  };


  if (!currentUser) {
    return null; // or a loading skeleton
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-pgs-border-light dark:border-pgs-border-dark p-4 flex justify-between items-center">
      <div ref={searchContainerRef} className="relative w-full max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => { if (searchQuery.length >= 2) setIsResultsOpen(true); }}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-pgs-border-light dark:border-pgs-border-dark bg-pgs-bg-light dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pgs-blue"
        />
        {isResultsOpen && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-pgs-border-light dark:border-pgs-border-dark max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result, index) => (
                  <li key={index}>
                    <NavLink
                      to={result.link}
                      onClick={() => {
                        setIsResultsOpen(false);
                        setSearchQuery('');
                      }}
                      className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-pgs-border-light dark:border-pgs-border-dark last:border-0"
                    >
                      <p className="font-semibold truncate">{result.name}</p>
                      <p className="text-xs text-gray-500">{result.type}</p>
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                Aucun résultat pour "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle dark mode">
            {theme === 'dark' ? (
                <SunIcon className="h-6 w-6 text-yellow-400" />
            ) : (
                <MoonIcon className="h-6 w-6 text-gray-500" />
            )}
        </button>
        <div className="relative" ref={notificationsRef}>
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
            <img src={currentUser.avatarUrl} alt="User Avatar" className="h-10 w-10 rounded-full object-cover" />
            <span className="hidden sm:inline font-medium">{currentUser.name}</span>
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-pgs-border-light dark:border-pgs-border-dark">
              <NavLink to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profil</NavLink>
              {hasPermission(Permission.MANAGE_USERS_ROLES) && (
                <NavLink to="/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Paramètres</NavLink>
              )}
              <button
                onClick={logout}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;