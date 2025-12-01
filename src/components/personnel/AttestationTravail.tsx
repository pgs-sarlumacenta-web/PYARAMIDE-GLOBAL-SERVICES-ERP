import React from 'react';
// FIX: Add .ts extension to import path
import { Employee, CompanyProfile } from '../../types.ts';

interface AttestationTravailProps {
    employee: Employee;
    companyProfile: CompanyProfile;
    directorName: string;
}

const AttestationTravail: React.FC<AttestationTravailProps> = ({ employee, companyProfile, directorName }) => {
    if (!employee) return null;

    return (
        <div className="bg-white text-black font-serif w-full max-w-4xl aspect-[21/29.7] mx-auto p-12 border-2 border-gray-400 flex flex-col">
             <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
             `}</style>
            <header className="text-center mb-16">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <p className="text-gray-600">{companyProfile.adresse}</p>
                <p className="text-gray-600">Tél: {companyProfile.telephone} | Email: {companyProfile.email}</p>
            </header>

            <div className="text-right mb-12">
                <p>Fait à Bamako, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="text-center my-8">
                <h2 className="text-3xl uppercase tracking-widest font-bold underline">Attestation de Travail</h2>
            </div>

            <div className="text-lg text-justify leading-relaxed flex-grow">
                <p className="mb-6">
                    Nous, soussignés, société {companyProfile.nom}, certifions par la présente que :
                </p>
                <p className="text-center font-bold text-2xl my-6">
                    {employee.name}
                </p>
                <p className="mb-4">
                    Matricule <span className="font-semibold">{employee.id}</span>, est employé(e) au sein de notre entreprise depuis le <span className="font-semibold">{new Date(employee.hireDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
                </p>
                <p>
                    À ce jour, il/elle occupe le poste de <span className="font-semibold">{employee.role}</span> au sein du département <span className="font-semibold">{employee.department}</span>.
                </p>
                <p className="mt-8">
                    Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
                </p>
            </div>

            <footer className="mt-auto pt-24 text-right">
                <div className="inline-block text-center">
                    <p className="text-lg font-semibold">La Direction</p>
                    <div className="h-16"></div>
                    <p className="border-t-2 border-black pt-2 w-64">{directorName}</p>
                    <p className="font-bold">Directeur Général</p>
                </div>
            </footer>
        </div>
    );
};

export default AttestationTravail;