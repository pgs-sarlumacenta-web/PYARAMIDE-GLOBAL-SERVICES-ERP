import React from 'react';
// FIX: `ShopProduct` is obsolete; using the unified `Article` type.
import { ShopOrder, Article, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface BonLivraisonShopProps {
  order: ShopOrder;
  articles: Article[];
  client?: Client;
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
}

const BonLivraisonShop: React.FC<BonLivraisonShopProps> = ({ order, articles, client, companyProfile, billingSettings }) => {
  if (!order) return null;

  return (
    <div className="bg-white text-black dark:bg-white dark:text-black font-sans w-full max-w-2xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div className="flex items-center">
            <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4" />
            <div>
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <p className="text-gray-500 dark:text-gray-500">PS-SHOP</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase">Bon de Livraison</h2>
          <p className="text-gray-500 dark:text-gray-500">N°: {order.bonLivraisonRef}</p>
          <p className="text-gray-500 dark:text-gray-500">Date: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </header>

      <section className="my-8">
        <h3 className="font-semibold mb-2">Livré à:</h3>
        {client ? (
          <div>
            <p className="font-bold">{client.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-600">{client.email}</p>
            <p className="text-sm text-gray-600 dark:text-gray-600">{client.phone}</p>
          </div>
        ) : (
          <p>Client au comptoir</p>
        )}
      </section>

      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black dark:bg-gray-200 dark:text-black uppercase text-sm">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3 text-right">Quantité Livrée</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const product = articles.find(p => p.id === item.articleId);
              return (
                <tr key={index} className="border-b">
                  <td className="p-3 align-top">
                    <p className="font-medium">{product?.name || 'Produit inconnu'}</p>
                     {product?.specifications && product.specifications.length > 0 && (
                        <ul className="text-xs text-gray-500 dark:text-gray-500 mt-1 pl-4 list-disc">
                            {product.specifications.map((spec, i) => (
                                <li key={i}><strong>{spec.key}:</strong> {spec.value}</li>
                            ))}
                        </ul>
                    )}
                  </td>
                  <td className="p-3 text-right align-top">{item.quantity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <footer className="mt-24 pt-10">
        <div className="flex justify-between items-end text-center text-sm">
          <div>
            <p className="border-t-2 border-black pt-2 w-56 mx-auto">Signature ({companyProfile.nom})</p>
          </div>
          <div>
            <p className="border-t-2 border-black pt-2 w-56 mx-auto">Signature (Client)</p>
            <p className="mt-1">Reçu le: ____ / ____ / ________</p>
          </div>
        </div>
         <div className="text-center text-xs text-gray-500 dark:text-gray-500 mt-12 pt-6 border-t">
            <p className="whitespace-pre-wrap">{billingSettings.defaultFooter}</p>
        </div>
      </footer>
    </div>
  );
};

export default BonLivraisonShop;
