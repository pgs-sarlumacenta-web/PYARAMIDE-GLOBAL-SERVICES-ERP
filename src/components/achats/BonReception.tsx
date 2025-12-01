

import React from 'react';
// FIX: Unified `Article` type is used for all inventory items.
import { PurchaseOrder, Supplier, Article, CompanyProfile } from '../../types.ts';

interface BonReceptionProps {
  purchaseOrder: PurchaseOrder;
  suppliers: Supplier[];
  articles: Article[];
  companyProfile: CompanyProfile;
}

const BonReception: React.FC<BonReceptionProps> = ({ purchaseOrder, suppliers, articles, companyProfile }) => {
  if (!purchaseOrder) return null;

  const supplier = suppliers.find(s => s.id === purchaseOrder.supplierId);

  return (
    <div className="bg-white text-black dark:text-black font-sans w-full max-w-4xl mx-auto p-8 border shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div>
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
          <p className="text-gray-500 dark:text-gray-500">Service de Réception</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase">Bon de Réception</h2>
          <p className="text-gray-500 dark:text-gray-500">Réf. Commande: {purchaseOrder.id}</p>
          <p className="text-gray-500 dark:text-gray-500">Date de Réception: {purchaseOrder.receptionDate ? new Date(purchaseOrder.receptionDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">Reçu de :</h3>
        <p className="font-bold text-lg">{supplier?.name || 'Fournisseur inconnu'}</p>
        <p className="text-gray-600 dark:text-gray-600">{supplier?.address}</p>
      </section>
      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black dark:text-black uppercase text-sm">
            <tr>
              <th className="p-3 font-semibold tracking-wide text-left">Désignation</th>
              <th className="p-3 font-semibold tracking-wide text-right">Quantité Reçue</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.items.map((item, index) => {
                const fullItem = articles.find(i => i.id === item.articleId);
                return (
                    <tr key={index} className="border-b">
                        <td className="p-3">{fullItem?.name || 'Article inconnu'}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </section>
      <footer className="mt-20 pt-10">
        <div className="flex justify-between items-end text-center text-sm">
            <div>
                <p className="border-t-2 border-black pt-2 w-64 mx-auto">Cachet & Signature Fournisseur</p>
            </div>
            <div>
                <p className="border-t-2 border-black pt-2 w-64 mx-auto">Cachet & Signature Réceptionnaire</p>
                <p className="font-bold mt-1">{companyProfile.nom}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default BonReception;
