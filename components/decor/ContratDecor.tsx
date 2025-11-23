import React from 'react';
import { DecorOrder, Client, DecorService, CompanyProfile, BillingSettings } from '../../types.ts';

interface ContratDecorProps {
  order: DecorOrder;
  client: Client;
  services: DecorService[];
  companyProfile: CompanyProfile;
  billingSettings: BillingSettings;
}

const ContratDecor: React.FC<ContratDecorProps> = ({ order, client, services, companyProfile, billingSettings }) => {
    if (!order || !client) return null;

    const orderServices = order.items.map(item => {
        const service = services.find(s => s.id === item.serviceId);
        return {
            name: service?.name || 'Service Inconnu',
            quantity: item.quantity,
        };
    });

    return (
        <div className="bg-white text-black font-serif w-full max-w-4xl mx-auto p-12 border-2 border-gray-400 shadow-lg">
            <header className="text-center mb-12">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold uppercase">Contrat de Prestation de Services</h1>
                <h2 className="text-xl">PS-DÉCOR - {companyProfile.nom}</h2>
                <p className="text-sm mt-2">Réf. Commande: {order.id}</p>
            </header>

            <section className="mb-8 text-base leading-relaxed">
                <p className="mb-4"><strong>Entre les soussignés :</strong></p>
                <p><strong>{companyProfile.nom}</strong>, ({companyProfile.adresse}), ci-après dénommé "Le Prestataire",</p>
                <p className="my-4"><strong>ET</strong></p>
                <p><strong>{client.name}</strong>, ({client.email}, {client.phone}), ci-après dénommé "Le Client".</p>
            </section>
            
            <section className="mb-8 text-base leading-relaxed">
                <h3 className="text-lg font-bold mb-4">Article 1 : Objet du contrat</h3>
                <p>Le présent contrat a pour objet de définir les conditions dans lesquelles Le Prestataire s'engage à réaliser pour Le Client les prestations de décoration pour l'événement : <strong>"{order.description}"</strong>.</p>
                {order.customDetails && <p className="mt-2">Détails spécifiques : {order.customDetails}</p>}
            </section>

            <section className="mb-8 text-base leading-relaxed">
                 <h3 className="text-lg font-bold mb-4">Article 2 : Description des prestations</h3>
                 <p>Les services convenus incluent :</p>
                 <ul className="list-disc pl-6">
                    {orderServices.map((s, i) => <li key={i}>{s.name} (Quantité: {s.quantity})</li>)}
                 </ul>
            </section>

             <section className="mb-8 text-base leading-relaxed">
                 <h3 className="text-lg font-bold mb-4">Article 3 : Conditions financières</h3>
                 <p>Le montant total des prestations est fixé à <strong>{order.totalAmount.toLocaleString()} GNF</strong>.
                 {order.discount > 0 && <span> (Après une remise de {order.discount.toLocaleString()} GNF)</span>}
                 </p>
                 <p>Un acompte de <strong>{order.amountPaid.toLocaleString()} GNF</strong> a été versé.</p>
                 <p className="mt-4 text-sm">{billingSettings.defaultFooter}</p>
            </section>

            <footer className="mt-20 pt-10">
                <p className="text-center mb-12">Fait à Conakry, le {new Date(order.orderDate).toLocaleDateString('fr-FR')}</p>
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

export default ContratDecor;