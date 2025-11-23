
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, ArrowRightIcon,
    HomeIcon, BookOpenIcon, MusicalNoteIcon, SwatchIcon, 
    ShoppingBagIcon, WifiIcon, ShieldCheckIcon, TruckIcon, 
    CurrencyDollarIcon, BriefcaseIcon, UserGroupIcon, ArchiveBoxIcon,
    Cog6ToothIcon, UserPlusIcon
} from '@heroicons/react/24/outline';
import Portal from './Portal';

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const actions = [
        { id: 'dash', name: 'Aller au Tableau de Bord', icon: HomeIcon, to: '/dashboard' },
        { id: 'aca', name: 'Aller à PS-ACADÉMIE', icon: BookOpenIcon, to: '/academie' },
        { id: 'stu', name: 'Aller à PS-STUDIO', icon: MusicalNoteIcon, to: '/studio' },
        { id: 'dec', name: 'Aller à PS-DÉCOR', icon: SwatchIcon, to: '/decor' },
        { id: 'shop', name: 'Aller à PS-SHOP', icon: ShoppingBagIcon, to: '/shop' },
        { id: 'wifi', name: 'Aller à PS-WIFIZONE', icon: WifiIcon, to: '/wifizone' },
        { id: 'sec', name: 'Aller à PS-SÉCURITÉ', icon: ShieldCheckIcon, to: '/securite' },
        { id: 'ach', name: 'Aller aux Achats', icon: TruckIcon, to: '/achats' },
        { id: 'fin', name: 'Aller aux Finances', icon: CurrencyDollarIcon, to: '/finances' },
        { id: 'pers', name: 'Aller au Personnel', icon: BriefcaseIcon, to: '/personnel' },
        { id: 'cli', name: 'Aller aux Clients', icon: UserGroupIcon, to: '/clients' },
        { id: 'inv', name: 'Aller à l\'Inventaire', icon: ArchiveBoxIcon, to: '/inventaire' },
        { id: 'set', name: 'Aller aux Paramètres', icon: Cog6ToothIcon, to: '/settings' },
        // Actions rapides (simulées par navigation)
        { id: 'new_cli', name: 'Nouveau Client', icon: UserPlusIcon, to: '/clients', state: { openAdd: true } },
    ];

    const filteredActions = actions.filter(action => 
        action.name.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                setIsOpen(open => !open);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', onKeydown);
        return () => window.removeEventListener('keydown', onKeydown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredActions[selectedIndex]) {
                selectAction(filteredActions[selectedIndex]);
            }
        }
    };

    const selectAction = (action: any) => {
        navigate(action.to, { state: action.state });
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" onClick={() => setIsOpen(false)} />
                
                <div className="mx-auto max-w-xl transform divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                            placeholder="Rechercher une page ou une action..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {filteredActions.length > 0 && (
                        <ul className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                            {filteredActions.map((action, index) => (
                                <li
                                    key={action.id}
                                    onClick={() => selectAction(action)}
                                    className={`group flex cursor-default select-none rounded-xl p-3 hover:bg-pgs-blue hover:text-white ${
                                        index === selectedIndex ? 'bg-pgs-blue text-white' : 'text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${index === selectedIndex ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        <action.icon className={`h-6 w-6 ${index === selectedIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                    </div>
                                    <div className="ml-4 flex-auto">
                                        <p className={`text-sm font-medium ${index === selectedIndex ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {action.name}
                                        </p>
                                        <p className={`text-xs ${index === selectedIndex ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            Aller à {action.to}
                                        </p>
                                    </div>
                                    {index === selectedIndex && <ArrowRightIcon className="h-5 w-5 text-white" />}
                                </li>
                            ))}
                        </ul>
                    )}
                    
                    {filteredActions.length === 0 && (
                        <div className="py-14 px-6 text-center text-sm sm:px-14">
                            <p className="mt-4 font-semibold text-gray-900 dark:text-white">Aucun résultat</p>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Nous n'avons rien trouvé correspondant à ce terme.</p>
                        </div>
                    )}
                    
                    <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-900/50 py-2.5 px-4 text-xs text-gray-700 dark:text-gray-400">
                        <span className="mx-1 font-semibold">↑↓</span> pour naviguer, 
                        <span className="mx-1 font-semibold">Entrée</span> pour sélectionner,
                        <span className="mx-1 font-semibold">Echap</span> pour fermer.
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default CommandPalette;
