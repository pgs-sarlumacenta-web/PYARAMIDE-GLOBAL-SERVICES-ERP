
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { useAlert } from '../../context/AlertContext.tsx';
import { WifiIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const CaptivePortalLogin: React.FC = () => {
    const [voucherCode, setVoucherCode] = useState('');
    const { wifizoneSales, studioServices, decorServices, articles } = useData();
    const { showAlert } = useAlert();
    const [currentIndex, setCurrentIndex] = useState(0);

    const promoItems = useMemo(() => {
        const items = [];
        const studioService = studioServices.find(s => !s.isArchived && s.statut === 'Actif');
        if (studioService) {
            items.push({ 
                title: "Enregistrez votre prochain hit !", 
                subtitle: `${studioService.name} - PS-STUDIO`, 
                color: 'from-studio-red/70 to-red-900/70'
            });
        }

        const decorService = decorServices.find(s => !s.isArchived);
        if (decorService) {
            items.push({ 
                title: "Un décor de rêve pour vos événements", 
                subtitle: `${decorService.name} - PS-DÉCOR`, 
                color: 'from-decor-yellow/70 to-yellow-900/70'
            });
        }
        
        const sellableArticle = articles.find(a => a.isSellable && !a.isArchived);
        if (sellableArticle) {
            items.push({ 
                title: "Équipement pro disponible en boutique", 
                subtitle: `${sellableArticle.name} - PS-SHOP`, 
                color: 'from-shop-green/70 to-green-900/70'
            });
        }
        return items;
    }, [studioServices, decorServices, articles]);

    useEffect(() => {
        if (promoItems.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % promoItems.length);
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(timer);
    }, [promoItems.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sale = wifizoneSales.find(s => s.voucherCode.trim().toUpperCase() === voucherCode.trim().toUpperCase());

        if (sale) {
            showAlert('Accès Accordé!', 'Vous êtes maintenant connecté à internet. Profitez bien !');
        } else {
            showAlert('Code Invalide', 'Le code voucher que vous avez entré est invalide ou a déjà été utilisé.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-amber-200 p-4">
            <div className="w-full max-w-sm">
                <div className="p-8 space-y-6 bg-white rounded-2xl shadow-xl z-10 relative">
                    <div className="text-center">
                        <WifiIcon className="w-12 h-12 mx-auto text-wifizone-orange"/>
                        <h1 className="text-2xl font-bold text-wifizone-orange mt-2">Bienvenue à PS-WIFIZONE</h1>
                        <p className="mt-2 text-gray-600">Entrez votre code voucher pour vous connecter.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="voucher-code" className="sr-only">Code Voucher</label>
                            <input
                                id="voucher-code"
                                name="voucher"
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                className="input-style w-full text-center text-lg tracking-widest font-mono"
                                placeholder="WZ-XXXX-XXXX"
                                required
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="w-full btn-primary bg-wifizone-orange hover:bg-orange-600">
                            Se Connecter
                        </button>
                    </form>
                     <div className="text-center text-xs text-gray-400">
                        <p>Powered by PGS-SARLU</p>
                    </div>
                </div>

                {promoItems.length > 0 && (
                     <div className="mt-6 relative h-40 rounded-2xl shadow-lg overflow-hidden">
                        <div 
                            className="flex transition-transform duration-700 ease-in-out h-full"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {promoItems.map((item, index) => (
                                <div key={index} className={`w-full flex-shrink-0 h-full p-6 flex flex-col justify-center text-white bg-gradient-to-br ${item.color}`}>
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <p className="text-sm">{item.subtitle}</p>
                                </div>
                            ))}
                        </div>
                         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                            {promoItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaptivePortalLogin;
