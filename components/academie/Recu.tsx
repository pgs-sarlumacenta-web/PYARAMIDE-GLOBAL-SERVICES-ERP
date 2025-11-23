import React from 'react';
// FIX: Add .ts extension to import path
import { Student, Formation, Paiement, CompanyProfile } from '../../types.ts';

interface RecuProps {
    student?: Student;
    formation?: Formation;
    paiement?: Paiement;
    allPaiements?: Paiement[];
    companyProfile?: CompanyProfile;
}

const Recu: React.FC<RecuProps> = ({ student, formation, paiement, allPaiements = [], companyProfile }) => {
    if (!student || !formation || !paiement || !companyProfile) return null;

    const studentCost = student.tarif === 'professionnel' ? formation.coutPro : formation.coutEleve;
    const totalCost = studentCost + formation.fraisInscription;
    const totalPaid = allPaiements.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalCost - totalPaid;

    return (
        <div className="bg-white text-black font-sans w-full max-w-2xl mx-auto p-8 border border-gray-300 shadow-lg">
            <header className="flex justify-between items-start pb-6 border-b border-gray-300">
                <div>
                    <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                    <p className="text-gray-500">{companyProfile.adresse.split(',')[0]}</p>
                    <p className="text-gray-500">{companyProfile.adresse.split(',').slice(1).join(',').trim()}</p>
                    <p className="text-gray-500">Tél: {companyProfile.telephone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold uppercase">Reçu de Paiement</h2>
                    <p className="text-gray-500">N°: {paiement.receiptRef || paiement.id}</p>
                    <p className="text-gray-500">Date: {new Date(paiement.date).toLocaleDateString('fr-FR')}</p>
                </div>
            </header>

            <section className="my-8">
                <h3 className="font-semibold mb-2">Reçu de :</h3>
                <p className="font-bold text-lg">{student.name}</p>
                <p className="text-gray-600">ID Apprenant: {student.id}</p>
                <p className="text-gray-600">Email: {student.email}</p>
                <p className="text-gray-600">Téléphone: {student.phone}</p>
                <p className="text-gray-600">Adresse: {student.address}</p>
            </section>

            <section>
                <table className="w-full text-left">
                    <thead className="bg-gray-200 text-black uppercase text-sm">
                        <tr>
                            <th className="p-3 font-semibold tracking-wide text-left">Description</th>
                            <th className="p-3 font-semibold tracking-wide text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">
                                <p className="font-medium">Paiement pour : {paiement.objet}</p>
                                <p className="text-sm text-gray-600">Formation: "{formation.name}"</p>
                            </td>
                            <td className="p-3 text-right">{paiement.amount.toLocaleString()} GNF</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="flex justify-end mt-8">
                <div className="w-full max-w-xs text-right">
                    <div className="flex justify-between py-2">
                        <span className="font-semibold">Coût total formation:</span>
                        <span>{totalCost.toLocaleString()} GNF</span>
                    </div>
                     <div className="flex justify-between py-2">
                        <span className="font-semibold">Total Versé:</span>
                        <span>{totalPaid.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-black mt-2">
                        <span className="font-bold text-lg">Solde Restant:</span>
                        <span className="font-bold text-lg">{balance.toLocaleString()} GNF</span>
                    </div>
                </div>
            </section>
            
            <footer className="text-center mt-12 pt-6 border-t border-gray-300">
                <p className="text-gray-600 font-semibold">Merci pour votre paiement !</p>
            </footer>
        </div>
    );
};

export default Recu;