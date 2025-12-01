import React from 'react';
// FIX: Add .ts extension to import path
import { Employee, Payroll, CompanyProfile } from '../../types.ts';

interface FicheDePaieProps {
    employee: Employee;
    payroll: Payroll;
    companyProfile: CompanyProfile;
}

const FicheDePaie: React.FC<FicheDePaieProps> = ({ employee, payroll, companyProfile }) => {
    return (
        <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border shadow-lg">
            <header className="text-center mb-8">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <h2 className="text-2xl font-semibold uppercase">Fiche de Paie</h2>
                <p>Période: {payroll.period}</p>
            </header>
            <section className="grid grid-cols-2 gap-8 mb-8 border-y py-4">
                <div>
                    <h3 className="font-bold">Employé</h3>
                    <p>{employee.name}</p>
                    <p>{employee.role}</p>
                    <p>Département: {employee.department}</p>
                </div>
                <div>
                     <h3 className="font-bold">Informations</h3>
                    <p>Date d'embauche: {new Date(employee.hireDate).toLocaleDateString()}</p>
                    <p>ID Employé: {employee.id}</p>
                </div>
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
                        <tr className="border-b"><td className="p-3">Salaire Brut</td><td className="p-3 text-right">{payroll.grossSalary.toLocaleString()} GNF</td></tr>
                        <tr className="border-b"><td className="p-3">Cotisations et Impôts</td><td className="p-3 text-right text-red-600">-{payroll.deductions.toLocaleString()} GNF</td></tr>
                    </tbody>
                    <tfoot className="font-bold bg-gray-200 text-black">
                        <tr>
                            <td className="p-3 text-lg">Salaire Net à Payer</td>
                            <td className="p-3 text-right text-lg">{payroll.netSalary.toLocaleString()} GNF</td>
                        </tr>
                    </tfoot>
                </table>
            </section>
             <footer className="text-center text-xs text-gray-500 mt-12 pt-6 border-t">
                <p>Payé le {new Date(payroll.paymentDate).toLocaleDateString()}</p>
                <p>Document généré par PGS-ERP</p>
            </footer>
        </div>
    );
};

export default FicheDePaie;