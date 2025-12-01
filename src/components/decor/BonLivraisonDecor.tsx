import React from 'react';
import { DecorOrder, Client, DecorService, CompanyProfile, BillingSettings } from '../../types.ts';

interface BonLivraisonDecorProps {
  order: DecorOrder;
  client: Client;
  services: DecorService[];
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
}

const BonLivraisonDecor: React.FC<BonLivraisonDecorProps> = ({ order, client, services, companyProfile, billingSettings }) => {
  if (!order || !client) return null;

  return (
    <div className="bg-white text-black dark:bg-white dark:text-black font-sans w-full max-w-4xl mx-auto p-8 border shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div className="flex items-center">
            <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mr-4" />
            <div>
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <p className="text-gray-500 dark:text-gray-500">PS-DÉCOR</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{companyProfile.adresse}</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase">Bon de Livraison</h2>
          <p className="text-gray-500 dark:text-gray-500">BL N°: {order.bonRef}</p>
          <p className="text-gray-500 dark:text-gray-500">Réf. Facture: {order.factureRef}</p>
          <p className="text-gray-500 dark:text-gray-500">Date: {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">Livré à :</h3>
        <p className="font-bold text-lg">{client.name}</p>
        <p className="text-gray-600 dark:text-gray-600">{client.email}</p>
        <p className="text-gray-600 dark:text-gray-600">{client.phone}</p>
      </section>
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black dark:bg-gray-200 dark:text-black uppercase text-sm">
            <tr>
              <th className="p-3 font-semibold tracking-wide text-left">Description du Service Livré</th>
              <th className="p-3 font-semibold tracking-wide text-right">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
                const service = services.find(s => s.id === item.serviceId);
                return (
                    <tr key={index} className="border-b">
                        <td className="p-3">{service?.name || 'Service inconnu'}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </section>
      <footer className="mt-20 pt-10">
        <div className="flex justify-between items-end text-center text-sm">
          <div><p className="border-t-2 border-black pt-2 w-64 mx-auto">Signature Livreur</p></div>
          <div><p className="border-t-2 border-black pt-2 w-64 mx-auto">Signature Client</p></div>
        </div>
         <div className="text-center text-xs text-gray-500 dark:text-gray-500 mt-12 pt-6 border-t">
            <p className="whitespace-pre-wrap">{billingSettings.defaultFooter}</p>
        </div>
      </footer>
    </div>
  );
};

export default BonLivraisonDecor;