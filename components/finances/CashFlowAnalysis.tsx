import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { Transaction } from '../../types.ts';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon, BanknotesIcon, ArrowsRightLeftIcon, ScaleIcon } from '@heroicons/react/24/outline';

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center`}>
        <div className={`p-3 rounded-full ${color} mr-4`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()} GNF</p>
        </div>
    </div>
);

const CashFlowAnalysis: React.FC = () => {
    const { transactions } = useData();
    const [period, setPeriod] = useState<'this_month' | 'last_3_months' | 'this_year'>('this_month');
    const [showForecast, setShowForecast] = useState(false);

    const analysisData = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23,59,59,999);


        switch (period) {
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'this_month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        startDate.setHours(0, 0, 0, 0);

        const startingBalance = transactions
            .filter(t => !t.isArchived && new Date(t.date) < startDate)
            .reduce((sum, t) => sum + t.amount, 0);

        const periodTransactions = transactions
            .filter(t => !t.isArchived && new Date(t.date) >= startDate && new Date(t.date) <= endDate);

        const totalInflow = periodTransactions.filter(t => t.type === 'Revenu').reduce((sum, t) => sum + t.amount, 0);
        const totalOutflow = periodTransactions.filter(t => t.type === 'Dépense').reduce((sum, t) => sum + t.amount, 0);

        const netCashFlow = totalInflow + totalOutflow;
        const endingBalance = startingBalance + netCashFlow;

        const monthlyData: Record<string, { inflow: number, outflow: number }> = {};
        periodTransactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
            if (!monthlyData[month]) {
                monthlyData[month] = { inflow: 0, outflow: 0 };
            }
            if (t.type === 'Revenu') {
                monthlyData[month].inflow += t.amount;
            } else {
                monthlyData[month].outflow += t.amount;
            }
        });
        
        let runningBalance = startingBalance;
        const chartData = Object.entries(monthlyData).map(([name, values]) => {
            runningBalance += values.inflow + values.outflow;
            return {
                name,
                'Entrées': values.inflow,
                'Sorties': Math.abs(values.outflow),
                'Solde Courant': runningBalance,
                'Solde Prévisionnel': null
            };
        });
        
        if (showForecast) {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const historicalTransactions = transactions.filter(t => !t.isArchived && new Date(t.date) >= sixMonthsAgo && new Date(t.date) < new Date(now.getFullYear(), now.getMonth(), 1));

            const monthlyNetFlows: Record<string, number> = {};
            historicalTransactions.forEach(t => {
                const monthKey = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth()}`;
                if (!monthlyNetFlows[monthKey]) monthlyNetFlows[monthKey] = 0;
                monthlyNetFlows[monthKey] += t.amount;
            });

            const netFlowValues = Object.values(monthlyNetFlows);
            const averageNetFlow = netFlowValues.length > 0 ? netFlowValues.reduce((a, b) => a + b, 0) / netFlowValues.length : 0;

            let lastBalance = chartData.length > 0 ? chartData[chartData.length - 1]['Solde Courant'] : startingBalance;
            const lastDate = new Date(now.getFullYear(), now.getMonth(), 1);
            
            if (chartData.length > 0) {
                 chartData[chartData.length - 1]['Solde Prévisionnel'] = chartData[chartData.length - 1]['Solde Courant'];
            }

            for (let i = 1; i <= 3; i++) {
                const futureDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
                const futureMonthName = futureDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
                
                lastBalance += averageNetFlow;
                
                chartData.push({
                    name: futureMonthName,
                    'Entrées': null,
                    'Sorties': null,
                    'Solde Courant': null,
                    'Solde Prévisionnel': lastBalance,
                });
            }
        }

        return {
            startingBalance,
            totalInflow,
            totalOutflow,
            netCashFlow,
            endingBalance,
            chartData,
        };
    }, [transactions, period, showForecast]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-xl font-semibold">Analyse du Flux de Trésorerie</h3>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="showForecast" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} className="h-4 w-4 rounded text-finances-blue focus:ring-finances-blue" />
                        <label htmlFor="showForecast" className="text-sm font-medium">Afficher la prévision (3 mois)</label>
                    </div>
                    <select value={period} onChange={e => setPeriod(e.target.value as any)} className="input-style dark:bg-gray-700 w-full max-w-xs">
                        <option value="this_month">Ce mois-ci</option>
                        <option value="last_3_months">3 derniers mois</option>
                        <option value="this_year">Cette année</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Solde de Départ" value={analysisData.startingBalance} icon={BanknotesIcon} color="bg-gray-500" />
                <StatCard title="Total des Entrées" value={analysisData.totalInflow} icon={ArrowUpIcon} color="bg-green-500" />
                <StatCard title="Total des Sorties" value={Math.abs(analysisData.totalOutflow)} icon={ArrowDownIcon} color="bg-red-500" />
                <StatCard title="Flux de Trésorerie Net" value={analysisData.netCashFlow} icon={ArrowsRightLeftIcon} color={analysisData.netCashFlow >= 0 ? "bg-blue-500" : "bg-orange-500"} />
                <StatCard title="Solde Final" value={analysisData.endingBalance} icon={ScaleIcon} color="bg-indigo-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-4">Evolution de la Trésorerie</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={analysisData.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#4ade80" tickFormatter={(v) => `${v/1000000}M`} label={{ value: 'Flux Entrants/Sortants (GNF)', angle: -90, position: 'insideLeft', offset: -15 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tickFormatter={(v) => `${v/1000000}M`} label={{ value: 'Solde de Trésorerie (GNF)', angle: 90, position: 'insideRight', offset: -15 }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Entrées" fill="#4ade80" barSize={30} />
                        <Bar yAxisId="left" dataKey="Sorties" fill="#f87171" barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="Solde Courant" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Solde Prévisionnel" name="Solde Prévisionnel" stroke="#ff7300" strokeDasharray="5 5" strokeWidth={3} connectNulls />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashFlowAnalysis;