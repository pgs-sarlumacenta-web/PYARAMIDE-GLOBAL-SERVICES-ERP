import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
// FIX: `Consumable` and `ShopProduct` are obsolete; using the unified `Article` type.
import { PurchaseOrder, Supplier, Article, ItemCategory } from '../../types.ts';
import { BanknotesIcon, ShoppingCartIcon, TruckIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

interface AchatsDashboardProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    articles: Article[];
    itemCategories: ItemCategory[];
}

type Period = 'this_month' | 'last_3_months' | 'this_year';

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 rounded-full bg-achats-purple/10 text-achats-purple mr-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const AchatsDashboard: React.FC<AchatsDashboardProps> = ({ purchaseOrders, suppliers, articles, itemCategories }) => {
    
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
    
    const receivedOrders = useMemo(() => purchaseOrders.filter(o => !o.isArchived && o.status === 'Reçu'), [purchaseOrders]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        return receivedOrders.filter(o => {
            const date = new Date(o.orderDate);
            if (period === 'this_year') return date.getFullYear() === now.getFullYear();
            if (period === 'this_month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            if (period === 'last_3_months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                return date >= threeMonthsAgo;
            }
            return true;
        });
    }, [receivedOrders, period]);

    // KPIs
    const totalSpend = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0), [filteredOrders]);
    const totalOrders = useMemo(() => filteredOrders.length, [filteredOrders]);
    const activeSuppliers = useMemo(() => suppliers.filter(s => !s.isArchived).length, [suppliers]);
    const stockValue = useMemo(() => {
        return articles.reduce((sum, a) => sum + (a.stock * a.purchasePrice), 0);
    }, [articles]);

    // Chart Data
    const spendBySupplier = useMemo(() => {
        const supplierSpend: { [key: string]: number } = {};
        filteredOrders.forEach(order => {
            supplierSpend[order.supplierId] = (supplierSpend[order.supplierId] || 0) + order.totalAmount;
        });
        return Object.entries(supplierSpend).map(([supplierId, value]) => {
            const supplier = suppliers.find(s => s.id === supplierId);
            return { name: supplier?.name || 'Inconnu', value };
        }).sort((a, b) => b.value - a.value);
    }, [filteredOrders, suppliers]);

    const spendByCategory = useMemo(() => {
        const categorySpend: { [key: string]: number } = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const fullItem = articles.find(i => i.id === item.articleId);
                if (fullItem) {
                    const category = itemCategories.find(c => c.id === fullItem.categoryId);
                    if(category) {
                        categorySpend[category.name] = (categorySpend[category.name] || 0) + (item.quantity * item.purchasePrice);
                    }
                }
            });
        });
        return Object.entries(categorySpend).map(([name, Dépenses]) => ({ name, Dépenses }));
    }, [filteredOrders, articles, itemCategories]);

    const spendOverTime = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredOrders.forEach(o => {
            const dateKey = new Date(o.orderDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            data[dateKey] = (data[dateKey] || 0) + o.totalAmount;
        });
        return Object.entries(data).map(([name, Dépenses]) => ({ name, Dépenses }));
    }, [filteredOrders]);

    const recentOrders = useMemo(() => {
        return [...purchaseOrders]
            .filter(o => !o.isArchived)
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 5);
    }, [purchaseOrders]);

    const COLORS = ['#8B5CF6', '#6366F1', '#EC4899', '#F97316', '#10B981'];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Dépenses Totales" value={`${totalSpend.toLocaleString()} GNF`} icon={BanknotesIcon} />
                <StatCard title="Commandes Reçues" value={String(totalOrders)} icon={ShoppingCartIcon} />
                <StatCard title="Fournisseurs Actifs" value={String(activeSuppliers)} icon={TruckIcon} />
                <StatCard title="Valeur du Stock" value={`${Math.round(stockValue).toLocaleString()} GNF`} icon={ArchiveBoxIcon} />
            </div>

            {/* Charts */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Évolution des Dépenses</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spendOverTime}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                        <XAxis dataKey="name" tick={{ fill: tickColor }} />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                        <Line type="monotone" dataKey="Dépenses" stroke="#8B5CF6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Dépenses par Catégorie d'Article</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={spendByCategory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Dépenses" fill="#8B5CF6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Dépenses par Fournisseur</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={spendBySupplier} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                               {spendBySupplier.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                           <Legend wrapperStyle={{ color: tickColor }}/>
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Dernières Commandes d'Achat</h3>
                <ul className="space-y-4">
                    {recentOrders.map(order => {
                         const supplier = suppliers.find(c => c.id === order.supplierId);
                         return (
                            <li key={order.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">Commande #{order.id}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{supplier?.name || 'Inconnu'} - {new Date(order.orderDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{order.totalAmount.toLocaleString()} GNF</p>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.status === 'Reçu' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'}`}>{order.status}</span>
                                </div>
                            </li>
                         )
                    })}
                </ul>
            </div>
        </div>
    );
};

export default AchatsDashboard;