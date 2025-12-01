import React from 'react';
// FIX: `ShopProduct` is obsolete; using the unified `Article` type.
import { ShopOrder, Article, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface FactureProformaShopProps {
  order: ShopOrder;
  articles: Article[];
  client?: Client;
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
}

const FactureProformaShop: React.FC<FactureProformaShopProps> = ({ order, articles, client, companyProfile, billingSettings }) => {
  if (!order) return null;
  const totalDiscount = order.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);

  return (
    <div className="bg-white text-black dark:bg-white dark:text-black font-sans w-full max-w-2xl mx-auto p-8 border border-gray-300 shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b border-gray-300">
        <div className="flex items-center">
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
            <p className="text-gray-500 dark:text-gray-500">PS-SHOP</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold uppercase">Facture Proforma</h2>
          <p className="text-gray-500 dark:text-gray-500">N°: {order.proformaRef}</p>
          <p className="text-gray-500 dark:text-gray-500">Date: {new Date(order.orderDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      
      <section className="my-8">
        <h3 className="font-semibold mb-2">Client:</h3>
        {client ? (
          <div>
            <p className="font-bold">{client.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-600">{client.email}</p>
            <p className="text-sm text-gray-600 dark:text-gray-600">{client.phone}</p>
          </div>
        ) : (
          <p>Vente au comptoir</p>
        )}
      </section>

      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-200 text-black dark:bg-gray-200 dark:text-black uppercase text-sm">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3 text-center">Qté</th>
              <th className="p-3 text-right">P.U.</th>
              <th className="p-3 text-right">Remise / Unité</th>
              <th className="p-3 text-right">Total</th>
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
                  <td className="p-3 align-top text-center">{item.quantity}</td>
                  <td className="p-3 align-top text-right">{item.unitPrice.toLocaleString()} GNF</td>
                   <td className="p-3 align-top text-right text-red-600 dark:text-red-600">{item.discount ? `- ${item.discount.toLocaleString()} GNF` : '-'}</td>
                  <td className="p-3 text-right align-top font-semibold">{(item.quantity * (item.unitPrice - (item.discount || 0))).toLocaleString()} GNF</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-8">
        <div className="w-full max-w-xs text-right">
          <div className="flex justify-between py-1"><span>Sous-total:</span><span>{order.subTotal.toLocaleString()} GNF</span></div>
          {totalDiscount > 0 && <div className="flex justify-between py-1 text-red-600 dark:text-red-600"><span>Remise Totale:</span><span>- {totalDiscount.toLocaleString()} GNF</span></div>}
          <div className="flex justify-between py-3 border-t-2 border-black mt-2">
            <span className="font-bold text-lg">Total à Payer:</span>
            <span className="font-bold text-lg">{order.totalAmount.toLocaleString()} GNF</span>
          </div>
        </div>
      </section>
      
      <footer className="text-center mt-12 pt-6 border-t border-gray-300 text-sm text-gray-500 dark:text-gray-500">
        <p className="whitespace-pre-wrap">{billingSettings.defaultFooter}</p>
        <p>Cette facture proforma confirme notre accord.</p>
      </footer>
    </div>
  );
};

export default FactureProformaShop;
