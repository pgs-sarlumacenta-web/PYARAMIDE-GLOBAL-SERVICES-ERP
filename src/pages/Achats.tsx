
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { PurchaseOrder, Supplier, Article, Permission, StockMovement, PurchaseOrderItem } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import DocumentViewer from '../components/DocumentViewer.tsx';
import ReportModal from '../components/ReportModal.tsx';
import BonCommande from '../components/achats/BonCommande.tsx';
import BonReception from '../components/achats/BonReception.tsx';
import AchatsDashboard from '../components/achats/AchatsDashboard.tsx';
import AchatsReport from '../components/achats/AchatsReport.tsx';
import SupplierDebtsReport from '../components/achats/SupplierDebtsReport.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, ChartPieIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../context/AlertContext.tsx';

type Tab = 'dashboard' | 'commandes' | 'fournisseurs';

const initialSupplierState: Omit<Supplier, 'id'> = { name: '', contact: '', email: '', address: '' };
const initialOrderState: Omit<PurchaseOrder, 'id'> = { supplierId: '', orderDate: new Date().toISOString().split('T')[0], items: [], totalAmount: 0, status: 'Brouillon' };

const getStatusClass = (status: PurchaseOrder['status']) => {
    const classes: { [key in PurchaseOrder['status']]: string } = {
        'Brouillon': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        'Commandé': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Reçu': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Annulé': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return classes[status];
};

const Achats: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { showAlert } = useAlert();
    const { setFabConfig } = useFab();
    const {
        suppliers, setSuppliers,
        purchaseOrders, setPurchaseOrders,
        articles, setArticles,
        itemCategories,
        setStockMovements,
        companyProfile,
        addLogEntry
    } = useData();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'supplier' | 'order' } | null>(null);

    const [newSupplierData, setNewSupplierData] = useState(initialSupplierState);
    const [newOrderData, setNewOrderData] = useState<Omit<PurchaseOrder, 'id'>>(initialOrderState);
    const [itemToAdd, setItemToAdd] = useState<{ articleId: string, quantity: number, purchasePrice: number }>({ articleId: '', quantity: 1, purchasePrice: 0 });

    const [documentContent, setDocumentContent] = useState<React.ReactNode>(null);
    const [documentTitle, setDocumentTitle] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'payables'>('all');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('filter') === 'payables') {
            setActiveTab('commandes');
            setActiveFilter('payables');
            navigate('/achats', { replace: true });
        }
    }, [location, navigate]);

     useEffect(() => {
        const state = location.state as { selectedId?: string, type?: 'order' | 'supplier' };
        if (state?.selectedId && state?.type) {
            let item;
            if (state.type === 'order') {
                item = purchaseOrders.find(o => o.id === state.selectedId);
                if (item) {
                    setSelectedOrder(item);
                    setActiveTab('commandes');
                }
            } else if (state.type === 'supplier') {
                item = suppliers.find(s => s.id === state.selectedId);
                if (item) {
                    setSelectedSupplier(item);
                    setActiveTab('fournisseurs');
                }
            }
            if (item) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, purchaseOrders, suppliers, navigate]);

    useEffect(() => {
        const totalAmount = newOrderData.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
        setNewOrderData(prev => ({ ...prev, totalAmount }));
    }, [newOrderData.items]);
    
    useEffect(() => {
        const article = articles.find(a => a.id === itemToAdd.articleId);
        if (article) {
            setItemToAdd(prev => ({ ...prev, purchasePrice: article.purchasePrice }));
        }
    }, [itemToAdd.articleId, articles]);

    const openAddSupplierModal = useCallback(() => { setIsEditing(false); setNewSupplierData(initialSupplierState); setIsSupplierModalOpen(true); }, []);
    const openAddOrderModal = useCallback(() => {
        setIsEditing(false);
        const firstSupplier = suppliers.find(s => !s.isArchived);
        const firstArticle = articles.find(a => !a.isArchived);
        setNewOrderData({ ...initialOrderState, supplierId: firstSupplier?.id || '' });
        setItemToAdd({ articleId: firstArticle?.id || '', quantity: 1, purchasePrice: firstArticle?.purchasePrice || 0 });
        setIsOrderModalOpen(true);
    }, [suppliers, articles]);

    useEffect(() => {
        if (selectedOrder || selectedSupplier) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'fournisseurs' && hasPermission(Permission.MANAGE_SUPPLIERS)) config = { onClick: openAddSupplierModal, title: "Nouveau Fournisseur" };
        else if (activeTab === 'commandes' && hasPermission(Permission.MANAGE_PURCHASE_ORDERS)) config = { onClick: openAddOrderModal, title: "Nouvelle Commande" };
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedOrder, selectedSupplier, hasPermission, setFabConfig, openAddSupplierModal, openAddOrderModal]);

    const handleSupplierSubmit = () => {
        if (isEditing && currentItem) {
            setSuppliers(prev => prev.map(s => s.id === currentItem.id ? { ...newSupplierData, id: s.id } : s));
            addLogEntry('Modification', `A modifié le fournisseur ${newSupplierData.name}`, 'supplier', currentItem.id);
        } else {
            const newId = `SUP-${Date.now()}`;
            setSuppliers(prev => [{ ...newSupplierData, id: newId }, ...prev]);
            addLogEntry('Création', `A créé le fournisseur ${newSupplierData.name}`, 'supplier', newId);
        }
        setIsSupplierModalOpen(false);
    };
    
    const handleOrderSubmit = () => {
        if (isEditing && currentItem) {
            setPurchaseOrders(prev => prev.map(po => po.id === currentItem.id ? { ...newOrderData, id: po.id } as PurchaseOrder : po));
            addLogEntry('Modification', `A modifié la commande ${currentItem.id}`, 'purchaseOrder', currentItem.id);
        } else {
            const newId = `PO-${Date.now()}`;
            const newOrder = { ...newOrderData, id: newId } as PurchaseOrder;
            setPurchaseOrders(prev => [newOrder, ...prev]);
            addLogEntry('Création', `A créé la commande ${newId}`, 'purchaseOrder', newId);
        }
        setIsOrderModalOpen(false);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        
        if (type === 'supplier') {
            const isUsed = purchaseOrders.some(po => po.supplierId === id && !po.isArchived);
            if(isUsed) {
                showAlert("Action impossible", "Ce fournisseur est lié à au moins une commande et ne peut pas être archivé.");
                setIsDeleteModalOpen(false);
                return;
            }
            setSuppliers(prev => prev.map(s => s.id === id ? {...s, isArchived: true} : s));
            addLogEntry('Archivage', `A archivé le fournisseur ${name}`, 'supplier', id);
        } else {
             setPurchaseOrders(prev => prev.map(po => po.id === id ? {...po, isArchived: true} : po));
             addLogEntry('Archivage', `A archivé la commande ${name}`, 'purchaseOrder', id);
        }

        setIsDeleteModalOpen(false);
        showAlert("Succès", "Élément archivé.");
    };
    
    const handleStatusChange = (orderId: string, newStatus: PurchaseOrder['status']) => {
        setPurchaseOrders(prev => prev.map(order => {
            if (order.id === orderId && order.status !== newStatus) {
                const updatedOrder = {...order, status: newStatus};
                addLogEntry("Modification Statut", `Statut de la commande #${order.id} changé à ${newStatus}`, 'purchaseOrder', order.id);

                if (order.status !== 'Reçu' && newStatus === 'Reçu') {
                    updatedOrder.receptionDate = new Date().toISOString();
    
                    setArticles(prevArticles => {
                        const newMovements: StockMovement[] = [];
                        const updatedArticles = prevArticles.map(article => {
                            const itemInOrder = order.items.find(i => i.articleId === article.id);
                            if (itemInOrder) {
                                newMovements.push({
                                    id: `SM-IN-${order.id}-${article.id}`, date: new Date().toISOString(),
                                    itemId: article.id, itemType: 'article', type: 'IN',
                                    quantity: itemInOrder.quantity, reason: `Achat #${order.id}`
                                });
                                return { ...article, stock: article.stock + itemInOrder.quantity };
                            }
                            return article;
                        });
                        setStockMovements(prevMovements => [...prevMovements, ...newMovements]);
                        return updatedArticles;
                    });
                    showAlert('Stock mis à jour', 'Le stock a été mis à jour suite à la réception de la commande.');
                }
                
                if (selectedOrder?.id === order.id) setSelectedOrder(updatedOrder);
                return updatedOrder;
            }
            return order;
        }));
    };

    const openDocument = (type: 'commande' | 'reception', order: PurchaseOrder) => {
        if (type === 'commande') {
            setDocumentTitle(`Bon de Commande ${order.id}`);
            setDocumentContent(<BonCommande purchaseOrder={order} suppliers={suppliers} articles={articles} companyProfile={companyProfile} />);
        } else if (type === 'reception') {
            if (order.status !== 'Reçu') {
                showAlert("Action impossible", "Un bon de réception ne peut être généré que pour une commande reçue.");
                return;
            }
            setDocumentTitle(`Bon de Réception ${order.id}`);
            setDocumentContent(<BonReception purchaseOrder={order} suppliers={suppliers} articles={articles} companyProfile={companyProfile} />);
        }
        setIsDocumentModalOpen(true);
    };
    
    const filteredOrders = useMemo(() => {
        let orders = purchaseOrders.filter(o => !o.isArchived);

        if (activeFilter === 'payables') {
            orders = orders.filter(o => o.status === 'Commandé');
        }

        if (!searchTerm) return orders;

        const lowerTerm = searchTerm.toLowerCase();
        return orders.filter(o => {
            const supplier = suppliers.find(s => s.id === o.supplierId);
            return (
                o.id.toLowerCase().includes(lowerTerm) ||
                (supplier && supplier.name.toLowerCase().includes(lowerTerm))
            );
        });
    }, [purchaseOrders, suppliers, searchTerm, activeFilter]);

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers.filter(s => !s.isArchived);
        const lowerTerm = searchTerm.toLowerCase();
        return suppliers.filter(s => !s.isArchived && s.name.toLowerCase().includes(lowerTerm));
    }, [suppliers, searchTerm]);

    const handleExport = (type: 'orders' | 'suppliers') => {
        let dataToExport: any[] = [];
        let fileName = '';

        if (type === 'orders') {
            if (filteredOrders.length === 0) {
                showAlert('Information', 'Aucune commande à exporter.');
                return;
            }
            dataToExport = filteredOrders.map(order => {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                return {
                    'ID Commande': order.id,
                    'Fournisseur': supplier?.name || 'N/A',
                    'Date': new Date(order.orderDate).toLocaleDateString('fr-CA'),
                    'Date Réception': order.receptionDate ? new Date(order.receptionDate).toLocaleDateString('fr-CA') : '',
                    'Montant Total': order.totalAmount,
                    'Statut': order.status,
                };
            });
            fileName = 'commandes_achats';
        } else if (type === 'suppliers') {
            if (filteredSuppliers.length === 0) {
                showAlert('Information', 'Aucun fournisseur à exporter.');
                return;
            }
            dataToExport = filteredSuppliers.map(s => ({
                'Nom': s.name,
                'Contact': s.contact,
                'Email': s.email,
                'Adresse': s.address,
            }));
            fileName = 'fournisseurs';
        }

        if (dataToExport.length === 0) {
            showAlert('Information', 'Aucune donnée à exporter.');
            return;
        }

        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(';'),
            ...dataToExport.map(row => 
                headers.map(header => {
                    let value = row[header as keyof typeof row];
                    if (typeof value === 'string' && value.includes(';')) {
                        return `"${value}"`;
                    }
                    return value;
                }).join(';')
            )
        ].join('\n');
    
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (<button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-achats-purple text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button>);

    const renderOrderDetailView = () => {
        if (!selectedOrder) return null;
        const supplier = suppliers.find(s => s.id === selectedOrder.supplierId);

        return (
            <div className="animate-fade-in">
                <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                    <div>
                        <h2 className="text-3xl font-bold">Commande #{selectedOrder.id}</h2>
                        <p className="text-gray-500">Fournisseur: {supplier?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Détails</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> {selectedOrder.totalAmount.toLocaleString()} GNF</p>
                            <div><label><strong>Statut:</strong></label>
                            <select value={selectedOrder.status} onChange={e => handleStatusChange(selectedOrder.id, e.target.value as any)} className="input-style ml-2" disabled={selectedOrder.status === 'Reçu' || !hasPermission(Permission.MANAGE_PURCHASE_ORDERS)}><option>Brouillon</option><option>Commandé</option><option>Reçu</option><option>Annulé</option></select>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Articles</h3>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2">Article</th><th className="p-2">Qté</th><th className="p-2">P.U. Achat</th><th className="p-2 text-right">Total</th></tr></thead>
                            <tbody>
                                {selectedOrder.items.map(item => {
                                    const article = articles.find(a => a.id === item.articleId);
                                    return <tr key={item.articleId} className="border-b"><td>{article?.name}</td><td>{item.quantity}</td><td>{item.purchasePrice.toLocaleString()} GNF</td><td className="text-right">{(item.quantity*item.purchasePrice).toLocaleString()} GNF</td></tr>
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => openDocument('commande', selectedOrder)} className="btn-secondary">Bon de Commande</button>
                        <button onClick={() => openDocument('reception', selectedOrder)} className="btn-secondary" disabled={selectedOrder.status !== 'Reçu'}>Bon de Réception</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderSupplierDetailView = () => {
        if (!selectedSupplier) return null;
        const supplierOrders = purchaseOrders.filter(po => po.supplierId === selectedSupplier.id && !po.isArchived);
        const totalSpent = supplierOrders.reduce((sum, po) => sum + po.totalAmount, 0);

        return (
            <div className="animate-fade-in">
                <div className="flex items-center space-x-4 mb-6"><button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                    <div><h2 className="text-3xl font-bold">{selectedSupplier.name}</h2><p className="text-gray-500">{selectedSupplier.email}</p></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm">Total Dépensé</p><p className="text-2xl font-bold">{totalSpent.toLocaleString()} GNF</p></div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-sm">Commandes Passées</p><p className="text-2xl font-bold">{supplierOrders.length}</p></div>
                    </div>
                    <div><h3 className="text-lg font-semibold mb-2">Historique des Commandes</h3>
                         <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2">Date</th><th className="p-2">Total</th><th className="p-2">Statut</th></tr></thead>
                            <tbody>
                                {supplierOrders.map(order => <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => { setSelectedSupplier(null); setSelectedOrder(order); }}><td>{new Date(order.orderDate).toLocaleDateString()}</td><td>{order.totalAmount.toLocaleString()} GNF</td><td><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    const handleClose = () => navigate('/dashboard');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-achats-purple">Gestion des Achats</h1>
                {!selectedOrder && !selectedSupplier && (
                    <button onClick={handleClose} className="btn-secondary">Fermer</button>
                )}
            </div>
            {selectedOrder ? renderOrderDetailView() : selectedSupplier ? renderSupplierDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4">
                        <TabButton tab="dashboard" label="Tableau de Bord" />
                        <TabButton tab="commandes" label="Commandes" />
                        <TabButton tab="fournisseurs" label="Fournisseurs" />
                    </div>
                    {activeTab === 'dashboard' && <AchatsDashboard purchaseOrders={purchaseOrders} suppliers={suppliers} articles={articles} itemCategories={itemCategories} />}
                    {activeTab === 'commandes' && (
                        <div>
                            {activeFilter === 'payables' && (
                                <div className="mb-4 flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/50 p-3 rounded-lg">
                                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">Affichage des commandes en attente de paiement (dettes fournisseurs).</p>
                                    <div>
                                        <button onClick={() => {
                                             setDocumentTitle("Rapport des Dettes Fournisseurs");
                                             setDocumentContent(<SupplierDebtsReport payableOrders={filteredOrders} suppliers={suppliers} companyProfile={companyProfile} />);
                                             setIsDocumentModalOpen(true);
                                        }} className="btn-secondary btn-sm mr-2">Télécharger la liste (PDF)</button>
                                        <button onClick={() => setActiveFilter('all')} className="text-sm hover:underline text-gray-600 dark:text-gray-300">Afficher toutes les commandes</button>
                                    </div>
                                </div>
                            )}
                            <div className="mb-4 flex space-x-2"><div className="relative flex-grow"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Rechercher par ID ou fournisseur..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full max-w-sm pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700"/></div><button onClick={() => handleExport('orders')} className="btn-secondary flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Exporter (CSV)</button></div>
                            <table className="w-full text-left">
                                <thead><tr className="border-b"><th className="p-2">Fournisseur</th><th className="p-2">Date</th><th className="p-2">Total</th><th className="p-2">Statut</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                            <td>{suppliers.find(s => s.id === order.supplierId)?.name}</td><td>{new Date(order.orderDate).toLocaleDateString()}</td><td>{order.totalAmount.toLocaleString()} GNF</td>
                                            <td><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></td>
                                            <td className="flex items-center space-x-1" onClick={e=>e.stopPropagation()}>
                                                <button onClick={() => openDocument('commande', order)} className="p-1"><DocumentTextIcon className="h-5 w-5"/></button>
                                                <button onClick={() => { setIsEditing(true); setCurrentItem(order); setNewOrderData(order); setIsOrderModalOpen(true); }} className="p-1"><PencilIcon className="h-5 w-5"/></button>
                                                <button onClick={() => { setItemToDelete({id: order.id, name: `#${order.id}`, type: 'order'}); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'fournisseurs' && (
                         <div>
                            <div className="mb-4 flex space-x-2"><div className="relative flex-grow"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Rechercher par nom..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full max-w-sm pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700"/></div><button onClick={() => handleExport('suppliers')} className="btn-secondary flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Exporter (CSV)</button></div>
                             <table className="w-full text-left">
                                <thead><tr className="border-b"><th className="p-2">Nom</th><th className="p-2">Contact</th><th className="p-2">Email</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>
                                    {filteredSuppliers.map(s => (
                                        <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedSupplier(s)}>
                                            <td>{s.name}</td><td>{s.contact}</td><td>{s.email}</td>
                                            <td className="flex items-center space-x-1" onClick={e=>e.stopPropagation()}>
                                                <button onClick={() => { setIsEditing(true); setCurrentItem(s); setNewSupplierData(s); setIsSupplierModalOpen(true); }} className="p-1"><PencilIcon className="h-5 w-5"/></button>
                                                <button onClick={() => { setItemToDelete({id: s.id, name: s.name, type: 'supplier'}); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={isEditing ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}>
                <form onSubmit={e => {e.preventDefault(); handleSupplierSubmit()}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input type="text" placeholder="Nom" value={newSupplierData.name} onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contact</label>
                        <input type="text" placeholder="Contact" value={newSupplierData.contact} onChange={e => setNewSupplierData({...newSupplierData, contact: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" placeholder="Email" value={newSupplierData.email} onChange={e => setNewSupplierData({...newSupplierData, email: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Adresse</label>
                        <input type="text" placeholder="Adresse" value={newSupplierData.address} onChange={e => setNewSupplierData({...newSupplierData, address: e.target.value})} className="input-style"/>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-achats-purple">{isEditing ? 'Enregistrer' : 'Ajouter'}</button></div>
                </form>
            </Modal>

            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={isEditing ? 'Modifier Commande' : 'Nouvelle Commande'}>
                 <form onSubmit={e => {e.preventDefault(); handleOrderSubmit()}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fournisseur</label>
                        <select value={newOrderData.supplierId} onChange={e => setNewOrderData({...newOrderData, supplierId: e.target.value})} className="input-style" required>{suppliers.filter(s=>!s.isArchived).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                    <div className="border p-2 rounded-md">
                        <div className="grid grid-cols-10 gap-2 items-end">
                            <div className="col-span-4"><label className="text-sm font-medium">Article</label><select value={itemToAdd.articleId} onChange={e=>setItemToAdd({...itemToAdd, articleId: e.target.value})} className="input-style">{articles.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                            <div className="col-span-2"><label className="text-sm font-medium">Qté</label><input type="number" min="1" value={itemToAdd.quantity} onChange={e=>setItemToAdd({...itemToAdd, quantity: +e.target.value})} className="input-style"/></div>
                            <div className="col-span-2"><label className="text-sm font-medium">Prix Achat/U</label><input type="number" value={itemToAdd.purchasePrice} onChange={e=>setItemToAdd({...itemToAdd, purchasePrice: +e.target.value})} className="input-style"/></div>
                            <button type="button" onClick={()=>{setNewOrderData(prev => ({...prev, items: [...prev.items, itemToAdd]}))}} className="btn-primary bg-achats-purple col-span-2">Ajouter</button>
                        </div>
                    </div>
                    {newOrderData.items.length > 0 && <div className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded-md">
                        {newOrderData.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                <span className="text-sm font-medium">{articles.find(a=>a.id===item.articleId)?.name} x {item.quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setNewOrderData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}
                                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                    aria-label="Supprimer l'article"
                                >
                                    <XCircleIcon className="h-5 w-5 text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>}
                     <div className="text-right"><p className="text-sm">Total:</p><p className="font-bold text-xl">{newOrderData.totalAmount.toLocaleString()} GNF</p></div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-achats-purple">{isEditing ? 'Enregistrer' : 'Créer'}</button></div>
                </form>
            </Modal>
            
            <DocumentViewer isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title={documentTitle}>{documentContent}</DocumentViewer>
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />
        </div>
    );
};

export default Achats;
