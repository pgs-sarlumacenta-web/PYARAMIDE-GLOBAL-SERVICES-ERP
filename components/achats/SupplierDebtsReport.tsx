import React from 'react';
import { PurchaseOrder, Supplier, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface SupplierDebtsReportProps {
  payableOrders: PurchaseOrder[];
  suppliers: Supplier[];
  companyProfile: CompanyProfile;
}

const SupplierDebtsReport: React.FC<SupplierDebtsReportProps> = ({ payableOrders, suppliers, companyProfile }) => {
  const totalAllDebts = payableOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <ReportLayout title="Rapport des Dettes Fournisseurs" period={new Date().toLocaleDateString('fr-FR')} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="p-4 bg-red-100 rounded-lg text-center">
            <h3 className="text-sm font-semibold text-red-700">Total des Dettes Fournisseurs</h3>
            <p className="text-2xl font-bold text-red-800">{totalAllDebts.toLocaleString()} GNF</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Commandes à Payer</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Commande N°</th>
                <th className="p-2">Fournisseur</th>
                <th className="p-2">Date</th>
                <th className="p-2 text-right font-semibold">Montant Dû</th>
              </tr>
            </thead>
            <tbody>
              {payableOrders.map(order => {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                return (
                    <tr key={order.id} className="border-b">
                        <td className="p-2 font-mono">{order.id}</td>
                        <td className="p-2">{supplier?.name || 'N/A'}</td>
                        <td className="p-2">{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td className="p-2 text-right font-semibold">{order.totalAmount.toLocaleString()} GNF</td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default SupplierDebtsReport;