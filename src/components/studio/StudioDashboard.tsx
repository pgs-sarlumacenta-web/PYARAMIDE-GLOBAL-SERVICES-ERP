


import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { StudioProject, StudioService, Client } from '../../types.ts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { BanknotesIcon, BriefcaseIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface StudioDashboardProps {
    projects: StudioProject[];
    services: StudioService[];
    clients: Client[];
}

type Period = 'this_month' | 'last_3_months' | 'this_year';
type ProjectTypeFilter = 'Tous' | 'Single' | 'EP' | 'Album';


const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg flex items-center transform hover:scale-105 transition-transform duration-300">
        <div className="p-4 rounded-full bg-studio-red/10 text-studio-red mr-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);


const StudioDashboard: React.FC<StudioDashboardProps> = ({ projects, services, clients }) => {
    
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
    const [projectType, setProjectType] = useState<ProjectTypeFilter>('Tous');

    const activeProjects = useMemo(() => projects.filter(p => !p.isArchived), [projects]);
    
    const filteredProjects = useMemo(() => {
        const now = new Date();
        return activeProjects.filter(p => {
             const typeMatch = projectType === 'Tous' || p.projectType === projectType;
             if(!typeMatch) return false;

             const date = new Date(p.startDate);
             if (period === 'this_year') return date.getFullYear() === now.getFullYear();
             if (period === 'this_month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
             if (period === 'last_3_months') {
                 const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                 return date >= threeMonthsAgo;
             }
             return true;
        });
    }, [activeProjects, period, projectType]);


    // KPIs
    const totalRevenue = useMemo(() => activeProjects.reduce((sum, p) => sum + p.amountPaid, 0), [activeProjects]);
    const projectsInProgress = useMemo(() => activeProjects.filter(p => ['En cours', 'Mixage'].includes(p.status)).length, [activeProjects]);
    const totalProjectValue = useMemo(() => {
        return activeProjects.reduce((totalSum, project) => {
            const projectCost = project.serviceIds.reduce((serviceSum, serviceId) => {
                const service = services.find(s => s.id === serviceId);
                return serviceSum + (service?.tarif || 0);
            }, 0);
            // Subtract discount
            return totalSum + projectCost - (project.discount || 0);
        }, 0);
    }, [activeProjects, services]);
    const remainingBalance = totalProjectValue - totalRevenue;

    // Chart Data
    const revenueByMonth = useMemo(() => {
        const data: { [key: string]: number } = {};
        activeProjects.forEach(p => {
            if (p.amountPaid > 0) {
                const month = new Date(p.startDate).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
                data[month] = (data[month] || 0) + p.amountPaid;
            }
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus }));
    }, [activeProjects]);

    const projectStatusDistribution = useMemo(() => {
        const data: { [key: string]: number } = {};
        activeProjects.forEach(p => {
            data[p.status] = (data[p.status] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [activeProjects]);

    const recentProjects = useMemo(() => {
        return [...activeProjects]
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 5);
    }, [activeProjects]);

    const revenueByServiceType = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredProjects.forEach(p => {
            p.serviceIds.forEach(serviceId => {
                const service = services.find(s => s.id === serviceId);
                if (service) {
                    data[service.type] = (data[service.type] || 0) + service.tarif;
                }
            });
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus }));
    }, [filteredProjects, services]);


    const COLORS = ['#A8A29E', '#3B82F6', '#F59E0B', '#6D28D9', '#10B981'];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Chiffre d'Affaires Total" value={`${totalRevenue.toLocaleString()} GNF`} icon={BanknotesIcon} />
                <StatCard title="Projets Actifs" value={String(activeProjects.length)} icon={BriefcaseIcon} />
                <StatCard title="Projets en Cours" value={String(projectsInProgress)} icon={ClockIcon} />
                <StatCard title="Solde à Recouvrer" value={`${Math.max(0, remainingBalance).toLocaleString()} GNF`} icon={ChartBarIcon} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Revenus Mensuels (Vue Globale)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Revenus" fill="#E53E3E" name="Revenus" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Répartition des Projets (Vue Globale)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={projectStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                               {projectStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle}/>
                           <Legend wrapperStyle={{ color: tickColor }}/>
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Projets Récents</h3>
                <ul className="space-y-4">
                    {recentProjects.map(project => {
                         const client = clients.find(c => c.id === project.clientId);
                         return (
                            <li key={project.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">{project.projectName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{client?.name || 'Client inconnu'} - {new Date(project.startDate).toLocaleDateString()}</p>
                                </div>
                                <span className="text-sm font-semibold px-2 py-1 rounded-full bg-studio-red/10 text-studio-red">{project.status}</span>
                            </li>
                         )
                    })}
                </ul>
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
                    <select value={projectType} onChange={e => setProjectType(e.target.value as ProjectTypeFilter)} className="input-style dark:bg-gray-700">
                        <option value="Tous">Tous les types</option>
                        <option>Single</option>
                        <option>EP</option>
                        <option>Album</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-semibold mb-4 text-xl">Revenus par Type de Service (filtré)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByServiceType}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Revenus" fill="#E53E3E" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StudioDashboard;
