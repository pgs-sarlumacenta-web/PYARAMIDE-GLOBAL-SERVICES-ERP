import React from 'react';
import { CompanyProfile } from '../types.ts';

interface ReportLayoutProps {
  title: string;
  period: string;
  companyProfile: CompanyProfile;
  children: React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ title, period, companyProfile, children }) => {
  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg print:shadow-none print:border-none">
      <header className="flex justify-between items-start pb-6 border-b border-gray-300">
        <div className="flex items-center">
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
            <p className="text-gray-500">{companyProfile.adresse}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase">Rapport d'Activité</h2>
          <p className="text-gray-500">{title}</p>
          <p className="text-sm text-gray-500">Période : {period}</p>
        </div>
      </header>
      <main className="my-8">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
        <p>Rapport généré le {new Date().toLocaleDateString('fr-FR')} par le système de gestion PGS-SARLU.</p>
      </footer>
    </div>
  );
};

export default ReportLayout;
