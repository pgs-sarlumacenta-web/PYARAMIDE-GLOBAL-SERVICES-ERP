import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Article, ItemCategory, Materiel } from '../../types.ts';
import { BanknotesIcon, ArchiveBoxIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InventaireDashboardProps {
    articles: Article[];
    materiels: Materiel[];
    itemCategories: ItemCategory[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 rounded-full bg-admin-gray/10 text-admin-gray dark:bg-slate-700 dark:text-slate-200 mr-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const InventaireDashboard: React.FC<InventaireDashboardProps> = ({ articles, materiels, itemCategories }) => {
    
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#fff' : '#000',
    };

    const activeArticles = useMemo(() => articles.filter(m => !m.isArchived), [articles]);
    const activeMateriels = useMemo(() => materiels.filter(m => !m.isArchived), [materiels]);

    // KPIs
    const stockValue = useMemo(() => activeArticles.reduce((sum, m) => sum + (m.purchasePrice * m.stock), 0), [activeArticles]);
    const materielValue = useMemo(() => activeMateriels.reduce((sum, m) => sum + m.purchasePrice, 0), [activeMateriels]);
    const totalAssetValue = stockValue + materielValue;
    const lowStockCount = useMemo(() => activeArticles.filter(m => m.stock <= m.alertThreshold).length, [activeArticles]);
    const expiringSoonCount = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return activeArticles.filter(a =>
            a.datePeremption && new Date(a.datePeremption) <= thirtyDaysFromNow
        ).length;
    }, [activeArticles]);
    
    // Chart Data
    const valueByCategory = useMemo(() => {
        const data: { [key: string]: number } = {};
         activeArticles.forEach(m => {
            const category = itemCategories.find(c => c.id === m.categoryId);
            const catName = category?.name || 'Non Catégorisé';
            data[catName] = (data[catName] || 0) + (m.purchasePrice * m.stock);
        });
        return Object.entries(data).map(([name, Valeur]) => ({ name, Valeur }));
    }, [activeArticles, itemCategories]);

    const materielStatusDistribution = useMemo(() => {
        const data: { [key: string]: number } = {};
        activeMateriels.forEach(m => {
            data[m.status] = (data[m.status] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [activeMateriels]);

    const COLORS_STATUS = ['#22C55E', '#FBBF24', '#EF4444', '#3B82F6'];
    const COLORS_CAT = ['#475569', '#64748B', '#94A3B8', '#CBD5E1'];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Valeur Totale des Actifs" value={`${totalAssetValue.toLocaleString()} GNF`} icon={BanknotesIcon} />
                <StatCard title="Valeur du Stock" value={`${stockValue.toLocaleString()} GNF`} icon={ArchiveBoxIcon} />
                <StatCard title="Articles en Stock Faible" value={String(lowStockCount)} icon={ExclamationTriangleIcon} />
                <StatCard title="Péremption Proche/Expirés" value={String(expiringSoonCount)} icon={ExclamationTriangleIcon} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Statut du Matériel</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={materielStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                                {materielStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ color: tickColor }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Valeur du Stock par Catégorie</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={valueByCategory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Valeur" fill="#475569" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default InventaireDashboard;