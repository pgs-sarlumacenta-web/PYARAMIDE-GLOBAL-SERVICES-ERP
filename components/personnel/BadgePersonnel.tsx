import React from 'react';
// FIX: Add .ts extension to import path
import { Employee, CompanyProfile } from '../../types.ts';

interface BadgePersonnelProps {
    employee: Employee;
    companyProfile: CompanyProfile;
}

const BadgePersonnel: React.FC<BadgePersonnelProps> = ({ employee, companyProfile }) => {
  if (!employee) return null;

  const qrData = `https://pgs-sarlu-management.app/verify/employee/${employee.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  return (
    <div id="personnel-badge-content" className="bg-gray-50 text-black font-sans w-[306px] h-[485px] rounded-2xl shadow-lg p-4 flex flex-col items-center border-2 border-pgs-red mx-auto">
        <img src={companyProfile.logoUrl} alt="Logo" className="h-12 mb-1" crossOrigin="anonymous" />
        <h1 className="text-xl font-bold text-pgs-red">{companyProfile.nom}</h1>
        <p className="text-xs font-semibold text-gray-500 mb-3">CARTE D'IDENTIFICATION EMPLOYÉ</p>
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pgs-red mb-3">
            <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        </div>
        
        <h3 className="text-xl font-bold tracking-wider text-center">{employee.name.toUpperCase()}</h3>
        <p className="text-gray-500 text-sm mb-4">Matricule: {employee.id}</p>
        
        <div className="bg-pgs-red text-white text-center w-full py-1.5 rounded-lg mb-4">
            <p className="font-bold text-base">{employee.role}</p>
        </div>

        <div className="text-center text-sm text-gray-600 mb-4">
            <p><span className="font-semibold">Département:</span> {employee.department}</p>
            <p><span className="font-semibold">Date d'embauche:</span> {new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
        </div>

        <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-16 h-16 mt-auto"
            crossOrigin="anonymous"
        />

        <p className="text-[9px] text-gray-400 mt-2">Cette carte est la propriété de {companyProfile.nom}.</p>
    </div>
  );
};

export default BadgePersonnel;