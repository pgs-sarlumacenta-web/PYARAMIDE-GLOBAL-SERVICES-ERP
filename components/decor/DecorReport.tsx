
import React from 'react';
import { DecorOrder, Client, DecorService, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface DecorReportProps {
  orders: DecorOrder[];
  clients: Client[];
  services: DecorService[];
  period: string;
  companyProfile: CompanyProfile;
}

const DecorReport: React.FC<DecorReportProps> = ({ orders, clients, services, period, companyProfile }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
  const completedOrders = orders.filter(o => o.status === 'Livré').length;

  return (
    <ReportLayout title="Rapport PS-DÉCOR" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Total Commandes</h3>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Commandes Livrées</h3>
            <p className="text-2xl font-bold">{completedOrders}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-sm font-semibold text-green-700">Revenu (Paiements reçus)</h3>
            <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Commandes sur la Période</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Description</th>
                <th className="p-2">Client</th>
                <th className="p-2">Statut</th>
                <th className="p-2 text-right">Montant Payé</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">{order.description}</td>
                    <td className="p-2">{client?.name || 'N/A'}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2 text-right">{order.amountPaid.toLocaleString()} GNF</td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">Aucune commande pour cette période.</td>
                </tr>
               )}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default DecorReport;
