
import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import ReportModal from '../ReportModal.tsx';
import CompteDeResultatReport from './CompteDeResultatReport.tsx';
import FinancesReport from './FinancesReport.tsx';
import HiddenDownloader from '../HiddenDownloader.tsx';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const RapportsFinanciers: React.FC = () => {
    const { transactions, companyProfile } = useData();
    const [reportType, setReportType] = useState<'general' | 'resultat' | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    const openReportModal = (type: 'general' | 'resultat') => {
        setReportType(type);
        setIsReportModalOpen(true);
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const periodTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= start && date <= end;
        });
        
        const periodStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        let content = null;
        let title = '';

        if (reportType === 'general') {
            title = `Rapport Financier Global - ${periodStr}`;
            content = <FinancesReport transactions={periodTransactions} period={periodStr} companyProfile={companyProfile} />;
        } else if (reportType === 'resultat') {
             const revenueByDept = periodTransactions.filter(t => t.type === 'Revenu').reduce<Record<string, number>>((acc, t) => {
                acc[t.department] = (acc[t.department] || 0) + t.amount;
                return acc;
            }, {});
            
            const expenseByCategory = periodTransactions.filter(t => t.type === 'Dépense').reduce<Record<string, number>>((acc, t) => {
                const category = t.category || 'Autre';
                acc[category] = (acc[category] || 0) + t.amount;
                return acc;
            }, {});

            const totalRevenue = Object.values(revenueByDept).reduce<number>((sum, amount) => sum + (amount as number), 0);
            const totalExpense = Object.values(expenseByCategory).reduce<number>((sum, amount) => sum + (amount as number), 0);
            const netResult = totalRevenue + totalExpense;
            
            const reportData = { revenueByDept, expenseByCategory, totalRevenue, totalExpense, netResult, transactions: periodTransactions };
            
            title = `Compte de Résultat - ${periodStr}`;
            content = <CompteDeResultatReport data={reportData} period={periodStr} companyProfile={companyProfile} />;
        }

        if (content) {
            setDocumentToDownload({ content, format: 'pdf', title });
        }
        setIsReportModalOpen(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Rapport Financier Global</h3>
                    <p className="text-sm text-gray-500">Aperçu des revenus, dépenses et balance.</p>
                </div>
                <button onClick={() => openReportModal('general')} className="btn-secondary flex items-center">
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> Générer
                </button>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Compte de Résultat</h3>
                    <p className="text-sm text-gray-500">Analyse détaillée par département et catégorie.</p>
                </div>
                <button onClick={() => openReportModal('resultat')} className="btn-secondary flex items-center">
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" /> Générer
                </button>
            </div>
            
            <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                onGenerate={handleGenerateReport} 
                title={reportType === 'general' ? 'Générer Rapport Financier' : 'Générer Compte de Résultat'}
            />
            
            {documentToDownload && (
                <HiddenDownloader 
                    content={documentToDownload.content} 
                    format={documentToDownload.format} 
                    title={documentToDownload.title} 
                    onComplete={() => setDocumentToDownload(null)} 
                />
            )}
        </div>
    );
};

export default RapportsFinanciers;
