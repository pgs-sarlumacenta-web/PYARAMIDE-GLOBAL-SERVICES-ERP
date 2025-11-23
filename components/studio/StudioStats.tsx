import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// FIX: Add .ts extension to import path
import { StudioProject, StudioService } from '../../types.ts';

interface StudioStatsProps {
    projects: StudioProject[];
    services: StudioService[];
}

type Period = 'this_month' | 'last_3_months' | 'this_year';
type ProjectType = 'Tous' | 'Single' | 'EP' | 'Album';


const StudioStats: React.FC<StudioStatsProps> = ({ projects, services }) => {
    
    const [period, setPeriod] = useState<Period>('this_month');
    const [projectType, setProjectType] = useState<ProjectType>('Tous');

    const filteredProjects = useMemo(() => {
        const now = new Date();
        return projects.filter(p => {
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
    }, [projects, period, projectType]);


    const revenueByMonth = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredProjects.forEach(p => {
            const month = new Date(p.startDate).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
            data[month] = (data[month] || 0) + p.amountPaid;
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus })).reverse();
    }, [filteredProjects]);
    
    const projectStatusDistribution = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredProjects.forEach(p => {
            data[p.status] = (data[p.status] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredProjects]);

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
    
    const COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-wrap gap-4 justify-end items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="input-style dark:bg-gray-700">
                    <option value="this_month">Ce Mois</option>
                    <option value="last_3_months">3 Derniers Mois</option>
                    <option value="this_year">Cette Année</option>
                </select>
                <select value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className="input-style dark:bg-gray-700">
                    <option value="Tous">Tous les types</option>
                    <option>Single</option>
                    <option>EP</option>
                    <option>Album</option>
                </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Revenus Mensuels</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                            <Bar dataKey="Revenus" fill="#E53E3E" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Répartition des Projets par Statut</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={projectStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                               {projectStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip />
                           <Legend />
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold mb-4">Revenus par Type de Service</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByServiceType}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                        <Bar dataKey="Revenus" fill="#E53E3E" />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StudioStats;