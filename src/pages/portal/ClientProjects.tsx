
import React, { useMemo } from 'react';
import { useAuth, useData } from '../../context/DataContext.tsx';
// FIX: Import all necessary status types to handle different kinds of projects/orders.
import { StudioProject, DecorOrderStatus, ShopOrderStatus } from '../../types.ts';

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

const ClientProjects: React.FC = () => {
    const { client } = useAuth();
    const { studioProjects, decorOrders, shopOrders } = useData();

    const allItems = useMemo(() => {
        if (!client) return [];

        return [
            ...studioProjects.filter(p => p.clientId === client.id && !p.isArchived).map(p => ({...p, type: 'Projet Studio', date: p.startDate, name: p.projectName })),
            ...decorOrders.filter(o => o.clientId === client.id && !o.isArchived).map(o => ({...o, type: 'Commande Décor', date: o.orderDate, name: o.description })),
            ...shopOrders.filter(o => o.clientId === client.id && !o.isArchived).map(o => ({...o, type: 'Achat Shop', date: o.orderDate, name: `Vente #${o.id}`}))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [client, studioProjects, decorOrders, shopOrders]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Mes Projets & Commandes</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3">Date</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allItems.map(item => (
                                <tr key={`${item.type}-${item.id}`} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">{item.name}</td>
                                    <td className="p-3">{item.type}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientProjects;
