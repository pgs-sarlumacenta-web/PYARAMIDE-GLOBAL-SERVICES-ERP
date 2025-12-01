import React from 'react';
import { Client, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface ClientDebtsReportProps {
  clientsWithDebts: { client: Client; totalBilled: number; totalPaid: number; totalDue: number }[];
  companyProfile: CompanyProfile;
}

const ClientDebtsReport: React.FC<ClientDebtsReportProps> = ({ clientsWithDebts, companyProfile }) => {
  const totalAllDebts = clientsWithDebts.reduce((sum, item) => sum + item.totalDue, 0);

  return (
    <ReportLayout title="Rapport des Créances Clients" period={new Date().toLocaleDateString('fr-FR')} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="p-4 bg-yellow-100 rounded-lg text-center">
            <h3 className="text-sm font-semibold text-yellow-700">Total des Créances</h3>
            <p className="text-2xl font-bold text-yellow-800">{totalAllDebts.toLocaleString()} GNF</p>
        </section>
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Clients avec Solde Dû</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Client</th>
                <th className="p-2 text-right">Total Facturé</th>
                <th className="p-2 text-right">Total Payé</th>
                <th className="p-2 text-right font-semibold">Solde Dû</th>
              </tr>
            </thead>
            <tbody>
              {clientsWithDebts.map(({ client, totalBilled, totalPaid, totalDue }) => (
                <tr key={client.id} className="border-b">
                  <td className="p-2">{client.name}</td>
                  <td className="p-2 text-right">{totalBilled.toLocaleString()} GNF</td>
                  <td className="p-2 text-right">{totalPaid.toLocaleString()} GNF</td>
                  <td className="p-2 text-right font-semibold text-red-600">{totalDue.toLocaleString()} GNF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default ClientDebtsReport;