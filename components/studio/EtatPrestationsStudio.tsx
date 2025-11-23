
import React from 'react';
import { StudioIntervenant, StudioIntervenantPayment, CompanyProfile } from '../../types.ts';

interface EtatPrestationsStudioProps {
  intervenant: StudioIntervenant;
  payment: StudioIntervenantPayment;
  companyProfile: CompanyProfile;
}

const EtatPrestationsStudio: React.FC<EtatPrestationsStudioProps> = ({ intervenant, payment, companyProfile }) => {
  if (!intervenant || !payment) return null;

  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b border-gray-300">
        <div>
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
          <p className="text-gray-500">{companyProfile.adresse}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase">État de Prestations - Studio</h2>
          <p className="text-gray-500">Réf: {payment.statementRef}</p>
          <p className="text-gray-500">Date: {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">Prestataire :</h3>
        <p className="font-bold text-lg">{intervenant.name}</p>
        <p className="text-gray-600">{intervenant.email}</p>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des prestations ({payment.periodDescription})</h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Projet</th>
              <th className="p-2">Prestation</th>
              <th className="p-2 text-right">Rémunération</th>
            </tr>
          </thead>
          <tbody>
            {payment.interventions.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">Projet #{item.projectId}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-right">{item.amount.toLocaleString()} GNF</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold bg-gray-200">
            <tr>
                <td colSpan={2} className="p-3 text-right text-lg">Montant Total Payé</td>
                <td className="p-3 text-right text-lg">{payment.amount.toLocaleString()} GNF</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
        <p>Document généré par le système de gestion PGS-SARLU. Réf. Transaction: {payment.transactionId}</p>
      </footer>
    </div>
  );
};

export default EtatPrestationsStudio;
