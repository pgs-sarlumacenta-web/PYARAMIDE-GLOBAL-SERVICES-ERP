

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
// FIX: `ShopProduct` is obsolete; using the unified `Article` type.
import { ShopOrder, Article, Client, ItemCategory, ShopOrderStatus } from '../../types.ts';
import { BanknotesIcon, ShoppingCartIcon, ScaleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ShopDashboardProps {
    orders: ShopOrder[];
    articles: Article[];
    clients: Client[];
    itemCategories: ItemCategory[];
}

type Period = 'this_month' | 'last_3_months' | 'this_year';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 rounded-full bg-shop-green/10 text-shop-green mr-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const ShopDashboard: React.FC<ShopDashboardProps> = ({ orders, articles, clients, itemCategories }) => {
    
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#fff' : '#000',
    };

    const [period, setPeriod] = useState<Period>('this_month');
    const [categoryId, setCategoryId] = useState<string>('Toutes');
    
    const productCategories = useMemo(() => itemCategories.filter(c => !c.isArchived), [itemCategories]);

    const completedOrders = useMemo(() => orders.filter(o => !o.isArchived && (o.status === 'Payé' || o.status === 'Livré')), [orders]);
    
    // KPIs
    const totalRevenue = useMemo(() => completedOrders.reduce((sum, o) => sum + o.totalAmount, 0), [completedOrders]);
    const totalSales = completedOrders.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const lowStockProductsCount = useMemo(() => articles.filter(p => p.isSellable && !p.isArchived && p.stock <= p.alertThreshold).length, [articles]);

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
                const product = articles.find(p => p.id === item.articleId);
                return product?.categoryId === categoryId;
            });
        });
    }, [orders, articles, period, categoryId]);

    // Chart Data
    const salesByCategory = useMemo(() => {
        const categorySales: { [key: string]: number } = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const product = articles.find(p => p.id === item.articleId);
                if (product) {
                    const categoryId = product.categoryId;
                    const saleAmount = item.quantity * (item.unitPrice - (item.discount || 0));
                    categorySales[categoryId] = (categorySales[categoryId] || 0) + saleAmount;
                }
            });
        });

        return Object.entries(categorySales).map(([catId, value]) => {
            const category = itemCategories.find(c => c.id === catId);
            return { name: category?.name || 'Inconnu', value };
        });
    }, [completedOrders, articles, itemCategories]);

    const topSellingProducts = useMemo(() => {
        const productQuantities: { [key: string]: number } = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const product = articles.find(p => p.id === item.articleId);
                if (product) {
                    productQuantities[product.name] = (productQuantities[product.name] || 0) + item.quantity;
                }
            });
        });
        return Object.entries(productQuantities)
            .map(([name, Quantité]) => ({ name, Quantité }))
            .sort((a, b) => b.Quantité - a.Quantité)
            .slice(0, 5);
    }, [completedOrders, articles]);
    
    const salesByDate = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredOrders.forEach(o => {
            const date = new Date(o.orderDate).toLocaleDateString('fr-FR');
            data[date] = (data[date] || 0) + o.totalAmount;
        });
        return Object.entries(data).map(([name, Ventes]) => ({ name, Ventes })).reverse();
    }, [filteredOrders]);
    
    const stockValue = useMemo(() => {
        return articles.filter(a => a.isSellable).reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
    }, [articles]);


    // Recent Activity & Alerts
    const recentOrders = useMemo(() => {
        return [...orders]
            .filter(o => !o.isArchived)
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 5);
    }, [orders]);
    
    const lowStockProducts = useMemo(() => {
        return articles.filter(p => p.isSellable && !p.isArchived && p.stock <= p.alertThreshold);
    }, [articles]);
    
    const getStatusClass = (status: ShopOrderStatus) => {
        const classes: { [key in ShopOrderStatus]: string } = {
            'Devis': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', 'Confirmé': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
            'Payé': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200', 'Livré': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
            'Annulé': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
        };
        return classes[status];
    };

    const COLORS = ['#10B981', '#3B82F6', '#FBBF24', '#8B5CF6', '#E53E3E'];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Chiffre d'Affaires" value={`${totalRevenue.toLocaleString()} GNF`} icon={BanknotesIcon} />
                <StatCard title="Nombre de Ventes" value={String(totalSales)} icon={ShoppingCartIcon} />
                <StatCard title="Panier Moyen" value={`${Math.round(averageOrderValue).toLocaleString()} GNF`} icon={ScaleIcon} />
                <StatCard title="Alertes de Stock" value={String(lowStockProductsCount)} icon={ExclamationTriangleIcon} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Top 5 Produits Vendus (Global)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topSellingProducts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor}/>
                            <XAxis type="number" allowDecimals={false} tick={{ fill: tickColor }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value} unités`} />
                            <Bar dataKey="Quantité" fill="#10B981" name="Quantité vendue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Ventes par Catégorie (Global)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                               {salesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                           <Legend wrapperStyle={{ color: tickColor }} />
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Commandes Récentes</h3>
                    <ul className="space-y-4">
                        {recentOrders.map(order => {
                             const client = clients.find(c => c.id === order.clientId);
                             return (
                                <li key={order.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{client?.name || 'Vente au comptoir'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleDateString()} - {order.totalAmount.toLocaleString()} GNF</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusClass(order.status)}`}>{order.status}</span>
                                </li>
                             )
                        })}
                    </ul>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-500">Alertes de Stock</h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                        {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                            <li key={product.id} className="flex justify-between items-center text-sm">
                                <span>{product.name}</span>
                                <span className="font-bold text-red-500">{product.stock} unités restantes</span>
                            </li>
                        )) : <p className="text-sm text-gray-500">Aucun produit en stock critique.</p>}
                    </ul>
                </div>
            </div>

            {/* Detailed Stats Section */}
            <div className="space-y-6 mt-12">
                 <h2 className="text-2xl font-bold text-center">Analyses Détaillées</h2>
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
                    <h3 className="font-semibold mb-4">Évolution des Ventes (filtré)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesByDate}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }}/>
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                            <Line type="monotone" dataKey="Ventes" stroke="#10B981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ShopDashboard;