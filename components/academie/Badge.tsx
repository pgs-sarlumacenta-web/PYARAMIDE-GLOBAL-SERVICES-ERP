import React from 'react';
// FIX: Add .ts extension to import path
import { Student, Formation, CompanyProfile } from '../../types.ts';

interface BadgeProps {
    student: Student;
    formation: Formation;
    companyProfile: CompanyProfile;
}

const Badge: React.FC<BadgeProps> = ({ student, formation, companyProfile }) => {
  if (!student || !formation) return null;

  const registrationDate = new Date(student.registrationDate);
  const expiryDate = new Date(registrationDate);
  expiryDate.setMonth(expiryDate.getMonth() + formation.duree);
  const expiryDateString = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear()}`;

  const qrData = `https://pgs-sarlu-management.app/verify/student/${student.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  // Resized to standard vertical PVC card aspect ratio (2.125in x 3.375in -> ~306px x 485px for display)
  return (
    <div id="student-badge-content" className="bg-white text-black font-sans w-[306px] h-[485px] rounded-2xl shadow-lg p-4 flex flex-col items-center border-2 border-pgs-blue mx-auto">
        <img src={companyProfile.logoUrl} alt="Logo" className="h-12 mb-1" crossOrigin="anonymous" />
        <h1 className="text-xl font-bold text-pgs-red">{companyProfile.nom}</h1>
        <h2 className="text-xs font-semibold text-pgs-blue mb-3">CARTE D'APPRENANT</h2>
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pgs-blue mb-3">
            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        </div>
        
        <h3 className="text-xl font-bold tracking-wider text-center">{student.name.toUpperCase()}</h3>
        <p className="text-gray-500 text-sm">ID: {student.id}</p>
        <p className="text-gray-500 text-xs mb-4">{student.email}</p>
        
        <div className="bg-pgs-blue text-white text-center w-full py-1.5 rounded-lg mb-4">
            <p className="font-bold text-base">{formation.name}</p>
        </div>

        <div className="text-center text-[10px] text-gray-600">
            <p><span className="font-semibold">Inscrit le:</span> {new Date(student.registrationDate).toLocaleDateString('fr-FR')}</p>
            <p><span className="font-semibold">Valide jusqu'au:</span> {expiryDateString}</p>
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

export default Badge;