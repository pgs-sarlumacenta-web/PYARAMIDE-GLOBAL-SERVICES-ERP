import React from 'react';
import { Student, Formation, Paiement, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface AcademieReportProps {
  students: Student[];
  formations: Formation[];
  paiements: Paiement[];
  period: string;
  companyProfile: CompanyProfile;
}

const AcademieReport: React.FC<AcademieReportProps> = ({ students, formations, paiements, period, companyProfile }) => {
  const totalRevenue = paiements.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ReportLayout title="Rapport PS-ACADÉMIE" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Nouveaux Apprenants</h3>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Paiements Reçus</h3>
            <p className="text-2xl font-bold">{paiements.length}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-sm font-semibold text-green-700">Revenu Total</h3>
            <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Nouveaux Apprenants</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Nom</th>
                <th className="p-2">Formation</th>
                <th className="p-2">Date d'inscription</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const formation = formations.find(f => f.id === student.formationId);
                return (
                  <tr key={student.id} className="border-b">
                    <td className="p-2">{student.name}</td>
                    <td className="p-2">{formation?.name || 'N/A'}</td>
                    <td className="p-2">{new Date(student.registrationDate).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Paiements Reçus</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Apprenant</th>
                <th className="p-2">Objet</th>
                <th className="p-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map(paiement => {
                const student = students.find(s => s.id === paiement.studentId);
                return (
                  <tr key={paiement.id} className="border-b">
                    <td className="p-2">{new Date(paiement.date).toLocaleDateString()}</td>
                    <td className="p-2">{student?.name || 'N/A'}</td>
                    <td className="p-2">{paiement.objet}</td>
                    <td className="p-2 text-right">{paiement.amount.toLocaleString()} GNF</td>
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

export default AcademieReport;
