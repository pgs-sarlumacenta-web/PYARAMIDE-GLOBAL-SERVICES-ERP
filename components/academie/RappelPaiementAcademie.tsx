import React from 'react';
import { Student, Formation, CompanyProfile } from '../../types.ts';

interface RappelPaiementAcademieProps {
  student: Student;
  formation: Formation;
  companyProfile: CompanyProfile;
  balance: number;
}

const RappelPaiementAcademie: React.FC<RappelPaiementAcademieProps> = ({ student, formation, companyProfile, balance }) => {
  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border shadow-lg">
      <header className="flex justify-between items-start pb-6 border-b">
        <div>
          <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mb-2" />
          <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
          <p className="text-gray-500">{companyProfile.adresse}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase">Rappel de Paiement Scolarité</h2>
          <p className="text-gray-500">Date: {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </header>
      <section className="my-8">
        <h3 className="font-semibold mb-2">À l'attention de :</h3>
        <p className="font-bold text-lg">{student.name}</p>
        <p className="text-gray-600">{student.address}</p>
        <p className="text-gray-600">{student.email}</p>
      </section>

      <section className="my-8 text-base leading-relaxed">
        <p className="font-semibold">Objet: Solde de scolarité impayé de {balance.toLocaleString()} GNF</p>
        <p className="mt-4">Cher/Chère {student.name},</p>
        <p className="mt-2">Sauf erreur de notre part, nous constatons un solde restant à payer sur vos frais de scolarité pour la formation <strong className="text-academie-blue">"{formation.name}"</strong>.</p>
        <p className="mt-2">Le montant dû est de <strong className="text-red-600">{balance.toLocaleString()} GNF</strong>.</p>
        <p className="mt-4">Nous vous serions reconnaissants de bien vouloir régulariser votre situation dans les plus brefs délais.</p>
        <p>Si vous avez déjà effectué ce paiement, nous vous prions de ne pas tenir compte de ce rappel.</p>
        <p className="mt-6">Cordialement,</p>
        <p className="font-semibold">La Direction de PS-ACADÉMIE</p>
      </section>

      <footer className="text-center text-xs text-gray-400 mt-12 pt-6 border-t">
        <p>{companyProfile.nom} - Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </footer>
    </div>
  );
};

export default RappelPaiementAcademie;