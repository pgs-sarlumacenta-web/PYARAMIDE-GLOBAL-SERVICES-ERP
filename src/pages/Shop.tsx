
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { ShopOrder, Article, Client, Transaction, Permission, ShopOrderItem, ShopOrderStatus, StockMovement } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import AddClientModal from '../components/AddClientModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon, ArrowLeftIcon, BanknotesIcon, XCircleIcon, EyeIcon, BellAlertIcon, ChevronDownIcon, PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ReportModal from '../components/ReportModal.tsx';
import DevisShop from '../components/shop/DevisShop.tsx';
import FactureProformaShop from '../components/shop/FactureProformaShop.tsx';
import FactureShop from '../components/shop/FactureShop.tsx';
import BonLivraisonShop from '../components/shop/BonLivraisonShop.tsx';
import RecuShop from '../components/shop/RecuShop.tsx';
import ShopDashboard from '../components/shop/ShopDashboard.tsx';
import ShopReport from '../components/shop/ShopReport.tsx';
import ProductDetailModal from '../components/shop/ProductDetailModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';

type Tab = 'dashboard' | 'ventes' | 'produits';
type DetailTab = 'dashboard' | 'paiements' | 'documents';

const initialOrderState: Omit<ShopOrder, 'id' | 'devisRef' | 'proformaRef' | 'factureRef' | 'bonLivraisonRef' | 'stockDeducted'> = {
    orderDate: new Date().toISOString().split('T')[0],
    clientId: '',
    items: [],
    subTotal: 0,
    totalAmount: 0,
    amountPaid: 0,
    status: 'Devis',
    receipts: []
};

const initialArticleState: Omit<Article, 'id'> = {
    name: '',
    categoryId: '',
    supplierId: '',
    stock: 0,
    alertThreshold: 10,
    purchasePrice: 0,
    isSellable: true,
    sellingPrice: 0,
    isConsumable: false,
    consumptionUnit: 'unité',
};


