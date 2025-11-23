


import React from 'react';
import { Formateur, FormateurPayment, ScheduleEntry, CompanyProfile } from '../../types.ts';

interface EtatPrestationsProps {
  formateur: Formateur;
  payment: FormateurPayment;
  entries: ScheduleEntry[];
  companyProfile: CompanyProfile;
}

const getDurationHours = (start: string, end: string): number => {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
};

const EtatPrestations: React.FC<EtatPrestationsProps> = ({ formateur, payment, entries, companyProfile }) => {
  if (!formateur || !payment) return null;

  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b border-gray-300">
        <div>
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
          <p className="text-gray-500">{companyProfile.adresse}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase">État de Prestations</h2>
          <p className="text-gray-500">Réf: {payment.statementRef}</p>
          <p className="text-gray-500">Date: {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">Prestataire :</h3>
        <p className="font-bold text-lg">{formateur.name}</p>
        <p className="text-gray-600">{formateur.address}</p>
        <p className="text-gray-600">{formateur.email}</p>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des prestations ({payment.periodDescription})</h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Cours</th>
              <th className="p-2 text-right">Durée (h)</th>
              <th className="p-2 text-right">Tarif Horaire</th>
              <th className="p-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
                const duration = getDurationHours(entry.startTime, entry.endTime);
                const amount = duration * (formateur.tarifHoraire || 0);
                return (
                    <tr key={entry.id} className="border-b">
                        <td className="p-2">{entry.dayOfWeek}</td>
                        <td className="p-2">{entry.title}</td>
                        <td className="p-2 text-right">{duration.toFixed(2)}</td>
                        <td className="p-2 text-right">{(formateur.tarifHoraire || 0).toLocaleString()} GNF</td>
                        <td className="p-2 text-right">{amount.toLocaleString()} GNF</td>
                    </tr>
                );
            })}
          </tbody>
          <tfoot className="font-bold bg-gray-200">
            <tr>
                <td colSpan={4} className="p-3 text-right text-lg">Montant Total Payé</td>
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

export default EtatPrestations;
