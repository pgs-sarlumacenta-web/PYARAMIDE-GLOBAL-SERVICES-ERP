import React from 'react';
import { DecorOrder, Client, CompanyProfile } from '../../types.ts';

interface RappelPaiementDecorProps {
  order: DecorOrder;
  client: Client;
  companyProfile: CompanyProfile;
}

const RappelPaiementDecor: React.FC<RappelPaiementDecorProps> = ({ order, client, companyProfile }) => {
  const balance = order.totalAmount - order.amountPaid;

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
        <p className="font-semibold">Objet: Solde impayé de {balance.toLocaleString()} GNF pour la commande "{order.description}"</p>
        <p className="mt-4">Cher/Chère {client.name},</p>
        <p className="mt-2">Sauf erreur ou omission de notre part, nous constatons que votre commande <strong className="text-decor-yellow">"{order.description}"</strong> présente un solde débiteur de <strong className="text-red-600">{balance.toLocaleString()} GNF</strong>.</p>
        <p className="mt-4">Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette somme dans les plus brefs délais.</p>
        <p>Si vous avez déjà effectué ce paiement, veuillez ne pas tenir compte de ce rappel.</p>
        <p className="mt-6">Cordialement,</p>
        <p className="font-semibold">La Direction de PS-DÉCOR</p>
      </section>

      <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
        <p>{companyProfile.nom} - Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </footer>
    </div>
  );
};

export default RappelPaiementDecor;