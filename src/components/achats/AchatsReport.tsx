import React from 'react';
import { PurchaseOrder, Supplier, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface AchatsReportProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  period: string;
  companyProfile: CompanyProfile;
}

const AchatsReport: React.FC<AchatsReportProps> = ({ purchaseOrders, suppliers, period, companyProfile }) => {
  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <ReportLayout title="Rapport d'Achats" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Commandes d'Achat</h3>
            <p className="text-2xl font-bold">{purchaseOrders.length}</p>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <h3 className="text-sm font-semibold text-red-700">Dépenses Totales</h3>
            <p className="text-2xl font-bold text-red-800">{totalSpend.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Commandes d'Achat</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Fournisseur</th>
                <th className="p-2">Statut</th>
                <th className="p-2 text-right">Montant Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(order => {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                return (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-2">{supplier?.name || 'N/A'}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2 text-right">{order.totalAmount.toLocaleString()} GNF</td>
                  </tr>
                );
              })}
               {purchaseOrders.length === 0 && (
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

export default AchatsReport;
