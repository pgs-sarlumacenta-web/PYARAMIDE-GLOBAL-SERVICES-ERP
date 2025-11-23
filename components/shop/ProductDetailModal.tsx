import React, { useState, useMemo, useEffect } from 'react';
import { Article, StockMovement, Supplier, ShopOrder, Client } from '../../types.ts';
import { useData } from '../../context/DataContext.tsx';
import Modal from '../Modal.tsx';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../../context/AlertContext.tsx';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
  readOnly?: boolean;
  shopOrders: ShopOrder[];
  clients: Client[];
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, article, readOnly = false, shopOrders, clients }) => {
    const { stockMovements, setStockMovements, setArticles, suppliers, itemCategories } = useData();
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'adjust' | 'customers'>('details');
    
    const [editData, setEditData] = useState(article);
    useEffect(() => {
        if(isOpen) {
            setEditData(article);
            setActiveTab('details'); // Reset to default tab on open
        }
    }, [isOpen, article]);


    const [adjustmentQty, setAdjustmentQty] = useState(0);
    const [adjustmentReason, setAdjustmentReason] = useState('');

    const articleHistory = useMemo(() => {
        return stockMovements
            .filter(m => m.itemType === 'article' && m.itemId === article.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockMovements, article.id]);

    const customersWhoBought = useMemo(() => {
        if (!shopOrders || !clients) return [];

        const ordersWithProduct = shopOrders.filter(order => 
            order.items.some(item => item.articleId === article.id) && order.clientId
        );

        const clientPurchaseInfo: Record<string, { lastPurchase: string }> = {};

        ordersWithProduct.forEach(order => {
            const orderDate = new Date(order.orderDate).toISOString();
            if (order.clientId) {
                if (!clientPurchaseInfo[order.clientId] || orderDate > clientPurchaseInfo[order.clientId].lastPurchase) {
                    clientPurchaseInfo[order.clientId] = { lastPurchase: orderDate };
                }
            }
        });

        return Object.entries(clientPurchaseInfo)
            .map(([clientId, info]) => {
                const client = clients.find(c => c.id === clientId);
                return {
                    clientName: client?.name || 'Client Inconnu',
                    lastPurchase: new Date(info.lastPurchase).toLocaleDateString('fr-FR')
                };
            })
            .sort((a, b) => a.clientName.localeCompare(b.clientName));

    }, [shopOrders, clients, article.id]);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setArticles(prev => prev.map(p => p.id === article.id ? editData : p));
        onClose();
    };

    const handleAdjustmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adjustmentQty === 0 || !adjustmentReason) {
            showAlert("Champs requis", "Veuillez entrer une quantité et une raison pour l'ajustement.");
            return;
        }

        const newStock = article.stock + adjustmentQty;
        if (newStock < 0) {
            showAlert("Erreur de stock", "Le stock ne peut pas devenir négatif.");
            return;
        }

        const newMovement: StockMovement = {
            id: `SM-ADJ-${article.id}-${Date.now()}`,
            itemId: article.id,
            itemType: 'article',
            date: new Date().toISOString(),
            type: adjustmentQty > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(adjustmentQty),
            reason: `Ajustement: ${adjustmentReason}`
        };
        
        setStockMovements(prev => [newMovement, ...prev]);
        setArticles(prev => prev.map(p => p.id === article.id ? { ...p, stock: newStock } : p));
        
        setAdjustmentQty(0);
        setAdjustmentReason('');
        setActiveTab('history'); // Switch to history to see the change
    };
    
    const supplierName = useMemo(() => suppliers.find(s => s.id === article.supplierId)?.name || 'N/A', [suppliers, article.supplierId]);
    const categoryName = useMemo(() => itemCategories.find(c => c.id === article.categoryId)?.name || 'N/A', [itemCategories, article.categoryId]);

    const profitability = useMemo(() => {
        const margin = (editData.sellingPrice || 0) - editData.purchasePrice;
        const marginPercent = (editData.sellingPrice || 0) > 0 ? (margin / (editData.sellingPrice || 1)) * 100 : 0;
        return { margin, marginPercent };
    }, [editData.sellingPrice, editData.purchasePrice]);


    const TabButton: React.FC<{ tab: string, label: string }> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab as any)} className={`px-3 py-1 text-sm rounded-md ${activeTab === tab ? 'bg-green-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Détails de l'article : ${article.name}`}>
            <div className="flex space-x-2 border-b mb-4">
                <TabButton tab="details" label="Détails" />
                <TabButton tab="history" label="Historique Mouvements" />
                <TabButton tab="customers" label="Clients" />
                {!readOnly && <TabButton tab="adjust" label="Ajuster Stock" />}
            </div>

            {activeTab === 'details' && (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Nom de l'article</label><input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="input-style" required readOnly={readOnly} /></div>
                        <div><label>Catégorie</label><select value={editData.categoryId} onChange={e => setEditData({...editData, categoryId: e.target.value})} className="input-style" disabled={readOnly}>{itemCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label>Prix d'Achat</label><input type="number" value={editData.purchasePrice} onChange={e => setEditData({...editData, purchasePrice: +e.target.value})} className="input-style" required readOnly={readOnly} /></div>
                        <div><label>Prix de Vente</label><input type="number" value={editData.sellingPrice || ''} onChange={e => setEditData({...editData, sellingPrice: +e.target.value})} className="input-style" disabled={!editData.isSellable || readOnly} /></div>
                        <div><label>Stock Actuel</label><input type="number" value={editData.stock} className="input-style-readonly" readOnly /></div>
                        <div><label>Seuil d'Alerte</label><input type="number" value={editData.alertThreshold} onChange={e => setEditData({...editData, alertThreshold: +e.target.value})} className="input-style" required readOnly={readOnly} /></div>
                    </div>
                    <div><label>Fournisseur</label><select value={editData.supplierId || ''} onChange={e => setEditData({...editData, supplierId: e.target.value})} className="input-style" disabled={readOnly}><option value="">Aucun</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-lg flex items-center mb-2"><PresentationChartLineIcon className="h-5 w-5 mr-2 text-shop-green"/>Rentabilité</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-xs">Marge Brute</p><p className={`font-bold text-lg ${profitability.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitability.margin.toLocaleString()} GNF</p></div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-xs">Marge Brute (%)</p><p className={`font-bold text-lg ${profitability.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitability.marginPercent.toFixed(1)}%</p></div>
                        </div>
                    </div>

                     <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="mr-2 btn-secondary">Fermer</button>{!readOnly && <button type="submit" className="btn-primary bg-green-600 hover:bg-green-700">Enregistrer</button>}</div>
                </form>
            )}

            {activeTab === 'history' && (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {articleHistory.length === 0 ? <p className="text-gray-500">Aucun mouvement de stock enregistré.</p> :
                    articleHistory.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-medium text-sm">{m.reason}</p>
                                <p className="text-xs text-gray-400">{new Date(m.date).toLocaleString('fr-FR')}</p>
                            </div>
                            <div className={`flex items-center font-bold text-sm ${m.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                                {m.type === 'IN' ? <ArrowUpIcon className="h-4 w-4 mr-1"/> : <ArrowDownIcon className="h-4 w-4 mr-1"/>}
                                {m.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="animate-fade-in">
                    <h4 className="font-semibold text-lg mb-2">Clients ayant acheté ce produit</h4>
                    {customersWhoBought.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Aucun client n'a encore acheté ce produit.</p>
                    ) : (
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2">Client</th>
                                        <th className="p-2 text-right">Dernier Achat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customersWhoBought.map((customer, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="p-2">{customer.clientName}</td>
                                            <td className="p-2 text-right">{customer.lastPurchase}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'adjust' && !readOnly && (
                <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                    <p className="text-sm text-gray-500">Stock actuel: <strong>{article.stock}</strong> {article.consumptionUnit || 'unités'}.</p>
                    <div>
                        <label>Quantité à ajuster</label>
                        <input type="number" value={adjustmentQty} onChange={e => setAdjustmentQty(+e.target.value)} className="input-style" placeholder="ex: -5 ou 10" />
                        <p className="text-xs text-gray-400">Utilisez un nombre négatif pour une sortie, positif pour une entrée.</p>
                    </div>
                     <div>
                        <label>Raison de l'ajustement</label>
                        <input type="text" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)} className="input-style" placeholder="ex: Perte, Erreur inventaire" required/>
                    </div>
                     <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="mr-2 btn-secondary">Annuler</button><button type="submit" className="btn-primary bg-green-600 hover:bg-green-700">Appliquer l'ajustement</button></div>
                </form>
            )}

        </Modal>
    );
};

export default ProductDetailModal;