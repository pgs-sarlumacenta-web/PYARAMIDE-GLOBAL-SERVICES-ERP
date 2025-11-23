import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityLog, User } from '../../types.ts';
import { MagnifyingGlassIcon, UserIcon, CalendarIcon, AdjustmentsHorizontalIcon, PencilIcon, PlusIcon, TrashIcon, ArchiveBoxIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface ActivityLogViewerProps {
    logs: ActivityLog[];
    users: User[];
}

const actionIcons: { [key: string]: React.ElementType } = {
    'Création': PlusIcon,
    'Modification': PencilIcon,
    'Archivage': ArchiveBoxIcon,
    'Suppression': TrashIcon,
    'Maintenance': AdjustmentsHorizontalIcon,
};

const actionColors: { [key: string]: string } = {
    'Création': 'bg-green-500',
    'Modification': 'bg-yellow-500',
    'Archivage': 'bg-red-500',
    'Suppression': 'bg-red-700',
    'Maintenance': 'bg-blue-500',
};

const ITEMS_PER_PAGE = 20;

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ logs, users }) => {
    const [userFilter, setUserFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.date);
            if (startDate && logDate < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }
            if (userFilter !== 'all' && log.userId !== userFilter) return false;
            if (actionFilter !== 'all' && log.action !== actionFilter) return false;
            if (searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [logs, userFilter, actionFilter, startDate, endDate, searchTerm]);
    
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const pageCount = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

    const groupedLogs = useMemo(() => {
        return paginatedLogs.reduce((acc: Record<string, ActivityLog[]>, log) => {
            const date = new Date(log.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {});
    }, [paginatedLogs]);

    const uniqueActions = useMemo(() => [...new Set(logs.map(log => log.action))], [logs]);
    
    const handleResetFilters = () => {
        setUserFilter('all');
        setActionFilter('all');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleLogClick = (log: ActivityLog) => {
        if (!log.entityId || !log.entityType) return;
        
        switch (log.entityType) {
            case 'client':
                navigate('/clients', { state: { selectedId: log.entityId } });
                break;
            case 'student':
                navigate('/academie', { state: { selectedId: log.entityId, type: 'student' } });
                break;
            case 'formation':
                navigate('/academie', { state: { selectedId: log.entityId, type: 'formation' } });
                break;
            case 'formateur':
                navigate('/academie', { state: { selectedId: log.entityId, type: 'formateur' } });
                break;
            case 'studioProject':
                navigate('/studio', { state: { selectedId: log.entityId, type: 'project' } });
                break;
            case 'studioIntervenant':
                navigate('/studio', { state: { selectedId: log.entityId, type: 'intervenant' } });
                break;
            case 'decorOrder':
                navigate('/decor', { state: { selectedId: log.entityId, type: 'order' } });
                break;
            case 'decorService':
                navigate('/decor', { state: { selectedId: log.entityId, type: 'service' } });
                break;
            case 'shopOrder':
                navigate('/shop', { state: { selectedId: log.entityId } });
                break;
            case 'article':
                navigate('/inventaire', { state: { selectedId: log.entityId } });
                break;
            case 'purchaseOrder':
                navigate('/achats', { state: { selectedId: log.entityId, type: 'order' } });
                break;
            case 'supplier':
                navigate('/achats', { state: { selectedId: log.entityId, type: 'supplier' } });
                break;
            case 'transaction':
                navigate('/finances', { state: { selectedId: log.entityId } });
                break;
            case 'employee':
                navigate('/personnel', { state: { selectedId: log.entityId } });
                break;
            default:
                break;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Journal d'Activité</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="lg:col-span-2 relative">
                    <label className="text-sm font-medium">Recherche</label>
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-9 transform -translate-y-1/2" />
                    <input type="text" placeholder="Rechercher un détail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style w-full pl-10" />
                </div>
                <div><label className="text-sm font-medium">Utilisateur</label><select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="input-style w-full">{[<option value="all">Tous</option>, ...users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)]}</select></div>
                <div><label className="text-sm font-medium">Action</label><select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-style w-full">{[<option value="all">Toutes</option>, ...uniqueActions.map(a => <option key={a} value={a}>{a}</option>)]}</select></div>
                <div><label className="text-sm font-medium">Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style w-full"/></div>
                <div className="flex items-end"><button onClick={handleResetFilters} className="btn-secondary w-full flex items-center justify-center"><ArrowUturnLeftIcon className="h-5 w-5 mr-2"/>Tout voir</button></div>
            </div>

            <div className="space-y-8 min-h-[60vh]">
                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4">
                    {Object.entries(groupedLogs).map(([date, logsForDate]: [string, ActivityLog[]]) => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold my-2 sticky top-0 bg-white dark:bg-gray-800 py-2">{date}</h3>
                            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-8 space-y-6">
                                {logsForDate.map(log => {
                                    const user = users.find(u => u.id === log.userId);
                                    const Icon = actionIcons[log.action] || AdjustmentsHorizontalIcon;
                                    const color = actionColors[log.action] || 'bg-gray-500';
                                    const isClickable = !!(log.entityId && log.entityType);

                                    return (
                                        <div key={log.id} onClick={() => handleLogClick(log)} className={`relative flex items-start ${isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md p-2 -m-2' : ''}`}>
                                            <div className={`absolute -left-12 -top-1.5 flex items-center justify-center w-8 h-8 rounded-full ${color}`}><Icon className="h-5 w-5 text-white" /></div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <img src={user?.avatarUrl} alt={user?.name} className="h-6 w-6 rounded-full"/><p className="font-semibold text-sm">{user?.name || 'Système'}</p>
                                                    <p className="text-xs text-gray-500">{new Date(log.date).toLocaleTimeString('fr-FR')}</p>
                                                </div>
                                                <p className="mt-1 text-sm"><span className="font-medium">{log.action}:</span> {log.details}
                                                {log.entityId && <span className="ml-2 font-mono text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded select-all">{log.entityType}:{log.entityId}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <div className="text-center py-16 text-gray-500"><p>Aucune activité ne correspond à vos filtres.</p></div>
                    )}
                </div>
            </div>
             <div className="flex justify-between items-center pt-4 border-t mt-4">
                <p className="text-sm text-gray-500">Page {currentPage} sur {pageCount}</p>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary disabled:opacity-50">Précédent</button>
                    <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount} className="btn-secondary disabled:opacity-50">Suivant</button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogViewer;