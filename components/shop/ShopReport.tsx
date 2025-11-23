import React, { useMemo } from 'react';
// FIX: `ShopProduct` is obsolete; using the unified `Article` type.
import { ShopOrder, Client, Article, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface ShopReportProps {
  orders: ShopOrder[];
  articles: Article[];
  clients: Client[];
  period: string;
  companyProfile: CompanyProfile;
}

const ShopReport: React.FC<ShopReportProps> = ({ orders, articles, clients, period, companyProfile }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
  
  const topSellingProducts = useMemo(() => {
    const productQuantities: { [key: string]: number } = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productQuantities[item.articleId] = (productQuantities[item.articleId] || 0) + item.quantity;
        });
    });
    return Object.entries(productQuantities)
        .map(([productId, quantity]) => {
            const product = articles.find(p => p.id === productId);
            return { name: product?.name || 'Inconnu', quantity };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
  }, [orders, articles]);

  return (
    <ReportLayout title="Rapport PS-SHOP" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Total Ventes</h3>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-sm font-semibold text-green-700">Revenu (Paiements reçus)</h3>
            <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Top 5 Produits Vendus</h3>
          <table className="w-full text-sm text-left">
             <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Produit</th>
                <th className="p-2 text-right">Quantité Vendue</th>
              </tr>
            </thead>
            <tbody>
                {topSellingProducts.map(product => (
                    <tr key={product.name} className="border-b">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2 text-right">{product.quantity}</td>
                    </tr>
                ))}
            </tbody>
          </table>
        </section>
        
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Liste des Ventes sur la Période</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">ID Vente</th>
                <th className="p-2">Client</th>
                <th className="p-2 text-right">Montant Total</th>
                <th className="p-2 text-right">Montant Payé</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const client = clients.find(c => c.id === order.clientId);
                return (
                  <tr key={order.id} className="border-b">
                    <td className="p-2 font-mono">{order.id}</td>
                    <td className="p-2">{client?.name || 'Vente au comptoir'}</td>
                    <td className="p-2 text-right">{order.totalAmount.toLocaleString()} GNF</td>
                    <td className="p-2 text-right">{order.amountPaid.toLocaleString()} GNF</td>
                  </tr>
                );
              })}
               {orders.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">Aucune vente pour cette période.</td>
                </tr>
               )}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default ShopReport;
