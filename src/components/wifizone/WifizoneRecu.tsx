import React from 'react';
import { WifizoneSale, WifizonePlan, Client, CompanyProfile } from '../../types.ts';

interface WifizoneRecuProps {
  sale: WifizoneSale;
  plan: WifizonePlan;
  client?: Client;
  companyProfile: CompanyProfile;
}

const WifizoneRecu: React.FC<WifizoneRecuProps> = ({ sale, plan, client, companyProfile }) => {
  return (
    <div className="bg-white text-black font-sans w-full max-w-md mx-auto p-6 border border-gray-300 shadow-lg">
      <header className="text-center pb-4 border-b">
        <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
        <p className="text-sm text-gray-500">PS-WIFIZONE</p>
        <p className="text-xs">{companyProfile.adresse}</p>
      </header>

      <section className="my-4">
        <div className="flex justify-between text-xs">
          <p>Date: {new Date(sale.saleDate).toLocaleString('fr-FR')}</p>
          <p>Reçu N°: {sale.receiptRef}</p>
        </div>
        {client && <p className="text-sm mt-2">Client: {client.name}</p>}
      </section>

      <section>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Prix</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2">
                <p className="font-medium">Forfait Wifi: {plan.name}</p>
                <p className="text-xs text-gray-600">Durée: {plan.duration} heures</p>
              </td>
              <td className="p-2 text-right">{plan.price.toLocaleString()} GNF</td>
            </tr>
          </tbody>
          <tfoot className="font-bold">
            <tr>
              <td className="p-2 text-right">Total Payé</td>
              <td className="p-2 text-right">{sale.totalAmount.toLocaleString()} GNF</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6 text-center bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold uppercase">Votre Code d'Accès (Voucher)</h3>
        <p className="text-2xl font-bold font-mono tracking-widest my-2">{sale.voucherCode}</p>
        <p className="text-xs text-gray-500">Conservez ce code précieusement pour vous connecter.</p>
      </section>

      <footer className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
        <p>Merci de votre achat !</p>
      </footer>
    </div>
  );
};

export default WifizoneRecu;