import React from 'react';
// FIX: `ShopProduct` is obsolete; using the unified `Article` type.
import { ShopOrder, Article, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface RecuShopProps {
  order: ShopOrder;
  articles: Article[];
  client?: Client;
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
  receipt: { amount: number; date: string; ref: string; };
}

const RecuShop: React.FC<RecuShopProps> = ({ order, articles, client, companyProfile, billingSettings, receipt }) => {
  if (!order || !receipt) return null;
  const balance = order.totalAmount - order.amountPaid;

  return (
    <div className="bg-white text-black font-sans w-full max-w-2xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div className="flex items-center">
            <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4" />
            <div>
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <p className="text-gray-500">PS-SHOP</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase">Reçu de Paiement</h2>
          <p className="text-gray-500">Reçu N°: {receipt.ref}</p>
          <p className="text-gray-500">Date: {new Date(receipt.date).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>

       <section className="my-8">
        <h3 className="font-semibold mb-2">Client:</h3>
        {client ? (
          <div>
            <p className="font-bold">{client.name}</p>
             <p className="text-sm text-gray-600">{client.email}</p>
            <p className="text-sm text-gray-600">{client.phone}</p>
          </div>
        ) : (
          <p>Achat de produits divers.</p>
        )}
      </section>
      
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black uppercase text-sm">
            <tr>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
                <td className="p-3">Paiement pour commande #{order.id}</td>
                <td className="p-3 text-right">{receipt.amount.toLocaleString()} GNF</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-8">
        <div className="w-full max-w-xs text-right">
          <div className="flex justify-between py-1"><span>Total Commande:</span><span>{order.totalAmount.toLocaleString()} GNF</span></div>
          <div className="flex justify-between py-1 font-semibold text-green-600"><span>Total Payé (à ce jour):</span><span>{order.amountPaid.toLocaleString()} GNF</span></div>
          <div className="flex justify-between py-3 border-t-2 border-black mt-2"><span className="font-bold text-lg">Solde Restant:</span><span className="font-bold text-lg">{balance.toLocaleString()} GNF</span></div>
        </div>
      </section>

      <footer className="text-center mt-12 pt-6 border-t border-gray-300">
        <p className="text-gray-600 font-semibold">Merci de votre visite !</p>
        <p className="text-xs text-gray-500 whitespace-pre-wrap mt-2">{billingSettings.defaultFooter}</p>
      </footer>
    </div>
  );
};

export default RecuShop;