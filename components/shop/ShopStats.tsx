import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// FIX: The `ShopProduct` type has been replaced by the unified `Article` type.
import { ShopOrder, Article } from '../../types.ts';
import { useData } from '../../context/DataContext.tsx';

interface ShopStatsProps {
    orders: ShopOrder[];
    products: Article[];
}

type Period = 'this_month' | 'last_3_months' | 'this_year';

const ShopStats: React.FC<ShopStatsProps> = ({ orders, products }) => {
    const { itemCategories } = useData();
    const [period, setPeriod] = useState<Period>('this_month');
    const [categoryId, setCategoryId] = useState<string>('Toutes');
    
    const productCategories = useMemo(() => itemCategories.filter(c => !c.isArchived), [itemCategories]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        return orders.filter(o => {
            const date = new Date(o.orderDate);
            let periodMatch = false;
            if (period === 'this_year') periodMatch = date.getFullYear() === now.getFullYear();
            else if (period === 'this_month') periodMatch = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            else if (period === 'last_3_months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                periodMatch = date >= threeMonthsAgo;
            }
            if(!periodMatch) return false;
            
            if (categoryId === 'Toutes') return true;
            return o.items.some(item => {
                const product = products.find(p => p.id === item.articleId);
                return product?.categoryId === categoryId;
            });
        });
    }, [orders, products, period, categoryId]);

    const salesByDate = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredOrders.forEach(o => {
            const date = new Date(o.orderDate).toLocaleDateString('fr-FR');
            data[date] = (data[date] || 0) + o.totalAmount;
        });
        return Object.entries(data).map(([name, Ventes]) => ({ name, Ventes })).reverse();
    }, [filteredOrders]);

    const topSellingProducts = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredOrders.forEach(o => {
            o.items.forEach(item => {
                const product = products.find(p => p.id === item.articleId);
                if (product) {
                    data[product.name] = (data[product.name] || 0) + item.quantity;
                }
            });
        });
        return Object.entries(data).map(([name, Quantité]) => ({ name, Quantité })).sort((a,b) => b.Quantité - a.Quantité).slice(0, 5);
    }, [filteredOrders, products]);
    
    const stockValue = useMemo(() => {
        return products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
    }, [products]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-wrap gap-4 justify-end items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="input-style dark:bg-gray-700">
                    <option value="this_month">Ce Mois</option>
                    <option value="last_3_months">3 Derniers Mois</option>
                    <option value="this_year">Cette Année</option>
                </select>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-style dark:bg-gray-700">
                    <option value="Toutes">Toutes les catégories</option>
                    {productCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold">Valeur Totale du Stock</h3>
                <p className="text-2xl font-bold">{stockValue.toLocaleString()} GNF</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-4">Évolution des Ventes</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesByDate}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                        <Line type="monotone" dataKey="Ventes" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-4">Top 5 Produits les Plus Vendus</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSellingProducts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Quantité" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ShopStats;
