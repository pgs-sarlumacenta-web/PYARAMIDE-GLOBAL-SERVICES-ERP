import React from 'react';
// FIX: Add .ts extension to import path
import { StudioProject, StudioService, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface FactureProps {
    project: StudioProject;
    services: StudioService[];
    client: Client;
    total: number;
    companyProfile: CompanyProfile;
    billingSettings: BillingSettings;
}

const Facture: React.FC<FactureProps> = ({ project, services = [], client, total, companyProfile, billingSettings }) => {
    if (!project || !client) return null;

    const subTotal = services.reduce((sum, s) => sum + s.tarif, 0);
    const balance = total - project.amountPaid;

    return (
        <div className="bg-white text-black dark:text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg">
            <header className="flex justify-between items-start pb-6 border-b border-gray-300">
                <div className="flex items-center">
                    <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mr-4"/>
                    <div>
                        <h1 className="text-3xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                        <p className="text-gray-500 dark:text-gray-500">PS-STUDIO</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold uppercase">Facture</h2>
                    <p className="text-gray-500 dark:text-gray-500">Facture N°: {project.factureRef}</p>
                    <p className="text-gray-500 dark:text-gray-500">Date: {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
            </header>

            <section className="my-8 flex justify-between">
                <div>
                    <h3 className="font-semibold mb-2">Facturé à :</h3>
                    <p className="font-bold text-lg">{client.name}</p>
                    <p className="text-gray-600 dark:text-gray-600">Email: {client.email}</p>
                    <p className="text-gray-600 dark:text-gray-600">Téléphone: {client.phone}</p>
                    <p className="text-gray-600 dark:text-gray-600">Projet: {project.projectName}</p>
                </div>
            </section>

            <section>
                 <table className="w-full text-left">
                    <thead className="bg-gray-200 text-black dark:text-black uppercase text-sm">
                        <tr>
                            <th className="p-3 font-semibold tracking-wide text-left">Description</th>
                            <th className="p-3 font-semibold tracking-wide text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right">{item.tarif.toLocaleString()} GNF</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="flex justify-end mt-8">
                <div className="w-full max-w-sm text-right">
                    <div className="flex justify-between py-1">
                        <span className="font-semibold">Sous-total:</span>
                        <span>{subTotal.toLocaleString()} GNF</span>
                    </div>
                    {project.discount > 0 && (
                        <div className="flex justify-between py-1 text-red-600">
                            <span className="font-semibold">Remise:</span>
                            <span>- {project.discount.toLocaleString()} GNF</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 font-bold border-t">
                        <span>Total:</span>
                        <span>{total.toLocaleString()} GNF</span>
                    </div>
                     <div className="flex justify-between py-2 text-green-600">
                        <span>Montant Payé:</span>
                        <span>-{project.amountPaid.toLocaleString()} GNF</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-black mt-2">
                        <span className="font-bold text-lg">Solde Dû:</span>
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

export default Facture;