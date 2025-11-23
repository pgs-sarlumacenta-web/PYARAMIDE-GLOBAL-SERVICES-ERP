import React from 'react';
import { Materiel, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface InventaireReportProps {
  newAssets: Materiel[];
  period: string;
  companyProfile: CompanyProfile;
}

const InventaireReport: React.FC<InventaireReportProps> = ({ newAssets, period, companyProfile }) => {
  const totalValue = newAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0);

  return (
    <ReportLayout title="Rapport d'Inventaire" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Nouveaux Actifs Acquis</h3>
            <p className="text-2xl font-bold">{newAssets.length}</p>
          </div>
          <div className="p-4 bg-blue-100 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-700">Valeur des Nouveaux Actifs</h3>
            <p className="text-2xl font-bold text-blue-800">{totalValue.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Nouveaux Actifs</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Nom</th>
                <th className="p-2">Date d'achat</th>
                <th className="p-2 text-right">Prix d'achat</th>
              </tr>
            </thead>
            <tbody>
              {newAssets.map(asset => (
                  <tr key={asset.id} className="border-b">
                    <td className="p-2">{asset.name}</td>
                    <td className="p-2">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                    <td className="p-2 text-right">{asset.purchasePrice.toLocaleString()} GNF</td>
                  </tr>
              ))}
               {newAssets.length === 0 && (
                <tr><td colSpan={3} className="text-center p-4 text-gray-500">Aucun nouvel actif pour cette période.</td></tr>
               )}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default InventaireReport;
