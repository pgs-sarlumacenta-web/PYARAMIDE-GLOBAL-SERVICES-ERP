
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { DecorOrder, DecorService, Client, Article, Transaction, Permission, DecorServiceOrderItem, DecorServiceArticle, DecorOrderStatus, StockMovement } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import AddClientModal from '../components/AddClientModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon, ArrowLeftIcon, BanknotesIcon, BellAlertIcon, XCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ReportModal from '../components/ReportModal.tsx';
import DevisDecor from '../components/decor/DevisDecor.tsx';
import FactureProformaDecor from '../components/decor/FactureProformaDecor.tsx';
import FactureDecor from '../components/decor/FactureDecor.tsx';
import BonLivraisonDecor from '../components/decor/BonLivraisonDecor.tsx';
import RecuDecor from '../components/decor/RecuDecor.tsx';
import RappelPaiementDecor from '../components/decor/RappelPaiementDecor.tsx';
import DecorDashboard from '../components/decor/DecorStats.tsx';
import DecorReport from '../components/decor/DecorReport.tsx';
// FIX: Imported missing ContratDecor component.
import ContratDecor from '../components/decor/ContratDecor.tsx';

type Tab = 'dashboard' | 'commandes' | 'services';
type DetailTab = 'dashboard' | 'paiements' | 'documents';

const initialOrderState: Omit<DecorOrder, 'id' | 'devisRef' | 'proformaRef' | 'factureRef' | 'bonRef'> = {
    description: '',
    clientId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    items: [],
    subTotal: 0,
    discount: 0,
    totalAmount: 0,
    amountPaid: 0,
    status: 'Devis',
    receipts: []
};

const initialServiceState: Omit<DecorService, 'id'> = { name: '', price: 0, description: '', articles: [] };

const getStatusClass = (status: DecorOrder['status']) => {
    const classes: { [key in DecorOrder['status']]: string } = {
        'Devis': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        'Confirmé': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'En cours': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Terminé': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Livré': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Annulé': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'Payé': 'bg-teal-200 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'
    };
    return classes[status];
};


