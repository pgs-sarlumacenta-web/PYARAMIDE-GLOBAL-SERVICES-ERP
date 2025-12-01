import React from 'react';
// FIX: Add .ts extension to import path
import { StudioProject, StudioService, Client, CompanyProfile, BillingSettings } from '../../types.ts';

interface ContratProps {
    project: StudioProject;
    services: StudioService[];
    client: Client;
    total: number;
    companyProfile: CompanyProfile;
    billingSettings: BillingSettings;
}

const Contrat: React.FC<ContratProps> = ({ project, services = [], client, total, companyProfile, billingSettings }) => {
    if (!project || !client) return null;

    return (
        <div className="bg-white text-black dark:text-black font-serif w-full max-w-4xl mx-auto p-12 border-2 border-gray-400 shadow-lg">
            <header className="text-center mb-12">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold uppercase">Contrat de Prestation de Services</h1>
                <h2 className="text-xl">Production Musicale - {companyProfile.nom}</h2>
                <p className="text-sm mt-2">Réf: {project.contratRef}</p>
            </header>

            <section className="mb-8 text-base leading-relaxed">
                <p className="mb-4"><strong>Entre les soussignés :</strong></p>
                <p><strong>{companyProfile.nom}</strong>, ({companyProfile.adresse}), ci-après dénommé "Le Prestataire",</p>
                <p className="my-4"><strong>ET</strong></p>
                <p><strong>{client.name}</strong>, ({client.email}, {client.phone}), ci-après dénommé "Le Client".</p>
            </section>
            
            <section className="mb-8 text-base leading-relaxed">
                <h3 className="text-lg font-bold mb-4">Article 1 : Objet du contrat</h3>
                <p>Le présent contrat a pour objet de définir les conditions dans lesquelles Le Prestataire s'engage à réaliser pour Le Client les prestations de production musicale pour le projet intitulé : <strong>"{project.projectName}"</strong>.</p>
            </section>

            <section className="mb-8 text-base leading-relaxed">
                 <h3 className="text-lg font-bold mb-4">Article 2 : Description des prestations</h3>
                 <p>Les services convenus pour ce projet incluent :</p>
                 <ul className="list-disc pl-6">
                    {services.map(s => <li key={s.id}>{s.name}</li>)}
                 </ul>
            </section>

             <section className="mb-8 text-base leading-relaxed">
                 <h3 className="text-lg font-bold mb-4">Article 3 : Conditions financières</h3>
                 <p>Le montant total des prestations est fixé à <strong>{total.toLocaleString()} GNF</strong>.
                 {project.discount > 0 && <span> (Après une remise de {project.discount.toLocaleString()} GNF)</span>}
                 </p>
                 <p>Un acompte de <strong>{project.amountPaid.toLocaleString()} GNF</strong> a été versé à la signature.</p>
                 <p className="mt-4 text-sm">{billingSettings.defaultFooter}</p>
            </section>

            <footer className="mt-20 pt-10">
                <p className="text-center mb-12">Fait à Bamako, le {new Date(project.startDate).toLocaleDateString('fr-FR')}</p>
                <div className="flex justify-between items-end text-center text-sm">
                    <div>
                        <p className="border-t-2 border-black pt-2 w-64 mx-auto">Signature du Client</p>
                        <p className="font-bold mt-1">{client.name}</p>
                    </div>
                    <div>
                        <p className="border-t-2 border-black pt-2 w-64 mx-auto">Signature du Prestataire</p>
                        <p className="font-bold mt-1">La Direction ({companyProfile.nom})</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Contrat;