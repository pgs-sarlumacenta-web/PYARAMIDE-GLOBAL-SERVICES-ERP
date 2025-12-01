import React from 'react';
import { Client, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface ClientsReportProps {
  newClients: Client[];
  topClients: { name: string; revenue: number }[];
  period: string;
  companyProfile: CompanyProfile;
}

const ClientsReport: React.FC<ClientsReportProps> = ({ newClients, topClients, period, companyProfile }) => {
  return (
    <ReportLayout title="Rapport Clients" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="p-4 bg-gray-100 rounded-lg text-center">
            <h3 className="text-sm font-semibold text-gray-500">Nouveaux Clients Acquis</h3>
            <p className="text-2xl font-bold">{newClients.length}</p>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Nouveaux Clients</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Nom</th>
                <th className="p-2">Société</th>
                <th className="p-2">Email</th>
                <th className="p-2">Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {newClients.map(client => (
                  <tr key={client.id} className="border-b">
                    <td className="p-2">{client.name}</td>
                    <td className="p-2">{client.company || 'N/A'}</td>
                    <td className="p-2">{client.email}</td>
                    <td className="p-2">{client.phone}</td>
                  </tr>
              ))}
               {newClients.length === 0 && (
                <tr><td colSpan={4} className="text-center p-4 text-gray-500">Aucun nouveau client pour cette période.</td></tr>
               )}
            </tbody>
          </table>
        </section>
        
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Top 5 Clients par Revenu</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Client</th>
                <th className="p-2 text-right">Revenu Généré</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map(client => (
                  <tr key={client.name} className="border-b">
                    <td className="p-2">{client.name}</td>
                    <td className="p-2 text-right">{client.revenue.toLocaleString()} GNF</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default ClientsReport;
