import React, { useMemo } from 'react';
import { Transaction, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface FinancesReportProps {
  transactions: Transaction[];
  period: string;
  companyProfile: CompanyProfile;
}

const FinancesReport: React.FC<FinancesReportProps> = ({ transactions, period, companyProfile }) => {
  const totalRevenue = transactions.filter(t => t.type === 'Revenu').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'Dépense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalRevenue + totalExpenses;
  
  const expensesByCategory = useMemo(() => {
      const cats: Record<string, number> = {};
      transactions.filter(t => t.type === 'Dépense').forEach(t => {
          if (t.category) cats[t.category] = (cats[t.category] || 0) + t.amount;
      });
      return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions]);
  
  const revenueByDept = useMemo(() => {
      const depts: Record<string, number> = {};
      transactions.filter(t => t.type === 'Revenu').forEach(t => {
          depts[t.department] = (depts[t.department] || 0) + t.amount;
      });
      return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  return (
    <ReportLayout title="Rapport Financier" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-100 rounded-lg">
            <h3 className="text-sm font-semibold text-green-700">Total Revenus</h3>
            <p className="text-2xl font-bold text-green-800">{totalRevenue.toLocaleString()} GNF</p>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <h3 className="text-sm font-semibold text-red-700">Total Dépenses</h3>
            <p className="text-2xl font-bold text-red-800">{Math.abs(totalExpenses).toLocaleString()} GNF</p>
          </div>
          <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <h3 className={`text-sm font-semibold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Balance</h3>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{balance.toLocaleString()} GNF</p>
          </div>
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                 <h3 className="text-lg font-bold mb-2 border-b pb-1">Revenus par Département</h3>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-gray-200"><tr><th className="p-2">Département</th><th className="p-2 text-right">Montant</th></tr></thead>
                     <tbody>
                        {revenueByDept.map(item => (
                            <tr key={item.name} className="border-b">
                                <td className="p-2">{item.name}</td><td className="p-2 text-right">{item.value.toLocaleString()} GNF</td>
                            </tr>
                        ))}
                     </tbody>
                 </table>
            </div>
             <div>
                 <h3 className="text-lg font-bold mb-2 border-b pb-1">Dépenses par Catégorie</h3>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-gray-200"><tr><th className="p-2">Catégorie</th><th className="p-2 text-right">Montant</th></tr></thead>
                     <tbody>
                        {expensesByCategory.map(item => (
                            <tr key={item.name} className="border-b">
                                <td className="p-2">{item.name}</td><td className="p-2 text-right">{Math.abs(item.value).toLocaleString()} GNF</td>
                            </tr>
                        ))}
                     </tbody>
                 </table>
            </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Transactions</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Département</th><th className="p-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-2">{t.description}</td>
                    <td className="p-2">{t.department}</td>
                    <td className={`p-2 text-right font-semibold ${t.type === 'Revenu' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toLocaleString()} GNF</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default FinancesReport;
