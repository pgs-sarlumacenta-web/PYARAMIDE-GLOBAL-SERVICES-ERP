import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Client, StudioProject, DecorOrder, ShopOrder } from '../../types.ts';
import { UsersIcon, BanknotesIcon, UserPlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ClientsDashboardProps {
    clients: Client[];
    studioProjects: StudioProject[];
    decorOrders: DecorOrder[];
    shopOrders: ShopOrder[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 rounded-full bg-clients-teal/10 text-clients-teal mr-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const ClientsDashboard: React.FC<ClientsDashboardProps> = ({ clients, studioProjects, decorOrders, shopOrders }) => {
    
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#fff' : '#000',
    };

    const activeClients = useMemo(() => clients.filter(c => !c.isArchived), [clients]);

    // KPIs
    const totalClients = activeClients.length;
    
    const newClientsThisMonth = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return activeClients.filter(c => {
             const idParts = c.id.split('_');
             if (idParts.length < 3 || idParts[1] !== 'NEW') return false;
             return parseInt(idParts[2]) >= firstDayOfMonth;
        }).length;
    }, [activeClients]);

    const clientRevenueMap = useMemo(() => {
        const revenueMap = new Map<string, number>();
        
        [...studioProjects, ...decorOrders, ...shopOrders].forEach(order => {
            if (order.clientId && order.amountPaid > 0) {
                revenueMap.set(order.clientId, (revenueMap.get(order.clientId) || 0) + order.amountPaid);
            }
        });

        return revenueMap;
    }, [studioProjects, decorOrders, shopOrders]);

    const totalRevenue = useMemo(() => {
        let total = 0;
        for (const revenue of clientRevenueMap.values()) {
            total += revenue;
        }
        return total;
    }, [clientRevenueMap]);
    
    const averageRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;

    // Chart Data
    const newClientsOverTime = useMemo(() => {
        const data: { [key: string]: number } = {};
         activeClients.forEach(c => {
            const idParts = c.id.split('_');
            if (idParts.length < 3 || idParts[1] !== 'NEW') return;
            
            const date = new Date(parseInt(idParts[2]));
            const month = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
            data[month] = (data[month] || 0) + 1;
        });
        return Object.entries(data).map(([name, Nouveaux]) => ({ name, Nouveaux }));
    }, [activeClients]);

    const topClientsByRevenue = useMemo(() => {
        return Array.from(clientRevenueMap.entries())
            .map(([clientId, revenue]) => {
                const client = clients.find(c => c.id === clientId);
                return { name: client?.name || 'Inconnu', Revenus: revenue };
            })
            .sort((a, b) => b.Revenus - a.Revenus)
            .slice(0, 5);
    }, [clientRevenueMap, clients]);

    const clientDistributionByModule = useMemo(() => {
        const studioClientIds = new Set(studioProjects.map(p => p.clientId));
        const decorClientIds = new Set(decorOrders.map(o => o.clientId));
        const shopClientIds = new Set(shopOrders.filter(o => o.clientId).map(o => o.clientId!));

        return [
            { name: 'PS-STUDIO', value: studioClientIds.size },
            { name: 'PS-DÉCOR', value: decorClientIds.size },
            { name: 'PS-SHOP', value: shopClientIds.size },
        ].filter(d => d.value > 0);
    }, [studioProjects, decorOrders, shopOrders]);


    const recentClients = useMemo(() => {
        return [...activeClients]
            .sort((a, b) => {
                 const timeA = a.id.startsWith('C_NEW_') ? parseInt(a.id.split('_')[2]) : 0;
                 const timeB = b.id.startsWith('C_NEW_') ? parseInt(b.id.split('_')[2]) : 0;
                 return timeB - timeA;
            })
            .slice(0, 5);
    }, [activeClients]);
    

    const COLORS = ['#E53E3E', '#FBBF24', '#10B981', '#3B82F6'];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Clients Actifs" value={String(totalClients)} icon={UsersIcon} />
                <StatCard title="Nouveaux Clients (ce mois)" value={String(newClientsThisMonth)} icon={UserPlusIcon} />
                <StatCard title="Revenu Total Client" value={`${totalRevenue.toLocaleString()} GNF`} icon={BanknotesIcon} />
                <StatCard title="Revenu Moyen / Client" value={`${Math.round(averageRevenuePerClient).toLocaleString()} GNF`} icon={ChartBarIcon} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Top 5 Clients par Dépenses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topClientsByRevenue} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor}/>
                            <XAxis type="number" tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Revenus" fill="#14B8A6" name="Revenus" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Répartition des Clients par Module</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={clientDistributionByModule} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                               {clientDistributionByModule.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle}/>
                           <Legend wrapperStyle={{ color: tickColor }}/>
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Acquisition de Nouveaux Clients</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={newClientsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis allowDecimals={false} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="Nouveaux" fill="#14B8A6" name="Nouveaux Clients" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Clients Récemment Ajoutés</h3>
                    <ul className="space-y-4 max-h-72 overflow-y-auto">
                        {recentClients.map(client => (
                            <li key={client.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">{client.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.company || 'Particulier'}</p>
                                </div>
                                <span className="text-sm text-gray-400">{client.id.startsWith('C_NEW_') ? new Date(parseInt(client.id.split('_')[2])).toLocaleDateString() : ''}</span>
                            </li>
                         ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ClientsDashboard;