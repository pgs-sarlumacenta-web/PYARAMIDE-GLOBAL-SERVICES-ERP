import React from 'react';
// FIX: Add .ts extension to import path
import { Student, Formation, CompanyProfile } from '../../types.ts';

interface AttestationProps {
    student: Student;
    formation: Formation;
    companyProfile: CompanyProfile;
    directorName: string;
}

const Attestation: React.FC<AttestationProps> = ({ student, formation, companyProfile, directorName }) => {
    if (!student || !formation) return null;

    return (
        <div className="bg-white text-black font-serif w-full max-w-5xl aspect-[29.7/21] mx-auto p-12 border-8 border-pgs-blue flex flex-col justify-between">
             <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
             `}</style>
            <div className="text-center">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mx-auto mb-2" />
                <h1 className="text-5xl font-bold text-pgs-red mb-1">{companyProfile.nom}</h1>
                <h2 className="text-3xl font-semibold text-pgs-blue">PS-ACADÉMIE</h2>
            </div>

            <div className="text-center my-6">
                <p className="text-3xl uppercase tracking-widest font-light">Attestation de Fin de Formation</p>
            </div>

            <div className="text-xl text-center leading-relaxed">
                <p className="mb-4">
                    Nous, soussignés, certifions par la présente que
                </p>
                <p className="text-center text-3xl font-bold my-4">{student.name}</p>
                <p>
                    a suivi avec succès la formation en <span className="font-semibold">"{formation.name}"</span>
                    dispensée par notre académie.
                </p>
            </div>

            <footer className="mt-auto pt-24 text-right">
                <div className="inline-block text-center">
                    <p className="text-lg font-semibold">La Direction</p>
                    <div className="h-20" /> {/* Spacer for signature */}
                    <p className="border-t-2 border-black pt-2 w-72">{directorName}</p>
                    <p className="font-bold">Directeur Général</p>
                </div>
            </footer>
        </div>
    );
};

export default Attestation;