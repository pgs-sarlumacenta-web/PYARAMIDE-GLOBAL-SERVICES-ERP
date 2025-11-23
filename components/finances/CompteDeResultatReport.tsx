import React from 'react';
import { CompanyProfile, Transaction } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface CompteDeResultatReportProps {
    data: {
        revenueByDept: Record<string, number>;
        expenseByCategory: Record<string, number>;
        totalRevenue: number;
        totalExpense: number;
        netResult: number;
        transactions: Transaction[];
    };
    period: string;
    companyProfile: CompanyProfile;
}

const CompteDeResultatReport: React.FC<CompteDeResultatReportProps> = ({ data, period, companyProfile }) => {
    return (
        <ReportLayout title="Compte de Résultat" period={period} companyProfile={companyProfile}>
            <div className="space-y-6">
                <section className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-green-700">Total Revenus</h3>
                        <p className="text-2xl font-bold text-green-800">{data.totalRevenue.toLocaleString()} GNF</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-red-700">Total Dépenses</h3>
                        <p className="text-2xl font-bold text-red-800">{Math.abs(data.totalExpense).toLocaleString()} GNF</p>
                    </div>
                    <div className={`p-4 rounded-lg ${data.netResult >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        <h3 className={`text-sm font-semibold ${data.netResult >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Résultat Net</h3>
                        <p className={`text-2xl font-bold ${data.netResult >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{data.netResult.toLocaleString()} GNF</p>
                    </div>
                </section>
                
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Revenus</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200"><tr><th className="p-2">Département</th><th className="p-2 text-right">Montant</th></tr></thead>
                            <tbody>
                                {Object.entries(data.revenueByDept).map(([dept, amount]) => (
                                    <tr key={dept} className="border-b"><td className="p-2">{dept}</td><td className="p-2 text-right">{amount.toLocaleString()} GNF</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Dépenses</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200"><tr><th className="p-2">Catégorie</th><th className="p-2 text-right">Montant</th></tr></thead>
                            <tbody>
                                {Object.entries(data.expenseByCategory).map(([cat, amount]) => (
                                    // FIX: Cast amount to number before using with Math.abs() to resolve 'unknown' type error.
                                    <tr key={cat} className="border-b"><td className="p-2">{cat}</td><td className="p-2 text-right">{Math.abs(amount as number).toLocaleString()} GNF</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </ReportLayout>
    );
};

export default CompteDeResultatReport;