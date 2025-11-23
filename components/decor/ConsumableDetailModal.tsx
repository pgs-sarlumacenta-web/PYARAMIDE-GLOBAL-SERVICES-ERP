
import React, { useMemo } from 'react';
import { Article, StockMovement, DecorOrder } from '../../types.ts';
import { useData } from '../../context/DataContext.tsx';
import Modal from '../Modal.tsx';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ConsumableDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
  decorOrders: DecorOrder[];
}

const ConsumableDetailModal: React.FC<ConsumableDetailModalProps> = ({ isOpen, onClose, article, decorOrders }) => {
    const { stockMovements } = useData();

    const articleHistory = useMemo(() => {
        return stockMovements
            .filter(m => m.itemType === 'article' && m.itemId === article.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockMovements, article.id]);

    const usageInOrders = useMemo(() => {
        // Filter logic to show which Decor Orders used this consumable
        // This assumes your data model links consumables to orders properly via DecorServices
        // Since the link is indirect (Order -> Service -> Articles), we can only approximate or need logic to trace it.
        // For simplicity here, we'll show direct stock movements.
        return articleHistory.filter(m => m.reason.includes('Commande Décor') || m.reason.includes('Décor'));
    }, [articleHistory]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Détail Consommable : ${article.name}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-500">Stock Actuel</p>
                        <p className="text-2xl font-bold">{article.stock} {article.consumptionUnit}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Seuil d'alerte</p>
                        <p className="text-2xl font-bold text-red-500">{article.alertThreshold}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Historique des Mouvements</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {articleHistory.length > 0 ? articleHistory.map(m => (
                             <div key={m.id} className="flex justify-between items-center p-2 rounded-md bg-gray-100 dark:bg-gray-600">
                                <div>
                                    <p className="font-medium text-sm">{m.reason}</p>
                                    <p className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString()}</p>
                                </div>
                                <div className={`flex items-center font-bold text-sm ${m.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                                    {m.type === 'IN' ? <ArrowUpIcon className="h-4 w-4 mr-1"/> : <ArrowDownIcon className="h-4 w-4 mr-1"/>}
                                    {m.quantity}
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-500">Aucun mouvement enregistré.</p>}
                    </div>
                </div>
                
                <div className="flex justify-end">
                     <button onClick={onClose} className="btn-secondary">Fermer</button>
                </div>
            </div>
        </Modal>
    );
};

export default ConsumableDetailModal;
