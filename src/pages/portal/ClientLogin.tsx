import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../../context/DataContext.tsx';

const ClientLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const { clientLogin } = useAuth();
    const { clients } = useData();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Pour la simulation, nous vérifions juste l'existence de l'email.
        // Un système réel vérifierait un mot de passe ou enverrait un lien magique.
        const client = clients.find(c => c.email.toLowerCase() === email.toLowerCase() && !c.isArchived);

        if (client) {
            clientLogin(client);
            navigate('/portal/dashboard');
        } else {
            setError('Aucun client trouvé avec cette adresse email.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-pgs-red">Portail Client</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Accédez à vos informations</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Adresse Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pgs-blue focus:border-pgs-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="Entrez votre adresse email"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pgs-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pgs-blue"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>
                 <div className="text-center text-sm space-y-2 pt-4 border-t dark:border-gray-700">
                    <a href="#/login" className="block font-medium text-pgs-blue hover:text-blue-500">
                        Êtes-vous un employé ?
                    </a>
                     <a href="#/wifi-login" className="block font-medium text-wifizone-orange hover:text-orange-500">
                        Utilisateur du Wifizone ? Connectez-vous ici.
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;