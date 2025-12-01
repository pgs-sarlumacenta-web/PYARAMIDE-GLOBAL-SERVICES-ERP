import React from 'react';
import { StudioProject, Client, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface StudioReportProps {
  projects: StudioProject[];
  clients: Client[];
  period: string;
  companyProfile: CompanyProfile;
}

const StudioReport: React.FC<StudioReportProps> = ({ projects, clients, period, companyProfile }) => {
  const totalRevenue = projects.reduce((sum, p) => sum + p.amountPaid, 0);
  const completedProjects = projects.filter(p => p.status === 'Terminé' || p.status === 'Livré').length;

  return (
    <ReportLayout title="Rapport PS-STUDIO" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Total Projets</h3>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Projets Terminés</h3>
            <p className="text-2xl font-bold">{completedProjects}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-sm font-semibold text-green-700">Revenu (Paiements reçus)</h3>
            <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Projets sur la Période</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Projet</th>
                <th className="p-2">Client</th>
                <th className="p-2">Statut</th>
                <th className="p-2 text-right">Montant Payé</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const client = clients.find(c => c.id === project.clientId);
                return (
                  <tr key={project.id} className="border-b">
                    <td className="p-2">{project.projectName}</td>
                    <td className="p-2">{client?.name || 'N/A'}</td>
                    <td className="p-2">{project.status}</td>
                    <td className="p-2 text-right">{project.amountPaid.toLocaleString()} GNF</td>
                  </tr>
                );
              })}
               {projects.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">Aucun projet pour cette période.</td>
                </tr>
               )}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default StudioReport;
