
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/DataContext.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import { isSupabaseConfigured } from '../supabaseClient.ts';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.356-11.187-7.962l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.219,44,30.561,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<React.ReactNode>('');
    const [loading, setLoading] = useState(false);
    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const NotConfiguredBanner = () => {
        if (isSupabaseConfigured) return null;
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-r-lg text-sm shadow-sm" role="alert">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-yellow-900">Mode Démo Actif</p>
                        <p className="mt-1">L'application ne trouve pas votre base de données Supabase.</p>
                        <p className="mt-2 font-semibold underline">Pour connecter la base de données :</p>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-yellow-700">
                            <li>Créez un fichier nommé <code>.env</code> à la racine du projet.</li>
                            <li>Collez-y vos clés <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                            <li><strong>Redémarrez le serveur</strong> (arrêtez avec Ctrl+C puis relancez <code>npm run dev</code>).</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.message === 'AUTH_USER_ARCHIVED') {
                setError('Ce compte utilisateur a été archivé et ne peut plus se connecter.');
            } else if (err.message?.includes('Invalid login credentials')) {
                setError('Email ou mot de passe incorrect.');
            } else {
                setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!isSupabaseConfigured) {
            setError("La connexion Google n'est pas disponible en Mode Démo. Veuillez configurer Supabase.");
            return;
        }
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            // Supabase handles redirection, so we might not reach here immediately
        } catch (err: any) {
             showAlert("Connexion Google échouée", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-pgs-bg-light dark:bg-pgs-bg-dark">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-pgs-red">PGS-SARLU</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Connectez-vous à votre compte</p>
                </div>

                <NotConfiguredBanner />
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-style"
                                placeholder="exemple@pgs-sarlu.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-style"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pgs-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pgs-blue disabled:bg-blue-300 dark:disabled:bg-gray-600"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Ou
                        </span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        disabled={loading || !isSupabaseConfigured}
                        onClick={handleGoogleSignIn}
                        className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pgs-blue disabled:opacity-50 dark:disabled:bg-gray-700"
                    >
                        <GoogleIcon />
                        Se connecter avec Google
                    </button>
                </div>

                <div className="text-center text-sm pt-4 border-t dark:border-gray-700">
                    <a href="#/portal/login" className="font-medium text-pgs-blue hover:text-blue-500">
                        Êtes-vous un client ? Accédez à votre portail.
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
