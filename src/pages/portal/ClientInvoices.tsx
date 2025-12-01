import React, { useMemo } from 'react';
import { useAuth, useData } from '../../context/DataContext.tsx';

const ClientInvoices: React.FC = () => {
    const { client } = useAuth();
    const { studioProjects, decorOrders, shopOrders, studioServices } = useData();

    const allInvoices = useMemo(() => {
        if (!client) return [];

        const items = [
            ...studioProjects.filter(p => p.clientId === client.id && !p.isArchived),
            ...decorOrders.filter(o => o.clientId === client.id && !o.isArchived),
            ...shopOrders.filter(o => o.clientId === client.id && !o.isArchived)
        ];

        return items.map(item => {
            let totalAmount = 0;
            if ('serviceIds' in item) { // Studio
                 totalAmount = item.serviceIds.reduce((s, id) => s + (studioServices.find(serv=>serv.id===id)?.tarif || 0), 0) - item.discount;
            } else { // Decor or Shop
                totalAmount = item.totalAmount;
            }
            const balance = totalAmount - item.amountPaid;
            const name = 'projectName' in item ? item.projectName : ('description' in item ? item.description : `Vente #${item.id}`);
            const date = 'startDate' in item ? item.startDate : item.orderDate;

            return { id: item.id, name, date, totalAmount, amountPaid: item.amountPaid, balance };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [client, studioProjects, decorOrders, shopOrders, studioServices]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Mes Factures</h1>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3">Date</th>
                                <th className="p-3">Description</th>
                                <th className="p-3 text-right">Total Facturé</th>
                                <th className="p-3 text-right">Montant Payé</th>
                                <th className="p-3 text-right">Solde Dû</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">{invoice.name}</td>
                                    <td className="p-3 text-right">{invoice.totalAmount.toLocaleString()} GNF</td>
                                    <td className="p-3 text-right text-green-600">{invoice.amountPaid.toLocaleString()} GNF</td>
                                    <td className={`p-3 text-right font-semibold ${invoice.balance > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {invoice.balance.toLocaleString()} GNF
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

export default ClientInvoices;