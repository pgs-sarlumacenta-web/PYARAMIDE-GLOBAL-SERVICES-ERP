import React, { useState, useEffect } from 'react';
// FIX: Add .ts extension to import path
import { Client } from '../types.ts';
// FIX: Add .tsx extension to import path
import Modal from './Modal.tsx';
// FIX: Add .tsx extension to import path
import { useData } from '../context/DataContext.tsx';
import { useAlert } from '../context/AlertContext.tsx';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: Client) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded }) => {
    const { clients } = useData();
    const { showAlert } = useAlert();
    const initialClientState: Omit<Client, 'id'> = { name: '', company: '', email: '', phone: '', address: '' };
    const [newClientData, setNewClientData] = useState(initialClientState);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setEmailError('');
            setPhoneError('');
            return;
        }

        // Check for email duplicates
        if (newClientData.email) {
            const duplicate = clients.find(c => c.email === newClientData.email);
            if (duplicate) {
                setEmailError(`Cet email est déjà utilisé par ${duplicate.name}.`);
            } else {
                setEmailError('');
            }
        } else {
            setEmailError('');
        }

        // Check for phone duplicates
        if (newClientData.phone) {
            const duplicate = clients.find(c => c.phone === newClientData.phone);
            if (duplicate) {
                setPhoneError(`Ce téléphone est déjà utilisé par ${duplicate.name}.`);
            } else {
                setPhoneError('');
            }
        } else {
            setPhoneError('');
        }
    }, [newClientData.email, newClientData.phone, clients, isOpen]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailError || phoneError) {
            showAlert("Erreur de validation", "Veuillez corriger les erreurs avant de soumettre.");
            return;
        }
        
        const newClient: Client = {
            ...newClientData,
            id: `C_NEW_${Date.now()}`,
        };
        onClientAdded(newClient);
        setNewClientData(initialClientState); // Reset form for next time
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau client" zIndex="z-[60]">
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label htmlFor="quick-name" className="block text-sm font-medium">Nom</label>
                    <input type="text" name="name" id="quick-name" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="quick-company" className="block text-sm font-medium">Société (facultatif)</label>
                    <input type="text" name="company" id="quick-company" value={newClientData.company} onChange={e => setNewClientData({...newClientData, company: e.target.value})} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="quick-email" className="block text-sm font-medium">Email</label>
                    <input type="email" name="email" id="quick-email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700" />
                    {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>
                <div>
                    <label htmlFor="quick-phone" className="block text-sm font-medium">Téléphone</label>
                    <input type="tel" name="phone" id="quick-phone" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700" />
                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>
                <div>
                    <label htmlFor="quick-address" className="block text-sm font-medium">Adresse</label>
                    <input type="text" name="address" id="quick-address" value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} required className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="mr-2 btn-secondary">Annuler</button>
                    <button type="submit" className="btn-primary" disabled={!!emailError || !!phoneError}>Ajouter Client</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddClientModal;