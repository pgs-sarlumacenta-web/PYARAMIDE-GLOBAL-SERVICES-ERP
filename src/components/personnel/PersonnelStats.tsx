import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Employee, Payroll } from '../../types.ts';

interface PersonnelStatsProps {
    employees: Employee[];
    payrolls: Payroll[];
}

const PersonnelStats: React.FC<PersonnelStatsProps> = ({ employees, payrolls }) => {
    
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#fff' : '#000',
    };

    const [period, setPeriod] = useState(new Date().getFullYear());
    
    const payrollByPeriod = useMemo(() => {
        const data: { [key: string]: number } = {};
        payrolls.filter(p => new Date(p.paymentDate).getFullYear() === period).forEach(p => {
            data[p.period] = (data[p.period] || 0) + p.netSalary;
        });
        return Object.entries(data).map(([name, Salaires]) => ({ name, Salaires }));
    }, [payrolls, period]);
    
    const employeesByDept = useMemo(() => {
        const data: { [key: string]: number } = {};
        employees.forEach(e => {
            data[e.department] = (data[e.department] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [employees]);

    const averageSalaryByDept = useMemo(() => {
        const salaryData: { [key: string]: { total: number; count: number } } = {};
        employees.forEach(e => {
            if (!salaryData[e.department]) {
                salaryData[e.department] = { total: 0, count: 0 };
            }
            salaryData[e.department].total += e.salary;
            salaryData[e.department].count++;
        });
        return Object.entries(salaryData).map(([name, data]) => ({ name, 'Salaire Moyen': data.total / data.count }));
    }, [employees]);
    
    const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-end items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <select value={period} onChange={e => setPeriod(+e.target.value)} className="input-style dark:bg-gray-700">
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Masse Salariale Mensuelle ({period})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={payrollByPeriod}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
                            <XAxis dataKey="name" tick={{ fill: tickColor }}/>
                            <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }}/>
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                            <Bar dataKey="Salaires" fill="#6366F1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4">Répartition des Employés par Département</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={employeesByDept} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill={tickColor}>
                                {employeesByDept.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle}/>
                            <Legend wrapperStyle={{ color: tickColor }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-semibold mb-4">Salaire Moyen par Département</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={averageSalaryByDept} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor}/>
                        <XAxis type="number" tickFormatter={(value) => `${(value as number / 1000)}k`} tick={{ fill: tickColor }}/>
                        <YAxis type="category" dataKey="name" width={80} tick={{ fill: tickColor }}/>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toLocaleString()} GNF`}/>
                        <Bar dataKey="Salaire Moyen" fill="#6366F1" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PersonnelStats;