const getStatusClass = (status: ShopOrderStatus) => {
    const classes: { [key in ShopOrderStatus]: string } = {
        'Devis': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
        'Confirmé': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Payé': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Livré': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Annulé': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return classes[status];
};


const Shop: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const {
        shopOrders, setShopOrders,
        clients, setClients,
        articles, setArticles,
        itemCategories,
        suppliers,
        setTransactions,
        companyProfile,
        billingSettings, setBillingSettings,
        addLogEntry,
        setStockMovements
    } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('dashboard');

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);

    // Article Modal State
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const [newArticleData, setNewArticleData] = useState<Omit<Article, 'id'>>(initialArticleState);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
    const [newOrderData, setNewOrderData] = useState<any>(initialOrderState);
    const [newPaymentData, setNewPaymentData] = useState({ amount: 0 });

    const [itemToAdd, setItemToAdd] = useState<{ articleId: string; quantity: number; discount: number }>({ articleId: '', quantity: 1, discount: 0 });


    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    // State for product search in modal
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        const state = location.state as { selectedId?: string };
        if (state?.selectedId) {
            const itemToSelect = shopOrders.find(o => o.id === state.selectedId && !o.isArchived);
            if (itemToSelect) {
                setSelectedOrder(itemToSelect);
                setActiveTab('ventes');
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, shopOrders, navigate]);


    const sellableArticles = useMemo(() => articles.filter(a => a.isSellable && !a.isArchived), [articles]);

    const openAddOrderModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewOrderData({ ...initialOrderState, clientId: '' }); // Default to comptoir
        const firstArticle = sellableArticles[0];
        if (firstArticle) {
            setItemToAdd({ articleId: firstArticle.id, quantity: 1, discount: 0 });
        }
        setProductSearch('');
        setIsOrderModalOpen(true);
    }, [sellableArticles]);

    const openAddProductModal = useCallback(() => {
        setIsEditingArticle(false);
        setCurrentItem(null);
        setNewArticleData({ ...initialArticleState, categoryId: itemCategories[0]?.id || '', supplierId: suppliers[0]?.id || '' });
        setIsArticleModalOpen(true);
    }, [itemCategories, suppliers]);

    useEffect(() => {
        if (selectedOrder) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'ventes' && hasPermission(Permission.MANAGE_SHOP_ORDERS)) {
            config = { onClick: openAddOrderModal, title: "Nouvelle Vente" };
        } else if (activeTab === 'produits' && hasPermission(Permission.MANAGE_INVENTAIRE)) {
            config = { onClick: openAddProductModal, title: "Nouveau Produit" };
        }
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedOrder, hasPermission, setFabConfig, openAddOrderModal, openAddProductModal]);

    const handleClose = () => navigate('/dashboard');
    
    const subTotal = useMemo(() => newOrderData.items.reduce((sum: number, item: ShopOrderItem) => sum + (item.quantity * item.unitPrice), 0), [newOrderData.items]);
    const totalDiscount = useMemo(() => newOrderData.items.reduce((sum: number, item: ShopOrderItem) => sum + (item.quantity * (item.discount || 0)), 0), [newOrderData.items]);
    const totalAmount = useMemo(() => subTotal - totalDiscount, [subTotal, totalDiscount]);

    const handleUpdateItemInOrder = (indexToUpdate: number, quantity: number, discount: number) => {
        setNewOrderData((prev: any) => {
            const newItems = prev.items.map((item: ShopOrderItem, index: number) => {
                if (index === indexToUpdate) {
                    return { ...item, quantity, discount };
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const handleAddItemToOrder = () => {
        if (!itemToAdd.articleId || itemToAdd.quantity <= 0) {
            showAlert('Erreur', 'Veuillez sélectionner un article et une quantité valide.');
            return;
        }
    
        const article = sellableArticles.find(a => a.id === itemToAdd.articleId);
        if (!article) {
            showAlert('Erreur', 'Article non trouvé.');
            return;
        }
    
        setNewOrderData((prev: any) => {
            const existingItemIndex = prev.items.findIndex((item: ShopOrderItem) => 
                item.articleId === itemToAdd.articleId && 
                (item.discount || 0) === (itemToAdd.discount || 0)
            );
            
            if (existingItemIndex > -1) {
                const newItems = prev.items.map((item: ShopOrderItem, index: number) => {
                    if (index === existingItemIndex) {
                        return { ...item, quantity: item.quantity + itemToAdd.quantity };
                    }
                    return item;
                });
                return { ...prev, items: newItems };
            } else {
                const newItem: ShopOrderItem = {
                    articleId: itemToAdd.articleId,
                    quantity: itemToAdd.quantity,
                    unitPrice: article.sellingPrice || 0,
                    discount: itemToAdd.discount,
                };
                return { ...prev, items: [...prev.items, newItem] };
            }
        });
    
        const firstArticle = sellableArticles[0];
        if (firstArticle) {
            setItemToAdd({ articleId: firstArticle.id, quantity: 1, discount: 0 });
        }
        setProductSearch('');
    };


    const handleFormSubmit = (data: any) => {
        const action = isEditing ? 'Modification' : 'Création';
        
        let finalStatus = data.status;
        if(data.amountPaid >= totalAmount) {
            finalStatus = 'Payé';
        }

        const finalData = { ...data, subTotal, totalAmount, status: finalStatus };

        let orderId = '';
        if (isEditing && currentItem) {
            orderId = currentItem.id;
            const updatedOrder = { ...finalData, id: orderId };
            setShopOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(updatedOrder);
            addLogEntry(action, `A modifié la vente #${orderId}`, 'shopOrder', orderId);
        } else {
            orderId = `SHO-${Date.now()}`;
            let newReceipts = [];
            
            if (finalData.amountPaid > 0) {
                const newReceiptRef = `${billingSettings.receiptPrefix}SHO-${billingSettings.receiptNextNumber}`;
                newReceipts.push({ amount: finalData.amountPaid, date: new Date().toISOString(), ref: newReceiptRef });
                setBillingSettings(prev => ({ ...prev, receiptNextNumber: prev.receiptNextNumber + 1 }));

                const newTransaction: Transaction = { id: `T_SHO_${orderId}_${Date.now()}`, date: new Date().toISOString(), department: 'Shop', description: `Paiement initial vente: #${orderId}`, amount: finalData.amountPaid, type: 'Revenu' };
                setTransactions(prev => [newTransaction, ...prev]);
            }

            const newOrder: ShopOrder = { ...finalData, id: orderId, stockDeducted: false, devisRef: '', proformaRef: '', factureRef: '', bonLivraisonRef: '', receipts: newReceipts };
            setShopOrders(prev => [newOrder, ...prev]);
            addLogEntry(action, `A créé la vente #${orderId}`, 'shopOrder', orderId);
        }
        setIsOrderModalOpen(false);
        showAlert('Succès', `Vente ${isEditing ? 'modifiée' : 'créée'} avec succès.`);
    };

    const handleArticleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...newArticleData, purchasePrice: +newArticleData.purchasePrice, sellingPrice: +(newArticleData.sellingPrice || 0) };
        if (isEditingArticle && currentItem) {
            setArticles(articles.map(a => a.id === currentItem.id ? { ...dataToSave, id: a.id } : a));
            addLogEntry("Modification", `A modifié le produit ${dataToSave.name}`, 'article', currentItem.id);
        } else {
            const newId = `ART-${Date.now()}`;
            setArticles(prev => [{ ...dataToSave, id: newId }, ...prev]);
            addLogEntry("Création", `A créé le produit ${dataToSave.name}`, 'article', newId);
        }
        setIsArticleModalOpen(false);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        const archive = (setter: Function) => setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isArchived: true } : item));
        
        if (type === 'order') {
            archive(setShopOrders);
            addLogEntry('Archivage', `A archivé la vente ${name}`, 'shopOrder', id);
        } else if (type === 'product') {
            archive(setArticles);
            addLogEntry('Archivage', `A archivé le produit ${name}`, 'article', id);
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        showAlert('Succès', 'Élément archivé.');
    };
    
    const handleStatusChange = (orderId: string, newStatus: ShopOrderStatus) => {
        setShopOrders(prevOrders => prevOrders.map(order => {
            if (order.id === orderId && order.status !== newStatus) {
                const updatedOrder = { ...order, status: newStatus };
                
                if (order.status !== 'Livré' && newStatus === 'Livré' && !order.stockDeducted) {
                    updatedOrder.stockDeducted = true;

                    setArticles(prevArticles => {
                        const newMovements: StockMovement[] = [];
                        const articlesToUpdate: Map<string, Article> = new Map(prevArticles.map(a => [a.id, {...a}]));

                        order.items.forEach(item => {
                            const article = articlesToUpdate.get(item.articleId);
                            if (article) {
                                article.stock -= item.quantity;
                                newMovements.push({
                                    id: `SM-OUT-${order.id}-${article.id}`, date: new Date().toISOString(),
                                    itemId: article.id, itemType: 'article', type: 'OUT',
                                    quantity: item.quantity, reason: `Vente #${order.id}`
                                });
                            }
                        });
                        
                        setStockMovements(prevMovements => [...prevMovements, ...newMovements]);
                        return Array.from(articlesToUpdate.values());
                    });

                    showAlert("Stock mis à jour", "Le stock a été déduit pour cette vente.");
                }

                if (selectedOrder?.id === order.id) setSelectedOrder(updatedOrder);
                return updatedOrder;
            }
            return order;
        }));
    };

    const handlePaymentSubmit = () => {
        if (!selectedOrder || newPaymentData.amount <= 0) return;

        const newReceiptRef = `${billingSettings.receiptPrefix}SHO-${billingSettings.receiptNextNumber}`;
        const newReceipt = { amount: newPaymentData.amount, date: new Date().toISOString(), ref: newReceiptRef };
        
        const newAmountPaid = selectedOrder.amountPaid + newPaymentData.amount;
        const newStatus = newAmountPaid >= selectedOrder.totalAmount ? 'Payé' : selectedOrder.status;

        const updatedOrder = {
            ...selectedOrder,
            amountPaid: newAmountPaid,
            receipts: [...(selectedOrder.receipts || []), newReceipt],
            status: newStatus
        };

        setShopOrders(orders => orders.map(p => p.id === selectedOrder.id ? updatedOrder : p));
        setSelectedOrder(updatedOrder);
        setBillingSettings(prev => ({...prev, receiptNextNumber: prev.receiptNextNumber + 1}));
        
        const newTransaction: Transaction = {
            id: `T_SHO_${selectedOrder.id}_${Date.now()}`,
            date: new Date().toISOString(),
            department: 'Shop',
            description: `Paiement vente: #${selectedOrder.id}`,
            amount: newPaymentData.amount,
            type: 'Revenu',
        };
        setTransactions(prev => [newTransaction, ...prev]);
        addLogEntry('Paiement', `A enregistré un paiement de ${newPaymentData.amount.toLocaleString()} GNF pour la vente #${selectedOrder.id}`, 'shopOrder', selectedOrder.id);
        
        showAlert('Succès', `Paiement de ${newPaymentData.amount.toLocaleString()} GNF enregistré.`);
        setIsPaymentModalOpen(false);
        setNewPaymentData({ amount: 0 });
    };
    
    const openDocument = (type: 'devis' | 'proforma' | 'facture' | 'bon' | 'recu', order: ShopOrder) => {
        let currentOrder = {...order};
        const client = clients.find(c => c.id === currentOrder.clientId);
        
        const updateOrderState = (updatedOrder: ShopOrder) => {
            setShopOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            setSelectedOrder(updatedOrder);
            currentOrder = updatedOrder;
        };
        
        if (type === 'devis' && !currentOrder.devisRef) {
            const ref = `${billingSettings.quotePrefix}SHO-${billingSettings.quoteNextNumber}`;
            updateOrderState({ ...currentOrder, devisRef: ref });
            setBillingSettings(prev => ({ ...prev, quoteNextNumber: prev.quoteNextNumber + 1 }));
        } else if (type === 'proforma' && !currentOrder.proformaRef) {
            const ref = `${billingSettings.proformaPrefix}SHO-${billingSettings.proformaNextNumber}`;
            updateOrderState({ ...currentOrder, proformaRef: ref });
            setBillingSettings(prev => ({ ...prev, proformaNextNumber: prev.proformaNextNumber + 1 }));
        } else if (type === 'facture' && !currentOrder.factureRef) {
            const ref = `${billingSettings.invoicePrefix}SHO-${billingSettings.invoiceNextNumber}`;
            updateOrderState({ ...currentOrder, factureRef: ref });
            setBillingSettings(prev => ({ ...prev, invoiceNextNumber: prev.invoiceNextNumber + 1 }));
        } else if (type === 'bon' && !currentOrder.bonLivraisonRef) {
            const ref = `${billingSettings.deliveryNotePrefix}SHO-${billingSettings.deliveryNoteNextNumber}`;
            updateOrderState({ ...currentOrder, bonLivraisonRef: ref });
            setBillingSettings(prev => ({ ...prev, deliveryNoteNextNumber: prev.deliveryNoteNextNumber + 1 }));
        }
        
        let docContent: React.ReactNode = null;
        let docTitle = '';

        switch (type) {
            case 'devis': docTitle = `Devis ${currentOrder.devisRef}`; docContent = <DevisShop order={currentOrder} articles={articles} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'proforma': docTitle = `Facture Proforma ${currentOrder.proformaRef}`; docContent = <FactureProformaShop order={currentOrder} articles={articles} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'facture': docTitle = `Facture ${currentOrder.factureRef}`; docContent = <FactureShop order={currentOrder} articles={articles} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'bon': docTitle = `Bon de Livraison ${currentOrder.bonLivraisonRef}`; docContent = <BonLivraisonShop order={currentOrder} articles={articles} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'recu':
                 const lastReceipt = currentOrder.receipts?.[currentOrder.receipts.length - 1];
                 if (!lastReceipt) return showAlert("Information", "Aucun paiement enregistré pour cette commande.");
                 docTitle = `Reçu ${lastReceipt.ref}`;
                 docContent = <RecuShop order={currentOrder} articles={articles} client={client} companyProfile={companyProfile} billingSettings={billingSettings} receipt={lastReceipt}/>;
                 break;
        }

        if(docContent) {
            showAlert('Téléchargement en cours', `Votre document (${type}) sera téléchargé automatiquement.`);
            setDocumentToDownload({ content: docContent, format: 'pdf', title: docTitle });
        }
    };

    const filteredSellableArticles = useMemo(() => {
        if (!productSearch) {
            return sellableArticles.slice(0, 50); // Limit initial list
        }
        return sellableArticles.filter(a => a.name.toLowerCase().includes(productSearch.toLowerCase()));
    }, [sellableArticles, productSearch]);
    
    const selectedArticleForAdding = useMemo(() => {
        return sellableArticles.find(a => a.id === itemToAdd.articleId);
    }, [sellableArticles, itemToAdd.articleId]);

    const getExpirationInfo = (datePeremption?: string) => {
        if (!datePeremption) return null;
    
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expirationDate = new Date(datePeremption);
        
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);
    
        if (expirationDate < now) {
            return { text: `Périmé le ${expirationDate.toLocaleDateString('fr-FR')}`, className: 'text-red-600 font-bold', bg: 'bg-red-100 dark:bg-red-900/40' };
        } else if (expirationDate <= thirtyDaysFromNow) {
            return { text: `Expire le ${expirationDate.toLocaleDateString('fr-FR')}`, className: 'text-orange-600 font-semibold', bg: 'bg-orange-100 dark:bg-orange-900/40' };
        }
        
        return null;
    };

    const expirationInfo = useMemo(() => getExpirationInfo(selectedArticleForAdding?.datePeremption), [selectedArticleForAdding]);


    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => ( <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-shop-green text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button> );
    
    const renderDetailView = () => {
        if (!selectedOrder) return null;
        const client = clients.find(c => c.id === selectedOrder.clientId);
        const balance = selectedOrder.totalAmount - selectedOrder.amountPaid;

        const DetailTabButton: React.FC<{ tab: DetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
            <button onClick={() => setActiveDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === tab ? 'border-shop-green text-shop-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-5 w-5" /><span>{label}</span>
            </button>
        );
        
        return (
             <div className="animate-fade-in">
                <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                    <div>
                        <h2 className="text-3xl font-bold">Vente #{selectedOrder.id}</h2>
                        <p className="text-gray-500">{client?.name || 'Vente au comptoir'}</p>
                    </div>
                </div>
                <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="paiements" label="Paiements" icon={BanknotesIcon} /><DetailTabButton tab="documents" label="Documents" icon={DocumentTextIcon} /></nav></div>
                 <div className="mt-6">
                    {activeDetailTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-lg">Détails de la Vente</h3>
                                <div className="flex items-center"><strong className="w-28">Statut:</strong>
                                    <select value={selectedOrder.status} onChange={e => handleStatusChange(selectedOrder.id, e.target.value as any)} className="input-style w-full max-w-xs" disabled={!hasPermission(Permission.MANAGE_SHOP_ORDERS)}>
                                        <option>Devis</option><option>Confirmé</option><option>Payé</option><option>Livré</option><option>Annulé</option>
                                    </select>
                                </div>
                                <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-lg">Résumé Financier</h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-2 bg-gray-100 rounded"><p className="text-xs">Total</p><p className="font-bold text-lg">{selectedOrder.totalAmount.toLocaleString()} GNF</p></div>
                                    <div className="p-2 bg-green-100 rounded"><p className="text-xs">Payé</p><p className="font-bold text-lg text-green-700">{selectedOrder.amountPaid.toLocaleString()} GNF</p></div>
                                    <div className="p-2 bg-red-100 rounded"><p className="text-xs">Solde</p><p className="font-bold text-lg text-red-700">{balance.toLocaleString()} GNF</p></div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-lg">Articles Commandés</h3>
                                <ul className="list-disc pl-5">
                                    {selectedOrder.items.map(item => {
                                        const product = articles.find(a => a.id === item.articleId);
                                        return <li key={item.articleId}>{product?.name} (x{item.quantity})</li>
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                    {activeDetailTab === 'paiements' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Historique des Paiements</h3>
                                <button onClick={() => setIsPaymentModalOpen(true)} className="btn-secondary flex items-center" disabled={balance <= 0}><CurrencyDollarIcon className="h-5 w-5 mr-2"/>Ajouter Paiement</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead><tr><th className="p-2">Date</th><th className="p-2">Montant</th><th className="p-2">Réf. Reçu</th></tr></thead>
                                <tbody>
                                    {selectedOrder.receipts?.map((p, i) => ( <tr key={i} className="border-b"><td className="p-2">{new Date(p.date).toLocaleDateString()}</td><td className="p-2">{p.amount.toLocaleString()} GNF</td><td className="p-2">{p.ref}</td></tr> ))}
                                    {(!selectedOrder.receipts || selectedOrder.receipts.length === 0) && <tr><td colSpan={3} className="text-center p-4">Aucun paiement enregistré.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeDetailTab === 'documents' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-4">Génération de Documents</h3>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openDocument('devis', selectedOrder)} className="btn-secondary">Devis</button>
                                <button onClick={() => openDocument('proforma', selectedOrder)} className="btn-secondary">Facture Proforma</button>
                                <button onClick={() => openDocument('facture', selectedOrder)} className="btn-secondary">Facture</button>
                                <button onClick={() => openDocument('bon', selectedOrder)} className="btn-secondary">Bon de Livraison</button>
                                <button onClick={() => openDocument('recu', selectedOrder)} className="btn-secondary" disabled={!selectedOrder.receipts || selectedOrder.receipts.length === 0}>Dernier Reçu</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-shop-green">PS-SHOP</h1>
                {!selectedOrder && <button onClick={handleClose} className="btn-secondary">Fermer</button>}
            </div>
             {selectedOrder ? renderDetailView() : <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex space-x-2 border-b mb-4">
                    <TabButton tab="dashboard" label="Tableau de Bord" />
                    <TabButton tab="ventes" label="Ventes" />
                    <TabButton tab="produits" label="Produits" />
                </div>
                {activeTab === 'dashboard' && <ShopDashboard orders={shopOrders} articles={articles} clients={clients} itemCategories={itemCategories} />}
                {activeTab === 'ventes' && (
                    <table className="w-full text-left">
                        <thead><tr className="border-b"><th className="p-2">ID Commande</th><th className="p-2">Client</th><th className="p-2">Statut</th><th className="p-2">Total</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {shopOrders.filter(o => !o.isArchived).map(order => {
                                const client = clients.find(c => c.id === order.clientId);
                                return (
                                    <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="p-2 font-mono text-sm">{order.id}</td>
                                        <td>{client?.name || 'Vente au comptoir'}</td>
                                        <td><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></td>
                                        <td>{order.totalAmount.toLocaleString()} GNF</td>
                                        <td onClick={e => e.stopPropagation()}>
                                             {hasPermission(Permission.MANAGE_SHOP_ORDERS) && (
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => { setIsEditing(true); setCurrentItem(order); setNewOrderData(order); setIsOrderModalOpen(true); }} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => { setItemToDelete({ id: order.id, name: `#${order.id}`, type: 'order' }); setIsDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                </div>
                                             )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {activeTab === 'produits' && (
                    <div>
                        <div className="flex justify-end mb-4">
                             {hasPermission(Permission.MANAGE_INVENTAIRE) && <button onClick={openAddProductModal} className="btn-primary bg-shop-green hover:bg-green-700">Ajouter un produit</button>}
                        </div>
                        <table className="w-full text-left">
                            <thead><tr className="border-b"><th className="p-2">Produit</th><th className="p-2">Catégorie</th><th className="p-2">Stock</th><th className="p-2">Prix de vente</th><th className="p-2">Marge Brute</th><th className="p-2">Actions</th></tr></thead>
                            <tbody>
                                {sellableArticles.map(product => (
                                    <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => { setCurrentItem(product); setIsProductDetailModalOpen(true); }}>
                                        <td className="p-2">{product.name}</td>
                                        <td>{itemCategories.find(c => c.id === product.categoryId)?.name || 'N/A'}</td>
                                        <td className={`font-bold ${product.stock <= product.alertThreshold ? 'text-red-500' : ''}`}>{product.stock}</td>
                                        <td>{(product.sellingPrice || 0).toLocaleString()} GNF</td>
                                        <td className="font-semibold text-green-700">{((product.sellingPrice || 0) - product.purchasePrice).toLocaleString()} GNF</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {hasPermission(Permission.MANAGE_INVENTAIRE) && (
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => { setCurrentItem(product); setIsProductDetailModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full" title="Détails"><EyeIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => { setIsEditingArticle(true); setCurrentItem(product); setNewArticleData(product); setIsArticleModalOpen(true); }} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilSquareIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => { setItemToDelete({ id: product.id, name: product.name, type: 'product' }); setIsDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>}

            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={isEditing ? 'Modifier la Vente' : 'Nouvelle Vente'}>
                <form onSubmit={e => { e.preventDefault(); handleFormSubmit(newOrderData); }} className="space-y-4 max-h-[85vh] flex flex-col">
                    <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                        <div className="p-2 border-b">
                            <label className="text-sm">Client</label>
                            <div className="flex items-center space-x-2">
                                <select value={newOrderData.clientId} onChange={e => setNewOrderData({...newOrderData, clientId: e.target.value})} className="input-style flex-grow">
                                    <option value="">-- Vente au comptoir --</option>
                                    {clients.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button type="button" onClick={() => setIsAddClientModalOpen(true)} className="btn-secondary text-sm p-2">+</button>
                            </div>
                        </div>

                        <div className="p-2 border-b">
                            <h4 className="font-semibold mb-2">Ajouter un Article</h4>
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-12 relative">
                                    <label className="text-sm">Rechercher un produit</label>
                                    <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Taper pour rechercher..." className="input-style w-full"/>
                                    {productSearch && <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-40 overflow-y-auto">{filteredSellableArticles.map(a => <div key={a.id} onClick={() => { setItemToAdd({...itemToAdd, articleId: a.id}); setProductSearch(''); }} className="p-2 hover:bg-gray-100 cursor-pointer">{a.name}</div>)}</div>}
                                </div>
                                <div className="col-span-12 flex justify-between text-sm text-gray-500">
                                    <span>Prix: {selectedArticleForAdding?.sellingPrice?.toLocaleString() || 0} GNF</span>
                                    <span className={ (selectedArticleForAdding?.stock || 0) <= (selectedArticleForAdding?.alertThreshold || 0) ? 'text-red-500 font-semibold' : ''}>Stock: {selectedArticleForAdding?.stock || 0}</span>
                                </div>
                                {expirationInfo && (
                                    <div className={`col-span-12 text-sm text-center p-1.5 rounded-md mt-1 ${expirationInfo.bg}`}>
                                        <p className={expirationInfo.className}>
                                            <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-1" />
                                            {expirationInfo.text}
                                        </p>
                                    </div>
                                )}
                                <div className="col-span-4"><label className="text-sm">Qté</label><input type="number" min="1" value={itemToAdd.quantity} onChange={e => setItemToAdd({...itemToAdd, quantity: +e.target.value})} className="input-style"/></div>
                                <div className="col-span-4"><label className="text-sm">Remise/U.</label><input type="number" min="0" value={itemToAdd.discount} onChange={e => setItemToAdd({...itemToAdd, discount: +e.target.value})} className="input-style" placeholder="GNF" /></div>
                                <div className="col-span-4"><button type="button" onClick={handleAddItemToOrder} className="btn-primary bg-shop-green w-full">Ajouter</button></div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2">Panier</h4>
                             <div className="space-y-2 max-h-40 overflow-y-auto">
                                {newOrderData.items.map((item: ShopOrderItem, index: number) => {
                                    const article = sellableArticles.find(s => s.id === item.articleId);
                                    return ( <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            <span className="col-span-5 truncate text-sm">{article?.name}</span>
                                            <input type="number" value={item.quantity} onChange={e => handleUpdateItemInOrder(index, +e.target.value, item.discount || 0)} className="input-style col-span-2 text-center text-sm p-1" />
                                            <input type="number" value={item.discount || 0} onChange={e => handleUpdateItemInOrder(index, item.quantity, +e.target.value)} className="input-style col-span-3 text-right text-sm p-1" />
                                            <span className="col-span-1 text-xs self-center">GNF</span>
                                            <button type="button" onClick={() => { setNewOrderData({...newOrderData, items: newOrderData.items.filter((_: any, i: number) => i !== index)})}} className="text-red-500 hover:text-red-700"><XCircleIcon className="h-5 w-5"/></button>
                                        </div> );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 border-t pt-4 space-y-4">
                        <div className="text-right space-y-1">
                            <p>Sous-total: {subTotal.toLocaleString()} GNF</p>
                            <p className="text-red-500">Remise: {totalDiscount.toLocaleString()} GNF</p>
                            <p className="font-bold text-xl">Total: {totalAmount.toLocaleString()} GNF</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                             <div><label>Statut de la commande</label><select value={newOrderData.status} onChange={e => setNewOrderData({...newOrderData, status: e.target.value})} className="input-style"><option>Devis</option><option>Confirmé</option><option>Payé</option></select></div>
                             <div><label>Montant Payé</label><input type="number" value={newOrderData.amountPaid} onChange={e => setNewOrderData({...newOrderData, amountPaid: +e.target.value})} className="input-style" /></div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2"><button type="submit" className="btn-primary bg-shop-green text-white">{isEditing ? 'Enregistrer' : 'Créer la Vente'}</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isArticleModalOpen} onClose={() => setIsArticleModalOpen(false)} title={isEditingArticle ? "Modifier l'Article" : "Nouvel Article"}>
                 <form onSubmit={handleArticleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Nom</label><input type="text" value={newArticleData.name} onChange={e => setNewArticleData(prev => ({...prev, name: e.target.value}))} className="input-style" required /></div>
                        <div><label>Catégorie</label><select value={newArticleData.categoryId} onChange={e => setNewArticleData(prev => ({...prev, categoryId: e.target.value}))} className="input-style" required>{itemCategories.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label>Prix d'Achat</label><input type="number" value={newArticleData.purchasePrice} onChange={e => setNewArticleData(prev => ({...prev, purchasePrice: +e.target.value}))} className="input-style" required /></div>
                        <div><label>Fournisseur</label><select value={newArticleData.supplierId || ''} onChange={e => setNewArticleData(prev => ({...prev, supplierId: e.target.value}))} className="input-style"><option value="">Aucun</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label>Stock initial</label><input type="number" value={newArticleData.stock} onChange={e => setNewArticleData(prev => ({...prev, stock: +e.target.value}))} className="input-style" required disabled={isEditingArticle} /></div>
                        <div><label>Seuil d'alerte</label><input type="number" value={newArticleData.alertThreshold} onChange={e => setNewArticleData(prev => ({...prev, alertThreshold: +e.target.value}))} className="input-style" required /></div>
                    </div>

                    {(itemCategories.find(c => c.id === newArticleData.categoryId)?.name === 'Alimentaire' || itemCategories.find(c => c.id === newArticleData.categoryId)?.name === 'Cosmétique') && (
                        <div><label>Date de Péremption</label><input type="date" value={newArticleData.datePeremption || ''} onChange={e => setNewArticleData(prev => ({...prev, datePeremption: e.target.value}))} className="input-style"/></div>
                    )}

                    <div className="border-t pt-4 space-y-3">
                         <div className="flex items-center"><input type="checkbox" checked={newArticleData.isSellable} onChange={e => setNewArticleData(prev => ({...prev, isSellable: e.target.checked}))} className="h-4 w-4 rounded" id="isSellable"/><label htmlFor="isSellable" className="ml-2">Cet article est vendable</label></div>
                         {newArticleData.isSellable && <div><label>Prix de Vente</label><input type="number" value={newArticleData.sellingPrice || ''} onChange={e => setNewArticleData(prev => ({...prev, sellingPrice: +e.target.value}))} className="input-style" /></div>}
                         <div className="flex items-center"><input type="checkbox" checked={newArticleData.isConsumable} onChange={e => setNewArticleData(prev => ({...prev, isConsumable: e.target.checked}))} className="h-4 w-4 rounded" id="isConsumable"/><label htmlFor="isConsumable" className="ml-2">Cet article est un consommable</label></div>
                         {newArticleData.isConsumable && <div><label>Unité de consommation</label><input type="text" value={newArticleData.consumptionUnit || ''} onChange={e => setNewArticleData(prev => ({...prev, consumptionUnit: e.target.value}))} className="input-style" /></div>}
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsArticleModalOpen(false)} className="btn-secondary mr-2">Annuler</button><button type="submit" className="btn-primary bg-shop-green">{isEditingArticle ? 'Enregistrer' : 'Ajouter'}</button></div>
                </form>
            </Modal>
            
             <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Ajouter un paiement pour la Vente #${selectedOrder?.id}`}>
                 <form onSubmit={e => {e.preventDefault(); handlePaymentSubmit()}} className="space-y-4">
                     <div><label>Montant</label><input type="number" value={newPaymentData.amount} onChange={e=>setNewPaymentData({ amount: +e.target.value })} className="input-style" required/></div>
                     <div className="flex justify-end"><button type="submit" className="btn-primary bg-green-600">Enregistrer</button></div>
                 </form>
            </Modal>
            
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onClientAdded={(client) => { setClients(prev => [client, ...prev]); setNewOrderData({...newOrderData, clientId: client.id}); }} />

            {currentItem && currentItem.hasOwnProperty('isSellable') && <ProductDetailModal isOpen={isProductDetailModalOpen} onClose={() => setIsProductDetailModalOpen(false)} article={currentItem} readOnly={!hasPermission(Permission.MANAGE_INVENTAIRE)} shopOrders={shopOrders} clients={clients} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={()=>{}} title="Générer Rapport PS-SHOP" />
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
        </div>
    );
};

export default Shop;
