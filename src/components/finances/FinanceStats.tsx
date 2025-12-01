import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line } from 'recharts';
import { BanknotesIcon, ArrowTrendingDownIcon, ScaleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Budget, Transaction } from '../../types.ts';

const useCountUp = (end: number, duration = 1500) => {
    const [count, setCount] = useState(0);
    React.useEffect(() => {
        let start = 0;
        const totalFrames = Math.round(duration / (1000 / 60));
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            setCount(start + (end - start) * progress);
            if (frame === totalFrames) clearInterval(counter);
        }, 1000 / 60);
        return () => clearInterval(counter);
    }, [end, duration]);
    return count;
};

interface AnimatedStatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend?: number;
    trendIsGood?: 'up' | 'down';
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ title, value, icon: Icon, color, trend, trendIsGood = 'up' }) => {
    const count = useCountUp(value);

    const renderTrend = () => {
        if (trend === undefined || !isFinite(trend)) {
            return null;
        }

        const isGood = trendIsGood === 'up' ? trend > 0 : trend < 0;
        const isBad = trendIsGood === 'up' ? trend < 0 : trend > 0;
        
        const colorClass = isGood ? 'text-green-500' : isBad ? 'text-red-500' : 'text-gray-500';
        const TrendIcon = trend > 0 ? ArrowTrendingUpIcon : trend < 0 ? ArrowTrendingDownIcon : null;
        const trendSign = trend > 0 ? '+' : '';

        return (
            <div className={`text-xs font-semibold flex items-center ${colorClass}`}>
                {TrendIcon && <TrendIcon className="h-4 w-4 mr-0.5" />}
                <span>{trendSign}{trend.toFixed(1)}%</span>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
            <div className={`p-3 rounded-full ${color} mr-4`}>
                <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <div className="flex items-end space-x-2">
                    <p className="text-2xl font-bold">{Math.round(count).toLocaleString()} GNF</p>
                    {renderTrend()}
                </div>
            </div>
        </div>
    );
};

const FinanceStats: React.FC = () => {
    const { transactions, budgets } = useData();
    const [period, setPeriod] = useState<'this_month' | 'last_3_months' | 'this_year'>('this_month');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        return transactions.filter(t => !t.isArchived).filter(t => {
            const date = new Date(t.date);
            if (period === 'this_year') return date.getFullYear() === now.getFullYear();
            if (period === 'this_month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            if (period === 'last_3_months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                return date >= threeMonthsAgo;
            }
            return true;
        });
    }, [transactions, period]);

    const financialSummary = useMemo(() => {
        const departments = ['Académie', 'Studio', 'Décor', 'Shop', 'Wifizone', 'Achats', 'Général'];
        const summary = departments.map(dept => ({
            name: dept,
            Revenus: 0,
            Dépenses: 0,
            'Résultat Net': 0,
            budget: 0,
        }));

        filteredTransactions.forEach(t => {
            const deptIndex = summary.findIndex(d => d.name === t.department);
            if (deptIndex > -1) {
                if (t.type === 'Revenu') {
                    summary[deptIndex].Revenus += t.amount;
                } else {
                    summary[deptIndex].Dépenses += t.amount;
                }
            }
        });
        
        const now = new Date();
        const relevantBudgets = budgets.filter(b => {
            if (b.scope !== 'department') return false;
            
            const budgetDate = new Date(b.year, b.month - 1);
            if (period === 'this_month') {
                return budgetDate.getFullYear() === now.getFullYear() && budgetDate.getMonth() === now.getMonth();
            }
            if (period === 'this_year') {
                return budgetDate.getFullYear() === now.getFullYear();
            }
            if (period === 'last_3_months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                return budgetDate >= threeMonthsAgo && budgetDate <= now;
            }
            return false;
        });

        summary.forEach(dept => {
            dept['Résultat Net'] = dept.Revenus + dept.Dépenses;
            dept.budget = relevantBudgets
                .filter(b => b.scopeId === dept.name)
                .reduce((sum, b) => sum + b.amount, 0);
        });

        const totals = {
            totalRevenus: summary.reduce((sum, d) => sum + d.Revenus, 0),
            totalDépenses: summary.reduce((sum, d) => sum + d.Dépenses, 0),
            totalNet: summary.reduce((sum, d) => sum + d['Résultat Net'], 0),
        };

        return { summary, totals };
    }, [filteredTransactions, budgets, period]);

    const trends = useMemo(() => {
        const now = new Date();
        let prevStartDate: Date, prevEndDate: Date;

        switch (period) {
            case 'this_year':
                prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
                prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
            case 'last_3_months':
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth() - 2, 0);
                break;
            case 'this_month':
            default:
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
        }
        prevStartDate.setHours(0,0,0,0);
        prevEndDate.setHours(23,59,59,999);

        const prevPeriodTransactions = transactions
            .filter(t => !t.isArchived)
            .filter(t => {
                const date = new Date(t.date);
                return date >= prevStartDate && date <= prevEndDate;
            });

        const calculateTotals = (trans: Transaction[]) => {
            const totalRevenus = trans.filter(t => t.type === 'Revenu').reduce((sum, t) => sum + t.amount, 0);
            const totalDépenses = trans.filter(t => t.type === 'Dépense').reduce((sum, t) => sum + t.amount, 0);
            return {
                totalRevenus,
                totalDépenses,
                totalNet: totalRevenus + totalDépenses,
            };
        };
        
        const currentTotals = financialSummary.totals;
        const prevTotals = calculateTotals(prevPeriodTransactions);

        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) {
                return current !== 0 ? Infinity : 0;
            }
            return ((current - previous) / Math.abs(previous)) * 100;
        };
        
        return {
            revenue: calculateTrend(currentTotals.totalRevenus, prevTotals.totalRevenus),
            expense: calculateTrend(Math.abs(currentTotals.totalDépenses), Math.abs(prevTotals.totalDépenses)),
            net: calculateTrend(currentTotals.totalNet, prevTotals.totalNet),
        };
    }, [transactions, financialSummary.totals, period]);

    const expenseByCategory = useMemo(() => {
        const cats: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'Dépense').forEach(t => {
            const category = t.category || 'Autre';
            cats[category] = (cats[category] || 0) + Math.abs(t.amount);
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#EF4444', '#64748B'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-end">
                <select value={period} onChange={e => setPeriod(e.target.value as any)} className="input-style dark:bg-gray-700 w-full max-w-xs">
                    <option value="this_month">Ce mois-ci</option>
                    <option value="last_3_months">3 derniers mois</option>
                    <option value="this_year">Cette année</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <AnimatedStatCard 
                    title="Revenus Totaux" 
                    value={financialSummary.totals.totalRevenus} 
                    icon={BanknotesIcon} 
                    color="bg-green-500"
                    trend={trends.revenue}
                    trendIsGood="up"
                />
                 <AnimatedStatCard 
                    title="Dépenses Totales" 
                    value={Math.abs(financialSummary.totals.totalDépenses)} 
                    icon={ArrowTrendingDownIcon} 
                    color="bg-red-500"
                    trend={trends.expense}
                    trendIsGood="down"
                />
                 <AnimatedStatCard 
                    title="Résultat Net" 
                    value={financialSummary.totals.totalNet} 
                    icon={ScaleIcon} 
                    color="bg-finances-blue"
                    trend={trends.net}
                    trendIsGood="up"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-2">Rentabilité & Suivi Budgétaire par Département</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-2 font-semibold">Département</th>
                                <th className="p-2 font-semibold text-right">Revenus</th>
                                <th className="p-2 font-semibold text-right">Dépenses</th>
                                <th className="p-2 font-semibold text-right">Budget</th>
                                <th className="p-2 font-semibold text-center w-32">Progression Dépenses</th>
                                <th className="p-2 font-semibold text-right">Résultat Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialSummary.summary.map(dept => {
                                const spent = Math.abs(dept.Dépenses);
                                const budget = dept.budget;
                                const progress = budget > 0 ? (spent / budget) * 100 : 0;
                                const progressBarColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500';

                                return (
                                <tr key={dept.name} className="border-b dark:border-gray-700">
                                    <td className="p-2 font-medium">{dept.name}</td>
                                    <td className="p-2 text-right text-green-600">{dept.Revenus.toLocaleString()}</td>
                                    <td className="p-2 text-right text-red-600">{spent.toLocaleString()}</td>
                                    <td className="p-2 text-right text-gray-500">{budget > 0 ? budget.toLocaleString() : '-'}</td>
                                    <td className="p-2 align-middle">
                                        {budget > 0 && (
                                            <div title={`${progress.toFixed(0)}%`} className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 relative overflow-hidden">
                                                <div className={`${progressBarColor} h-4 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                <span className="absolute inset-0 text-center text-xs font-medium text-white mix-blend-difference leading-4">{progress.toFixed(0)}%</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className={`p-2 text-right font-bold ${dept['Résultat Net'] >= 0 ? 'text-green-700' : 'text-red-700'}`}>{dept['Résultat Net'].toLocaleString()}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold mb-2">Répartition des Dépenses</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()} GNF`} />
                        <Legend />
                    </PieChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinanceStats;