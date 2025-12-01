import React from 'react';
import { DecorOrder, DecorService, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface DevisDecorProps {
  order: DecorOrder;
  services: DecorService[];
  client: Client;
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
}

const DevisDecor: React.FC<DevisDecorProps> = ({ order, services, client, companyProfile, billingSettings }) => {
  if (!order || !client) return null;

  const subTotal = order.items.reduce((sum, item) => {
    const service = services.find(s => s.id === item.serviceId);
    return sum + (service ? service.price * item.quantity : 0);
  }, 0);

  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b border-gray-300">
        <div className="flex items-center">
            <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mr-4" />
            <div>
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <p className="text-gray-500">PS-DÉCOR</p>
                <p className="text-xs text-gray-500">{companyProfile.adresse}</p>
                <p className="text-xs text-gray-500">Tél: {companyProfile.telephone} | Email: {companyProfile.email}</p>
                <p className="text-xs text-gray-500">NIF: {companyProfile.nif} | RCCM: {companyProfile.rccm}</p>
            </div>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-semibold uppercase">Devis</h2>
            <p className="text-gray-500">Référence: {order.devisRef}</p>
            <p className="text-gray-500">Date: {new Date(order.orderDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">Client :</h3>
        <p className="font-bold text-lg">{client.name}</p>
        <p className="text-gray-600">{client.email}</p>
        <p className="text-gray-600">{client.phone}</p>
        <p className="text-gray-600">{client.address}</p>
      </section>
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black uppercase text-sm">
            <tr>
              <th className="p-3 font-semibold tracking-wide text-left">Description du Service</th>
              <th className="p-3 font-semibold tracking-wide text-center">Quantité</th>
              <th className="p-3 font-semibold tracking-wide text-right">Prix Unitaire</th>
              <th className="p-3 font-semibold tracking-wide text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
                const service = services.find(s => s.id === item.serviceId);
                if (!service) return null;
                return (
                    <tr key={index} className="border-b">
                        <td className="p-3">{service.name}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{service.price.toLocaleString()} GNF</td>
                        <td className="p-3 text-right">{(service.price * item.quantity).toLocaleString()} GNF</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </section>
      <section className="flex justify-end mt-8">
        <div className="w-full max-w-xs text-right">
             <div className="flex justify-between py-1">
                <span className="font-semibold">Sous-total:</span>
                <span>{subTotal.toLocaleString()} GNF</span>
            </div>
          {order.discount > 0 && (
             <div className="flex justify-between py-1 text-red-600">
                <span className="font-semibold">Remise:</span>
                <span>- {order.discount.toLocaleString()} GNF</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-black mt-2">
            <span className="font-bold text-lg">Total à Payer:</span>
            <span className="font-bold text-lg">{order.totalAmount.toLocaleString()} GNF</span>
          </div>
        </div>
      </section>
      <footer className="text-center text-xs text-gray-500 mt-12 pt-6 border-t">
          <p className="whitespace-pre-wrap mb-2">{billingSettings.defaultFooter}</p>
          <p>Ce devis est valable 30 jours.</p>
      </footer>
    </div>
  );
};

export default DevisDecor;