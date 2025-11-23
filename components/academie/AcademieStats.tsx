import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
// FIX: Add .ts extension to import path
import { Student, Formation, Paiement } from '../../types.ts';

type Period = 'this_month' | 'last_3_months' | 'this_year';
type Filiere = 'Toutes' | 'Musique' | 'Design' | 'Textile';

const AcademieStats: React.FC<{
    students: Student[];
    formations: Formation[];
    paiements: Paiement[];
}> = ({ students, formations, paiements }) => {
    
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
    const [filiere, setFiliere] = useState<Filiere>('Toutes');

    const filteredData = useMemo(() => {
        const now = new Date();
        const filteredStudents = students.filter(s => {
            const formation = formations.find(f => f.id === s.formationId);
            const filiereMatch = filiere === 'Toutes' || (formation && formation.filiere === filiere);
            if (!filiereMatch) return false;

            const date = new Date(s.registrationDate);
            if (period === 'this_year') return date.getFullYear() === now.getFullYear();
            if (period === 'this_month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            if (period === 'last_3_months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                return date >= threeMonthsAgo;
            }
            return true;
        });

        const filteredPaiements = paiements.filter(p => {
             const student = students.find(s => s.id === p.studentId);
             const formation = student ? formations.find(f => f.id === student.formationId) : undefined;
             const filiereMatch = filiere === 'Toutes' || (formation && formation.filiere === filiere);
             if (!filiereMatch) return false;

             const date = new Date(p.date);
             if (period === 'this_year') return date.getFullYear() === now.getFullYear();
             if (period === 'this_month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
             if (period === 'last_3_months') {
                 const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                 return date >= threeMonthsAgo;
             }
             return true;
        });

        return { filteredStudents, filteredPaiements };
    }, [students, paiements, formations, period, filiere]);


    const revenueByMonth = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredData.filteredPaiements.forEach(p => {
            const month = new Date(p.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
            data[month] = (data[month] || 0) + p.amount;
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus })).reverse();
    }, [filteredData.filteredPaiements]);
    
    const studentsByFiliere = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredData.filteredStudents.forEach(s => {
            const formation = formations.find(f => f.id === s.formationId);
            if (formation) {
                data[formation.filiere] = (data[formation.filiere] || 0) + 1;
            }
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredData.filteredStudents, formations]);

    const topFormationsByRevenue = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredData.filteredPaiements.forEach(p => {
            const student = students.find(s => s.id === p.studentId);
            const formation = student ? formations.find(f => f.id === student.formationId) : undefined;
            if (formation) {
                data[formation.name] = (data[formation.name] || 0) + p.amount;
            }
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus })).sort((a,b) => b.Revenus - a.Revenus).slice(0, 5);
    }, [filteredData.filteredPaiements, students, formations]);
    
    const COLORS = ['#3B82F6', '#FBBF24', '#10B981', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-wrap gap-4 justify-end items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="input-style dark:bg-gray-700">
                    <option value="this_month">Ce Mois</option>
                    <option value="last_3_months">3 Derniers Mois</option>
                    <option value="this_year">Cette Année</option>
                </select>
                <select value={filiere} onChange={e => setFiliere(e.target.value as Filiere)} className="input-style dark:bg-gray-700">
                    <option value="Toutes">Toutes les filières</option>
                    <option>Musique</option>
                    <option>Design</option>
                    <option>Textile</option>
                </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Revenus Mensuels</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                            <Bar dataKey="Revenus" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Répartition des Apprenants par Filière</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={studentsByFiliere} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                               {studentsByFiliere.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={tooltipStyle} />
                           <Legend wrapperStyle={{ color: tickColor }} />
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold mb-4">Top 5 Formations par Revenus</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topFormationsByRevenue} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor}/>
                        <XAxis type="number" tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }} />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fill: tickColor }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                        <Bar dataKey="Revenus" fill="#3B82F6" />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AcademieStats;