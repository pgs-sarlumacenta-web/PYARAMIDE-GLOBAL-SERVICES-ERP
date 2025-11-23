import React, { useState, useEffect } from 'react';
import { useAuth, useData } from '../../context/DataContext.tsx';
import { Client } from '../../types.ts';
import { useAlert } from '../../context/AlertContext.tsx';

const ClientProfile: React.FC = () => {
    const { client, clientLogin } = useAuth();
    const { clients, setClients } = useData();
    const { showAlert } = useAlert();

    const [formData, setFormData] = useState<Partial<Client>>({});
    
    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                company: client.company,
                email: client.email,
                phone: client.phone,
                address: client.address
            });
        }
    }, [client]);

    if (!client) {
        return <div>Chargement...</div>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedClient: Client = { ...client, ...formData };
        
        setClients(clients.map(c => (c.id === client.id ? updatedClient : c)));
        clientLogin(updatedClient); // Mettre à jour la session client
        
        showAlert("Succès", "Votre profil a été mis à jour avec succès !");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Mon Profil</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nom</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleInputChange} className="input-style mt-1" />
                        </div>
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium">Société</label>
                            <input type="text" id="company" name="company" value={formData.company || ''} onChange={handleInputChange} className="input-style mt-1" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email</label>
                            <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="input-style mt-1" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium">Téléphone</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input-style mt-1" />
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium">Adresse</label>
                            <input type="text" id="address" name="address" value={formData.address || ''} onChange={handleInputChange} className="input-style mt-1" />
                        </div>
                    </div>
                    <div className="border-t pt-6 flex justify-end">
                        <button type="submit" className="px-4 py-2 text-white bg-pgs-blue rounded-md hover:bg-blue-700">
                            Enregistrer les modifications
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientProfile;
