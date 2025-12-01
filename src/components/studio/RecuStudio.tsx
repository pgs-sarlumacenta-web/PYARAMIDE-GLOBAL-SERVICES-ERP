import React from 'react';
// FIX: Add .ts extension to import path
import { StudioProject, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface RecuStudioProps {
    project: StudioProject;
    client: Client;
    total: number;
    receipt: { amount: number; date: string; ref: string; };
    companyProfile: CompanyProfile;
    billingSettings: BillingSettings;
}

const RecuStudio: React.FC<RecuStudioProps> = ({ project, client, total, receipt, companyProfile, billingSettings }) => {
    if (!project || !client || !receipt) return null;

    const balance = total - project.amountPaid;

    return (
        <div className="bg-white text-black dark:text-black font-sans w-full max-w-2xl mx-auto p-8 border border-gray-300 shadow-lg">
            <header className="flex justify-between items-start pb-6 border-b border-gray-300">
                 <div className="flex items-center">
                    <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4"/>
                    <div>
                        <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                        <p className="text-gray-500 dark:text-gray-500">PS-STUDIO</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold uppercase">Reçu de Paiement</h2>
                    <p className="text-gray-500 dark:text-gray-500">Reçu N°: {receipt.ref}</p>
                    <p className="text-gray-500 dark:text-gray-500">Date: {new Date(receipt.date).toLocaleDateString('fr-FR')}</p>
                </div>
            </header>

            <section className="my-8">
                <h3 className="font-semibold mb-2">Reçu de :</h3>
                <p className="font-bold text-lg">{client.name}</p>
                <p className="text-gray-600 dark:text-gray-600">Email: {client.email}</p>
                <p className="text-gray-600 dark:text-gray-600">Téléphone: {client.phone}</p>
            </section>

            <section>
                <table className="w-full text-left">
                    <thead className="bg-gray-200 text-black dark:text-black uppercase text-sm">
                        <tr>
                            <th className="p-3 font-semibold tracking-wide text-left">Description</th>
                            <th className="p-3 font-semibold tracking-wide text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">
                                <p className="font-medium">Paiement pour le projet : "{project.projectName}"</p>
                            </td>
                            <td className="p-3 text-right">{receipt.amount.toLocaleString()} GNF</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="flex justify-end mt-8">
                <div className="w-full max-w-xs text-right">
                    <div className="flex justify-between py-1">
                        <span className="font-semibold">Total Projet:</span>
                        <span>{total.toLocaleString()} GNF</span>
                    </div>
                    {project.discount > 0 && 
                        <p className="text-xs text-gray-500 text-right">(Sous-total: {(total + project.discount).toLocaleString()} GNF, Remise: {project.discount.toLocaleString()} GNF)</p>
                    }
                    <div className="flex justify-between py-2 mt-2 border-t">
                        <span className="font-semibold">Total Versé (à ce jour):</span>
                        <span>{project.amountPaid.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-black mt-2">
                        <span className="font-bold text-lg">Solde Restant:</span>
                        <span className="font-bold text-lg">{balance.toLocaleString()} GNF</span>
                    </div>
                </div>
            </section>
            
            <footer className="text-center mt-12 pt-6 border-t border-gray-300">
                <p className="text-gray-600 dark:text-gray-600 font-semibold whitespace-pre-wrap">{billingSettings.defaultFooter}</p>
            </footer>
        </div>
    );
};

export default RecuStudio;