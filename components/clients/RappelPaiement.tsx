import React from 'react';
import { Client, CompanyProfile } from '../../types.ts';

interface RappelPaiementProps {
  client: Client;
  companyProfile: CompanyProfile;
  interactions: any[];
  totalDue: number;
}

const RappelPaiement: React.FC<RappelPaiementProps> = ({ client, companyProfile, interactions, totalDue }) => {
    const unpaidItems = interactions.filter(item => item.totalAmount > item.amountPaid);

  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div>
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
          <p className="text-gray-500">{companyProfile.adresse}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase">Rappel de Paiement</h2>
          <p className="text-gray-500">Date: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">À l'attention de :</h3>
        <p className="font-bold text-lg">{client.name}</p>
        <p className="text-gray-600">{client.address}</p>
        <p className="text-gray-600">{client.email}</p>
      </section>

      <section className="my-8 text-base leading-relaxed">
        <p className="font-semibold">Objet: Solde impayé de {totalDue.toLocaleString()} GNF</p>
        <p className="mt-4">Cher/Chère {client.name},</p>
        <p className="mt-2">Sauf erreur ou omission de notre part, nous constatons que votre compte client présente un solde débiteur de <strong className="text-red-600">{totalDue.toLocaleString()} GNF</strong>.</p>
        <p className="mt-2">Ce montant correspond aux prestations/produits listés ci-dessous pour lesquels le paiement n'a pas été entièrement réglé.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des soldes impayés</h3>
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
                <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Module</th>
                    <th className="p-2 text-right">Solde Dû</th>
                </tr>
            </thead>
            <tbody>
                {unpaidItems.map((item, index) => {
                    const balance = item.totalAmount - item.amountPaid;
                    if (balance <= 0) return null;

                    return (
                        <tr key={index} className="border-b">
                            <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.type}</td>
                            <td className="p-2 text-right font-semibold">{balance.toLocaleString()} GNF</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </section>

      <section className="my-8 text-base leading-relaxed">
        <p className="mt-4">Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les plus brefs délais.</p>
        <p>Si vous avez déjà effectué ce paiement, veuillez ne pas tenir compte de ce rappel.</p>
        <p className="mt-4">Nous restons à votre disposition pour toute question.</p>
        <p className="mt-6">Cordialement,</p>
        <p className="font-semibold">{companyProfile.nom}</p>
      </section>

      <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
        <p>Document généré par le système de gestion PGS-SARLU.</p>
      </footer>
    </div>
  );
};

export default RappelPaiement;