const Decor: React.FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const {
        decorOrders, setDecorOrders,
        decorServices, setDecorServices,
        clients, setClients,
        articles, setArticles,
        setTransactions,
        companyProfile,
        billingSettings, setBillingSettings,
        addLogEntry,
        setStockMovements
    } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [selectedOrder, setSelectedOrder] = useState<DecorOrder | null>(null);
    const [selectedService, setSelectedService] = useState<DecorService | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('dashboard');

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
    const [newOrderData, setNewOrderData] = useState<any>(initialOrderState);
    const [newServiceData, setNewServiceData] = useState<any>(initialServiceState);
    const [newPaymentData, setNewPaymentData] = useState({ amount: 0 });
    const [serviceArticleToAdd, setServiceArticleToAdd] = useState<DecorServiceArticle>({ articleId: '', quantity: 1 });
    const [itemToAdd, setItemToAdd] = useState<{ serviceId: string, quantity: number }>({ serviceId: '', quantity: 1 });


    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    const consumables = useMemo(() => articles.filter(a => a.isConsumable && !a.isArchived), [articles]);

    const orderSubTotal = useMemo(() => {
      return newOrderData.items.reduce((sum: number, item: DecorServiceOrderItem) => {
        const service = decorServices.find(s => s.id === item.serviceId);
        return sum + (service ? service.price * item.quantity : 0);
      }, 0);
    }, [newOrderData.items, decorServices]);
  
    const orderTotalAmount = useMemo(() => {
      return orderSubTotal - (newOrderData.discount || 0);
    }, [orderSubTotal, newOrderData.discount]);

    useEffect(() => {
        if (isServiceModalOpen && consumables.length > 0 && !serviceArticleToAdd.articleId) {
            setServiceArticleToAdd(prev => ({ ...prev, articleId: consumables[0].id }));
        }
    }, [isServiceModalOpen, consumables, serviceArticleToAdd.articleId]);

    const handleAddArticleToService = () => {
        if (serviceArticleToAdd.articleId && serviceArticleToAdd.quantity > 0) {
            setNewServiceData((prev: DecorService) => ({
                ...prev,
                articles: [...prev.articles, serviceArticleToAdd]
            }));
            const firstConsumable = consumables[0];
            setServiceArticleToAdd({ articleId: firstConsumable?.id || '', quantity: 1 });
        }
    };

    const handleRemoveArticleFromService = (index: number) => {
        setNewServiceData((prev: DecorService) => ({
            ...prev,
            articles: prev.articles.filter((_, i) => i !== index)
        }));
    };
    
    const handleAddItemToOrder = () => {
        if (itemToAdd.serviceId && itemToAdd.quantity > 0) {
            setNewOrderData((prev: any) => {
                const existingItemIndex = prev.items.findIndex((i: DecorServiceOrderItem) => i.serviceId === itemToAdd.serviceId);
                let newItems;
                if (existingItemIndex > -1) {
                    newItems = [...prev.items];
                    newItems[existingItemIndex].quantity += itemToAdd.quantity;
                } else {
                    newItems = [...prev.items, itemToAdd];
                }
                return { ...prev, items: newItems };
            });
            const firstService = decorServices.find(s => !s.isArchived);
            if (firstService) {
                setItemToAdd({ serviceId: firstService.id, quantity: 1 });
            }
        }
    };

    const openAddOrderModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        const firstClient = clients.find(c => !c.isArchived);
        const firstService = decorServices.find(s => !s.isArchived);
        setNewOrderData({ ...initialOrderState, clientId: firstClient?.id || '' });
        if (firstService) {
            setItemToAdd({ serviceId: firstService.id, quantity: 1 });
        }
        setIsOrderModalOpen(true);
    }, [clients, decorServices]);

    const openAddServiceModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewServiceData(initialServiceState);
        setIsServiceModalOpen(true);
    }, []);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_DECOR) || selectedOrder || selectedService) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'commandes') {
            config = { onClick: openAddOrderModal, title: "Nouvelle Commande" };
        } else if (activeTab === 'services') {
            config = { onClick: openAddServiceModal, title: "Nouveau Service" };
        }
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedOrder, selectedService, hasPermission, setFabConfig, openAddOrderModal, openAddServiceModal]);

    const handleClose = () => navigate('/dashboard');
    
    const handleFormSubmit = (type: 'order' | 'service', data: any) => {
        const action = isEditing ? 'Modification' : 'Création';

        if (type === 'order') {
            const finalData = { ...data, subTotal: orderSubTotal, totalAmount: orderTotalAmount };

            if (isEditing && currentItem) {
                const updatedOrder = { ...finalData, id: currentItem.id };
                setDecorOrders(prev => prev.map(o => o.id === currentItem.id ? updatedOrder : o));
                if (selectedOrder?.id === currentItem.id) setSelectedOrder(updatedOrder);
                addLogEntry(action, `A modifié la commande ${data.description}`, 'decorOrder', currentItem.id);
            } else {
                const newId = `DO-${Date.now()}`;
                const newOrder: DecorOrder = { ...finalData, id: newId };
                setDecorOrders(prev => [newOrder, ...prev]);
                addLogEntry(action, `A créé la commande ${data.description}`, 'decorOrder', newId);
            }
            setIsOrderModalOpen(false);
        } else if (type === 'service') {
            if (isEditing && currentItem) {
                const updatedService = { ...data, id: currentItem.id };
                setDecorServices(prev => prev.map(s => s.id === currentItem.id ? updatedService : s));
                addLogEntry(action, `A modifié le service ${data.name}`, 'decorService', currentItem.id);
            } else {
                const newId = `DS-${Date.now()}`;
                setDecorServices(prev => [{ ...data, id: newId }, ...prev]);
                addLogEntry(action, `A créé le service ${data.name}`, 'decorService', newId);
            }
            setIsServiceModalOpen(false);
        }
        showAlert('Succès', `${isEditing ? 'Modification' : 'Ajout'} effectué avec succès.`);
    };

    const handlePaymentSubmit = () => {
        if (!selectedOrder || newPaymentData.amount <= 0) return;

        const newReceiptRef = `${billingSettings.receiptPrefix}DEC-${billingSettings.receiptNextNumber}`;
        const newReceipt = { amount: newPaymentData.amount, date: new Date().toISOString(), ref: newReceiptRef };
        
        let newStatus: DecorOrderStatus = selectedOrder.status;
        const newAmountPaid = selectedOrder.amountPaid + newPaymentData.amount;
        if(newAmountPaid >= selectedOrder.totalAmount) {
            newStatus = 'Payé';
        }

        const updatedOrder = {
            ...selectedOrder,
            amountPaid: newAmountPaid,
            receipts: [...(selectedOrder.receipts || []), newReceipt],
            status: newStatus
        };

        setDecorOrders(orders => orders.map(p => p.id === selectedOrder.id ? updatedOrder : p));
        setSelectedOrder(updatedOrder);
        setBillingSettings(prev => ({...prev, receiptNextNumber: prev.receiptNextNumber + 1}));
        
        const newTransaction: Transaction = {
            id: `T_DEC_${selectedOrder.id}_${Date.now()}`,
            date: new Date().toISOString(),
            department: 'Décor',
            description: `Paiement commande: ${selectedOrder.description}`,
            amount: newPaymentData.amount,
            type: 'Revenu',
        };
        setTransactions(prev => [newTransaction, ...prev]);
        addLogEntry('Paiement', `A enregistré un paiement de ${newPaymentData.amount.toLocaleString()} GNF pour la commande ${selectedOrder.description}`, 'decorOrder', selectedOrder.id);
        
        showAlert('Succès', `Paiement de ${newPaymentData.amount.toLocaleString()} GNF enregistré.`);
        setIsPaymentModalOpen(false);
        setNewPaymentData({ amount: 0 });
    };

    const handleStatusChange = (orderId: string, newStatus: DecorOrderStatus) => {
        setDecorOrders(prevOrders => prevOrders.map(order => {
            if (order.id === orderId && order.status !== newStatus) {
                const updatedOrder = { ...order, status: newStatus };
                addLogEntry("Modification Statut", `Statut de la commande #${order.id} changé à ${newStatus}`, 'decorOrder', order.id);

                if (order.status !== 'Livré' && newStatus === 'Livré') {
                    setArticles(prevArticles => {
                        // FIX: Explicitly type `newMovements` and `articlesToUpdate` to resolve type inference issues.
                        const newMovements: StockMovement[] = [];
                        const articlesToUpdate: Map<string, Article> = new Map(prevArticles.map(a => [a.id, {...a}]));
                        
                        order.items.forEach(orderItem => {
                            const service = decorServices.find(s => s.id === orderItem.serviceId);
                            if(service) {
                                service.articles.forEach(serviceArticle => {
                                    const article = articlesToUpdate.get(serviceArticle.articleId);
                                    if (article) {
                                        const quantityToDeduct = serviceArticle.quantity * orderItem.quantity;
                                        article.stock -= quantityToDeduct;
                                        newMovements.push({
                                            id: `SM-OUT-${order.id}-${article.id}`, date: new Date().toISOString(),
                                            itemId: article.id, itemType: 'article', type: 'OUT',
                                            quantity: quantityToDeduct, reason: `Commande Décor #${order.id}`
                                        });
                                    }
                                });
                            }
                        });
                        
                        setStockMovements(prevMovements => [...prevMovements, ...newMovements]);
                        return Array.from(articlesToUpdate.values());
                    });

                    showAlert("Stock mis à jour", "Le stock de consommables a été déduit pour cette commande.");
                }

                if (selectedOrder?.id === order.id) setSelectedOrder(updatedOrder);
                return updatedOrder;
            }
            return order;
        }));
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        const archive = (setter: Function) => setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isArchived: true } : item));
        
        if (type === 'order') {
            archive(setDecorOrders);
            addLogEntry('Archivage', `A archivé la commande ${name}`, 'decorOrder', id);
        } else if (type === 'service') {
            archive(setDecorServices);
            addLogEntry('Archivage', `A archivé le service ${name}`, 'decorService', id);
            if (selectedService?.id === id) setSelectedService(null);
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        showAlert('Succès', 'Élément archivé.');
    };

    const orderDetails = useMemo(() => {
        if (!selectedOrder) return null;
        const client = clients.find(c => c.id === selectedOrder.clientId);
        const orderServices = selectedOrder.items.map(item => {
            return {
                ...decorServices.find(s => s.id === item.serviceId),
                quantity: item.quantity
            }
        }).filter(s => s.id);
        return { client, orderServices };
    }, [selectedOrder, clients, decorServices]);
    
    const openDocument = (type: 'devis' | 'proforma' | 'facture' | 'bon' | 'recu' | 'rappel' | 'contrat') => {
        if (!selectedOrder || !orderDetails) return;
        let order = {...selectedOrder};
        const { client, orderServices } = orderDetails;

        if (!client) return showAlert("Erreur", "Client non trouvé pour cette commande.");

        const updateOrderState = (updatedOrder: DecorOrder) => {
            setDecorOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            setSelectedOrder(updatedOrder);
            order = updatedOrder;
        };

        if (type === 'devis' && !order.devisRef) {
            const devisRef = `${billingSettings.quotePrefix}DEC-${billingSettings.quoteNextNumber}`;
            updateOrderState({ ...order, devisRef });
            setBillingSettings(prev => ({ ...prev, quoteNextNumber: prev.quoteNextNumber + 1 }));
        } else if (type === 'proforma' && !order.proformaRef) {
            const proformaRef = `${billingSettings.proformaPrefix}DEC-${billingSettings.proformaNextNumber}`;
            updateOrderState({ ...order, proformaRef });
            setBillingSettings(prev => ({ ...prev, proformaNextNumber: prev.proformaNextNumber + 1 }));
        } else if (type === 'facture' && !order.factureRef) {
            const factureRef = `${billingSettings.invoicePrefix}DEC-${billingSettings.invoiceNextNumber}`;
            updateOrderState({ ...order, factureRef });
            setBillingSettings(prev => ({ ...prev, invoiceNextNumber: prev.invoiceNextNumber + 1 }));
        } else if (type === 'bon' && !order.bonRef) {
            const bonRef = `${billingSettings.deliveryNotePrefix}DEC-${billingSettings.deliveryNoteNextNumber}`;
            updateOrderState({ ...order, bonRef });
            setBillingSettings(prev => ({ ...prev, deliveryNoteNextNumber: prev.deliveryNoteNextNumber + 1 }));
        }

        let docContent: React.ReactNode = null;
        let docTitle = '';

        switch (type) {
            case 'devis': docTitle = `Devis ${order.devisRef}`; docContent = <DevisDecor order={order} services={decorServices} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'proforma': docTitle = `Facture Proforma ${order.proformaRef}`; docContent = <FactureProformaDecor order={order} services={decorServices} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'facture': docTitle = `Facture ${order.factureRef}`; docContent = <FactureDecor order={order} services={decorServices} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'bon': docTitle = `Bon de Livraison ${order.bonRef}`; docContent = <BonLivraisonDecor order={order} services={decorServices} client={client} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
            case 'recu':
                 const lastReceipt = order.receipts?.[order.receipts.length - 1];
                 if (!lastReceipt) return showAlert("Information", "Aucun paiement enregistré pour cette commande.");
                 docTitle = `Reçu ${lastReceipt.ref}`;
                 docContent = <RecuDecor order={order} client={client} services={decorServices} companyProfile={companyProfile} billingSettings={billingSettings} receipt={lastReceipt}/>;
                 break;
            case 'rappel':
                if (order.totalAmount - order.amountPaid > 0) {
                    docTitle = `Rappel de Paiement - ${order.description}`;
                    docContent = <RappelPaiementDecor order={order} client={client} companyProfile={companyProfile} />;
                } else {
                    return showAlert("Information", "Aucun solde dû pour cette commande.");
                }
                break;
            case 'contrat': docTitle = `Contrat - ${order.description}`; docContent = <ContratDecor order={order} client={client} services={decorServices} companyProfile={companyProfile} billingSettings={billingSettings} />; break;
        }
        
        if(docContent) {
            setDocumentToDownload({ content: docContent, format: 'pdf', title: docTitle });
        }
    };
    
    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const periodOrders = decorOrders.filter(o => { const d = new Date(o.orderDate); return d >= start && d <= end; });
        const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

        setDocumentToDownload({
            title: `Rapport PS-DÉCOR - ${period}`,
            content: <DecorReport orders={periodOrders} clients={clients} services={decorServices} period={period} companyProfile={companyProfile} />,
            format: 'pdf',
        });
    };

    const handleExport = () => {
        const ordersToExport = decorOrders.filter(o => !o.isArchived);
        if (ordersToExport.length === 0) {
            showAlert('Information', 'Aucune commande à exporter.');
            return;
        }
    
        const dataToExport = ordersToExport.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            const balance = order.totalAmount - order.amountPaid;
            return {
                'ID Commande': order.id,
                'Description': order.description,
                'Client': client?.name || 'N/A',
                'Date Commande': new Date(order.orderDate).toLocaleDateString('fr-CA'),
                'Date Livraison': new Date(order.deliveryDate).toLocaleDateString('fr-CA'),
                'Montant Total': order.totalAmount,
                'Montant Payé': order.amountPaid,
                'Solde Dû': balance,
                'Statut': order.status,
            };
        });
    
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
        link.setAttribute('download', 'commandes_decor.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => ( <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-decor-yellow text-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button> );
    const DetailTabButton: React.FC<{ tab: DetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
        <button onClick={() => setActiveDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === tab ? 'border-decor-yellow text-decor-yellow' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="h-5 w-5" /><span>{label}</span>
        </button>
    );

    const renderServiceDetailView = () => {
        if (!selectedService) return null;
    
        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <div>
                            <h2 className="text-3xl font-bold">{selectedService.name}</h2>
                            <p className="text-gray-500">Détails du Service</p>
                        </div>
                    </div>
                    {hasPermission(Permission.MANAGE_DECOR) &&
                        <div className="flex items-center space-x-2">
                            <button onClick={() => { setIsEditing(true); setCurrentItem(selectedService); setNewServiceData(selectedService); setIsServiceModalOpen(true); }} className="btn-secondary flex items-center"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                            <button onClick={() => { setItemToDelete({ id: selectedService.id, name: selectedService.name, type: 'service' }); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50 flex items-center"><TrashIcon className="h-5 w-5 mr-2" />Archiver</button>
                        </div>
                    }
                </div>
    
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Informations Générales</h3>
                        <div>
                            <p className="text-sm text-gray-500">Prix</p>
                            <p className="font-bold text-xl">{selectedService.price.toLocaleString()} GNF</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Description</p>
                            <p>{selectedService.description || 'Aucune description'}</p>
                        </div>
                    </div>
    
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Consommables Requis pour ce Service</h3>
                        {selectedService.articles.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2">Article</th>
                                            <th className="p-2 text-right">Quantité Requise</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedService.articles.map((articleItem, index) => {
                                            const article = articles.find(a => a.id === articleItem.articleId);
                                            return (
                                                <tr key={index} className="border-b">
                                                    <td className="p-2">{article?.name || 'Article inconnu'}</td>
                                                    <td className="p-2 text-right">{articleItem.quantity} {article?.consumptionUnit || ''}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500">Aucun article consommable n'est lié à ce service.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDetailView = () => {
      if (!selectedOrder || !orderDetails) return null;
      const { client, orderServices } = orderDetails;
      const balance = selectedOrder.totalAmount - selectedOrder.amountPaid;

      return (
        <div className="animate-fade-in">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
            <div>
              <h2 className="text-3xl font-bold">{selectedOrder.description}</h2>
              <p className="text-gray-500">{client?.name || 'Client non trouvé'}</p>
            </div>
          </div>
          <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="paiements" label="Paiements" icon={BanknotesIcon} /><DetailTabButton tab="documents" label="Documents" icon={DocumentTextIcon} /></nav></div>

          <div className="mt-6">
            {activeDetailTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg">Détails de la Commande</h3>
                  <div className="flex items-center">
                    <strong className="w-28">Statut:</strong>
                    <select value={selectedOrder.status} onChange={e => handleStatusChange(selectedOrder.id, e.target.value as DecorOrderStatus)} className="input-style w-full max-w-xs" disabled={!hasPermission(Permission.MANAGE_DECOR)}>
                      <option>Devis</option><option>Confirmé</option><option>En cours</option><option>Terminé</option><option>Livré</option><option>Annulé</option>
                    </select>
                  </div>
                  <p><strong>Date Commande:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                  <p><strong>Date Livraison:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg">Résumé Financier</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-xs">Total</p><p className="font-bold text-lg">{selectedOrder.totalAmount.toLocaleString()} GNF</p></div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded"><p className="text-xs">Payé</p><p className="font-bold text-lg text-green-700">{selectedOrder.amountPaid.toLocaleString()} GNF</p></div>
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded"><p className="text-xs">Solde</p><p className="font-bold text-lg text-red-700">{balance.toLocaleString()} GNF</p></div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-lg">Services Commandés</h3>
                  <ul className="list-disc pl-5">
                    {orderServices.map((s: any) => <li key={s.id}>{s.name} (x{s.quantity}) - {(s.price * s.quantity).toLocaleString()} GNF</li>)}
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
                    {selectedOrder.receipts?.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-2">{p.amount.toLocaleString()} GNF</td>
                        <td className="p-2">{p.ref}</td>
                      </tr>
                    ))}
                    {(!selectedOrder.receipts || selectedOrder.receipts.length === 0) && <tr><td colSpan={3} className="text-center p-4">Aucun paiement enregistré.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            {activeDetailTab === 'documents' && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Génération de Documents</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openDocument('devis')} className="btn-secondary">Devis</button>
                  <button onClick={() => openDocument('proforma')} className="btn-secondary">Facture Proforma</button>
                  <button onClick={() => openDocument('facture')} className="btn-secondary">Facture</button>
                  <button onClick={() => openDocument('bon')} className="btn-secondary">Bon de Livraison</button>
                  <button onClick={() => openDocument('contrat')} className="btn-secondary">Contrat</button>
                  <button onClick={() => openDocument('recu')} className="btn-secondary" disabled={!selectedOrder.receipts || selectedOrder.receipts.length === 0}>Dernier Reçu</button>
                  {balance > 0 && <button onClick={() => openDocument('rappel')} className="btn-secondary text-yellow-600 border-yellow-500 hover:bg-yellow-50">Rappel de paiement</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-decor-yellow">PS-DÉCOR</h1>
                {!selectedOrder && !selectedService && <div className="flex items-center space-x-2">
                    {hasPermission(Permission.MANAGE_DECOR) && <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>}
                    <button onClick={handleClose} className="btn-secondary">Fermer</button>
                </div>}
            </div>
            
            {selectedOrder ? renderDetailView() : selectedService ? renderServiceDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4">
                        <TabButton tab="dashboard" label="Tableau de Bord" />
                        <TabButton tab="commandes" label="Commandes" />
                        <TabButton tab="services" label="Services" />
                    </div>
                    {activeTab === 'dashboard' && <DecorDashboard orders={decorOrders} services={decorServices} articles={articles} />}
                    {activeTab === 'commandes' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={handleExport} className="btn-secondary flex items-center">
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    Exporter (CSV)
                                </button>
                            </div>
                            <table className="w-full text-left">
                                <thead><tr className="border-b"><th className="p-2">Description</th><th className="p-2">Client</th><th className="p-2">Statut</th><th className="p-2">Total</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>
                                    {decorOrders.filter(o => !o.isArchived).map(order => {
                                        const client = clients.find(c => c.id === order.clientId);
                                        return (
                                            <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                                <td className="p-2">{order.description}</td>
                                                <td>{client?.name || 'N/A'}</td>
                                                <td><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></td>
                                                <td>{order.totalAmount.toLocaleString()} GNF</td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    {hasPermission(Permission.MANAGE_DECOR) && (
                                                        <div className="flex items-center space-x-1">
                                                            <button onClick={() => { setIsEditing(true); setCurrentItem(order); setNewOrderData(order); setIsOrderModalOpen(true); }} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                                            <button onClick={() => { setItemToDelete({ id: order.id, name: order.description, type: 'order' }); setIsDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'services' && (
                        <table className="w-full text-left">
                            <thead><tr className="border-b"><th className="p-2">Nom</th><th className="p-2">Prix</th><th className="p-2">Consommables</th><th className="p-2">Actions</th></tr></thead>
                            <tbody>
                                {decorServices.filter(s => !s.isArchived).map(service => (
                                    <tr key={service.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedService(service)}>
                                        <td className="p-2">{service.name}</td>
                                        <td>{service.price.toLocaleString()} GNF</td>
                                        <td>{service.articles.length}</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            {hasPermission(Permission.MANAGE_DECOR) && (
                                                <div className="flex items-center space-x-1">
                                                    <button onClick={() => { setIsEditing(true); setCurrentItem(service); setNewServiceData(service); setIsServiceModalOpen(true); }} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => { setItemToDelete({ id: service.id, name: service.name, type: 'service' }); setIsDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            
            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={isEditing ? 'Modifier la Commande' : 'Nouvelle Commande'}>
                 <form onSubmit={e => { e.preventDefault(); handleFormSubmit('order', newOrderData) }} className="space-y-4 max-h-[80vh] flex flex-col">
                    <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                        <input type="text" placeholder="Description de la commande" value={newOrderData.description} onChange={e => setNewOrderData({...newOrderData, description: e.target.value})} className="input-style" required/>
                        
                        <div>
                            <label>Client</label>
                            <select value={newOrderData.clientId} onChange={e => setNewOrderData({...newOrderData, clientId: e.target.value})} className="input-style" required>
                                {clients.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsAddClientModalOpen(true)} className="text-sm text-blue-600 hover:underline mt-1">+ Ajouter un nouveau client</button>
                        </div>
                        
                        <textarea placeholder="Détails personnalisés (facultatif)..." value={newOrderData.customDetails || ''} onChange={e => setNewOrderData({...newOrderData, customDetails: e.target.value})} className="input-style" rows={2}></textarea>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Date de commande</label><input type="date" value={newOrderData.orderDate} onChange={e => setNewOrderData({...newOrderData, orderDate: e.target.value})} className="input-style" required/></div>
                            <div><label>Date de livraison</label><input type="date" value={newOrderData.deliveryDate} onChange={e => setNewOrderData({...newOrderData, deliveryDate: e.target.value})} className="input-style" required/></div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-lg mb-2">Services</h4>
                            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                                {newOrderData.items.map((item: DecorServiceOrderItem, index: number) => {
                                    const service = decorServices.find(s => s.id === item.serviceId);
                                    return (
                                        <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                            <span>{service?.name} (Qté: {item.quantity})</span>
                                            <button type="button" onClick={() => setNewOrderData({...newOrderData, items: newOrderData.items.filter((_: any, i: number) => i !== index)})}><XCircleIcon className="h-5 w-5 text-red-500"/></button>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="grid grid-cols-12 gap-2 items-end p-2 border-t dark:border-gray-700">
                                <div className="col-span-7">
                                    <label className="text-sm">Service</label>
                                    <select value={itemToAdd.serviceId} onChange={e => setItemToAdd({...itemToAdd, serviceId: e.target.value})} className="input-style">
                                        {decorServices.filter(s => !s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name} - {s.price.toLocaleString()} GNF</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm">Qté</label>
                                    <input type="number" min="1" value={itemToAdd.quantity} onChange={e => setItemToAdd({...itemToAdd, quantity: +e.target.value})} className="input-style"/>
                                </div>
                                <div className="col-span-3">
                                    <button type="button" onClick={handleAddItemToOrder} className="btn-primary bg-decor-yellow text-gray-800 w-full">Ajouter</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 border-t pt-4 text-right space-y-1">
                        <p>Sous-total: {orderSubTotal.toLocaleString()} GNF</p>
                        <div><label className="text-sm mr-2">Remise (GNF):</label><input type="number" value={newOrderData.discount} onChange={e => setNewOrderData({...newOrderData, discount: +e.target.value})} className="input-style inline-block w-32 text-right" /></div>
                        <p className="font-bold text-xl">Total: {orderTotalAmount.toLocaleString()} GNF</p>
                    </div>

                    <div className="flex justify-end pt-4 flex-shrink-0">
                        <button type="button" onClick={() => setIsOrderModalOpen(false)} className="btn-secondary mr-2">Annuler</button>
                        <button type="submit" className="btn-primary bg-decor-yellow text-gray-800">{isEditing ? 'Enregistrer' : 'Créer'}</button>
                    </div>
                </form>
            </Modal>
             <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Ajouter un paiement pour ${selectedOrder?.description}`}>
                 <form onSubmit={e => {e.preventDefault(); handlePaymentSubmit()}} className="space-y-4">
                     <div><label>Montant</label><input type="number" value={newPaymentData.amount} onChange={e=>setNewPaymentData({ amount: +e.target.value })} className="input-style" required/></div>
                     <div className="flex justify-end"><button type="submit" className="btn-primary bg-green-600">Enregistrer</button></div>
                 </form>
            </Modal>

            <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title={isEditing ? 'Modifier le Service' : 'Nouveau Service'}>
                <form onSubmit={e => { e.preventDefault(); handleFormSubmit('service', newServiceData) }} className="space-y-4">
                    <div><label>Nom du service</label><input type="text" value={newServiceData.name} onChange={e => setNewServiceData({...newServiceData, name: e.target.value})} className="input-style" required /></div>
                    <div><label>Prix (GNF)</label><input type="number" value={newServiceData.price} onChange={e => setNewServiceData({...newServiceData, price: +e.target.value})} className="input-style" required /></div>
                    <div><label>Description</label><textarea value={newServiceData.description} onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} className="input-style" rows={2}></textarea></div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-lg mb-2">Consommables Requis</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border-b pb-2 mb-2">
                            {newServiceData.articles.map((item: DecorServiceArticle, index: number) => {
                                const article = consumables.find(c => c.id === item.articleId);
                                return (
                                    <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        <span>{article?.name || 'Inconnu'} (Qté: {item.quantity})</span>
                                        <button type="button" onClick={() => handleRemoveArticleFromService(index)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><XCircleIcon className="h-5 w-5 text-red-500"/></button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-6"><label className="text-sm">Article</label><select value={serviceArticleToAdd.articleId} onChange={e => setServiceArticleToAdd({...serviceArticleToAdd, articleId: e.target.value})} className="input-style">{consumables.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="col-span-3"><label className="text-sm">Quantité</label><input type="number" min="1" value={serviceArticleToAdd.quantity} onChange={e => setServiceArticleToAdd({...serviceArticleToAdd, quantity: +e.target.value})} className="input-style"/></div>
                            <div className="col-span-3"><button type="button" onClick={handleAddArticleToService} className="btn-primary bg-decor-yellow text-gray-800 w-full">Ajouter</button></div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn-secondary mr-2">Annuler</button>
                        <button type="submit" className="btn-primary bg-decor-yellow text-gray-800">{isEditing ? 'Enregistrer' : 'Créer'}</button>
                    </div>
                </form>
            </Modal>
            
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport PS-DÉCOR" />
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onClientAdded={(client) => { setClients(prev => [client, ...prev]); setNewOrderData({...newOrderData, clientId: client.id}); }} />
        </div>
    );
};

export default Decor;
