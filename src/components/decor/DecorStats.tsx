import React, { useState, useMemo, ReactNode } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
// FIX: `Consumable` type is obsolete, using the unified `Article` type.
import { DecorOrder, DecorService, Article } from '../../types.ts';
import { BanknotesIcon, ShoppingCartIcon, ArchiveBoxIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface DecorStatsProps {
    orders: DecorOrder[];
    services: DecorService[];
    articles: Article[];
}

type Period = 'day' | 'week' | 'month';

const StatCard: React.FC<{ title: string; icon: React.ElementType; children: ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105">
        <div className="p-3 rounded-full bg-decor-yellow/10 text-decor-yellow mr-4">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold">{children}</p>
        </div>
    </div>
);

const CountUp: React.FC<{ end: number, duration?: number, suffix?: string, prefix?: string }> = ({ end, duration = 1500, suffix = '', prefix = '' }) => {
    const [count, setCount] = useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);

    React.useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = Math.round(end * progress);
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);
        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const DecorStats: React.FC<DecorStatsProps> = ({ orders, services, articles }) => {
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#fff' : '#000',
    };

    const [period, setPeriod] = useState<Period>('month');
    const consumables = articles.filter(a => a.isConsumable);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        return orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            if (period === 'day') {
                return orderDate.toDateString() === now.toDateString();
            }
            if (period === 'week') {
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                return orderDate >= weekStart;
            }
            if (period === 'month') {
                return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [orders, period]);
    
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    const totalOrders = filteredOrders.length;
    const stockValue = consumables.reduce((sum, c) => sum + (c.stock * c.purchasePrice), 0);

    const revenueByService = services.map(service => ({
        name: service.name,
        Revenus: filteredOrders.filter(o => o.description.includes(service.name)).reduce((sum, o) => sum + o.amountPaid, 0)
    })).filter(s => s.Revenus > 0);

    const monthlyRevenue = useMemo(() => {
        const data: { [key: string]: number } = {};
        orders.forEach(o => {
            const month = new Date(o.orderDate).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
            data[month] = (data[month] || 0) + o.amountPaid;
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus })).reverse();
    }, [orders]);

    const topConsumables = useMemo(() => {
        const usage: { [key: string]: number } = {};
        orders.forEach(order => {
            order.items.forEach(orderItem => {
                const service = services.find(s => s.id === orderItem.serviceId);
                if (service) {
                    service.articles.forEach(serviceArticle => {
                        const totalUsage = serviceArticle.quantity * orderItem.quantity;
                        usage[serviceArticle.articleId] = (usage[serviceArticle.articleId] || 0) + totalUsage;
                    });
                }
            });
        });
        return Object.entries(usage).map(([id, quantity]) => ({
            name: articles.find(c => c.id === id)?.name || 'N/A',
            value: quantity
        })).sort((a,b) => b.value - a.value).slice(0, 5);
    }, [orders, services, articles]);
    
    const COLORS = ['#FBBF24', '#F97316', '#EAB308', '#D97706', '#B45309'];
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="input-style dark:bg-gray-700">
                    <option value="day">Aujourd'hui</option>
                    <option value="week">Cette Semaine</option>
                    <option value="month">Ce Mois</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Chiffre d'Affaires" icon={BanknotesIcon}>
                    <CountUp end={totalRevenue} suffix=" GNF" />
                </StatCard>
                <StatCard title="Commandes" icon={ShoppingCartIcon}>
                     <CountUp end={totalOrders} />
                </StatCard>
                <StatCard title="Valeur du Stock" icon={ArchiveBoxIcon}>
                    <CountUp end={stockValue} suffix=" GNF" />
                </StatCard>
                 <StatCard title="Consommables Critiques" icon={ChartBarIcon}>
                    <CountUp end={consumables.filter(c => c.stock <= c.alertThreshold).length} />
                </StatCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Revenus par Service ({period})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByService}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="Revenus" fill="#FBBF24" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Top 5 Consommables (Total)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={topConsumables} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label fill={tickColor}>
                               {topConsumables.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle}/>
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold mb-4">Évolution du CA Mensuel (Total)</h3>
                 <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={monthlyRevenue}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                         <XAxis dataKey="name" tick={{ fill: tickColor }} />
                         <YAxis tick={{ fill: tickColor }} />
                         <Tooltip contentStyle={tooltipStyle} />
                         <Line type="monotone" dataKey="Revenus" stroke="#FBBF24" strokeWidth={2} />
                     </LineChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DecorStats;