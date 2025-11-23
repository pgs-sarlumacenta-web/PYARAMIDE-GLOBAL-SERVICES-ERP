
import React, { useMemo } from 'react';
import { useAuth, useData } from '../../context/DataContext.tsx';
// FIX: Import all necessary status types to handle different kinds of projects/orders.
import { StudioProject, DecorOrderStatus, ShopOrderStatus } from '../../types.ts';
import { BanknotesIcon, BriefcaseIcon, ClockIcon } from '@heroicons/react/24/outline';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

// FIX: Create a comprehensive getStatusClass function that handles all possible statuses from different modules.
const getStatusClass = (status: StudioProject['status'] | DecorOrderStatus | ShopOrderStatus) => {
    const classes: { [key: string]: string } = {
        // Studio
        'Planifié': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        'En cours': 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        'Mixage': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
        'Terminé': 'bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
        'Livré': 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200',
        // Decor & Shop
        'Devis': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        'Confirmé': 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        'Payé': 'bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
        'Annulé': 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    };
    return classes[status] || 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const ClientDashboard: React.FC = () => {
    const { client } = useAuth();
    const { studioProjects, decorOrders, shopOrders, studioServices } = useData();

    const clientData = useMemo(() => {
        if (!client) return { interactions: [], projectsInProgress: 0, totalDue: 0 };

        const allInteractions = [
            ...studioProjects.filter(p => p.clientId === client.id && !p.isArchived).map(p => ({...p, type: 'Studio', date: p.startDate, name: p.projectName })),
            ...decorOrders.filter(o => o.clientId === client.id && !o.isArchived).map(o => ({...o, type: 'Décor', date: o.orderDate, name: o.description })),
            ...shopOrders.filter(o => o.clientId === client.id && !o.isArchived).map(o => ({...o, type: 'Shop', date: o.orderDate, name: `Vente #${o.id}`}))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const projectsInProgress = allInteractions.filter(i => i.status === 'En cours' || i.status === 'Mixage').length;

        const totalDue = allInteractions.reduce((sum, item) => {
            let totalBilled = 0;
            if ('serviceIds' in item) { // Studio
                 totalBilled = item.serviceIds.reduce((s, id) => s + (studioServices.find(serv=>serv.id===id)?.tarif || 0), 0) - item.discount;
            } else { // Decor or Shop
                totalBilled = item.totalAmount;
            }
            return sum + (totalBilled - item.amountPaid);
        }, 0);

        return { interactions: allInteractions.slice(0, 5), projectsInProgress, totalDue };

    }, [client, studioProjects, decorOrders, shopOrders, studioServices]);

    if (!client) return <div>Chargement...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Bienvenue, {client.name} !</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Projets / Commandes en cours" value={String(clientData.projectsInProgress)} icon={BriefcaseIcon} color="bg-blue-500" />
                <StatCard title="Solde Total Dû" value={`${clientData.totalDue.toLocaleString()} GNF`} icon={BanknotesIcon} color="bg-red-500" />
                <StatCard title="Interactions Totales" value={String(clientData.interactions.length)} icon={ClockIcon} color="bg-yellow-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Activité Récente</h2>
                <div className="space-y-4">
                    {clientData.interactions.length > 0 ? clientData.interactions.map(item => (
                        <div key={`${item.type}-${item.id}`} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.type} - {new Date(item.date).toLocaleDateString()}</p>
                            </div>
                             <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(item.status)}`}>{item.status}</span>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-4">Aucune activité récente.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
