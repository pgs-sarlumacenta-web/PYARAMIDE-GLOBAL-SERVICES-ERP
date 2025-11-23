
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { Client, Permission, StudioProject, DecorOrder, ShopOrder, Article } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import ReportModal from '../components/ReportModal.tsx';
import ClientsDashboard from '../components/clients/ClientsDashboard.tsx';
import ClientsReport from '../components/clients/ClientsReport.tsx';
import ClientDebtsReport from '../components/clients/ClientDebtsReport.tsx';
import RappelPaiement from '../components/clients/RappelPaiement.tsx';
import { PlusIcon, PencilIcon, TrashIcon, ChartPieIcon, ArrowLeftIcon, MagnifyingGlassIcon, BellAlertIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../context/AlertContext.tsx';
import AddClientModal from '../components/AddClientModal.tsx';

type Tab = 'dashboard' | 'liste';

const initialClientState: Omit<Client, 'id'> = { name: '', company: '', email: '', phone: '', address: '' };

const Clients: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { showAlert } = useAlert();
    const { setFabConfig } = useFab();
    const {
        clients, setClients,
        studioProjects, decorOrders, shopOrders, studioServices, articles,
        addLogEntry, companyProfile
    } = useData();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [currentClient, setCurrentClient] = useState<Client | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Client | null>(null);

    const [newClientData, setNewClientData] = useState<Omit<Client, 'id'>>(initialClientState);

    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'overdue'>('all');
    const [productFilter, setProductFilter] = useState<string>('all');


    const clientInteractions = useMemo(() => {
        return [...studioProjects, ...decorOrders, ...shopOrders];
    }, [studioProjects, decorOrders, shopOrders]);
    
    const clientsWithDebts = useMemo(() => {
        return clients
            .map(client => {
                const clientOrders = clientInteractions.filter(i => i.clientId === client.id && !i.isArchived);
                const totalBilled = clientOrders.reduce((sum, order) => {
                    if ('serviceIds' in order) { // StudioProject
                        return sum + order.serviceIds.reduce((s, id) => s + (studioServices.find(serv => serv.id === id)?.tarif || 0), 0) - order.discount;
                    }
                    return sum + (order.totalAmount || 0);
                }, 0);
                const totalPaid = clientOrders.reduce((sum, order) => sum + order.amountPaid, 0);
                const totalDue = totalBilled - totalPaid;
                return { client, totalBilled, totalPaid, totalDue };
            })
            .filter(c => c.totalDue > 0);
    }, [clients, clientInteractions, studioServices]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('filter') === 'overdue') {
            setActiveTab('liste');
            setActiveFilter('overdue');
            navigate('/clients', { replace: true }); 
        }
    }, [location, navigate]);

     useEffect(() => {
        const state = location.state as { selectedId?: string };
        if (state?.selectedId) {
            const clientToSelect = clients.find(c => c.id === state.selectedId && !c.isArchived);
            if (clientToSelect) {
                setSelectedClient(clientToSelect);
                setActiveTab('liste');
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, clients, navigate]);

    const openAddModal = useCallback(() => {
        setIsAddModalOpen(true);
    }, []);

    useEffect(() => {
        if (selectedClient) {
            setFabConfig(null);
            return;
        }
        if (activeTab === 'liste' && hasPermission(Permission.MANAGE_CLIENTS)) {
            setFabConfig({ onClick: openAddModal, title: "Nouveau Client" });
        } else {
            setFabConfig(null);
        }
        return () => setFabConfig(null);
    }, [activeTab, selectedClient, hasPermission, setFabConfig, openAddModal]);
    
    const handleClose = () => navigate('/dashboard');
    
    const openEditModal = (client: Client) => {
        setCurrentClient(client);
        setNewClientData(client);
        setIsEditModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentClient) { // Editing
            const updatedClient = { ...newClientData, id: currentClient.id };
            setClients(clients.map(c => c.id === currentClient.id ? updatedClient : c));
            if (selectedClient?.id === currentClient.id) {
                setSelectedClient(updatedClient);
            }
            addLogEntry('Modification', `A modifié le client ${newClientData.name}`, 'client', currentClient.id);
            setIsEditModalOpen(false);
            showAlert('Succès', 'Client modifié avec succès.');
        }
    };
    
    const handleClientAdded = (client: Client) => {
        setClients(prev => [client, ...prev]);
        addLogEntry('Création', `A créé le client ${client.name}`, 'client', client.id);
        setIsAddModalOpen(false);
        showAlert('Succès', 'Client ajouté avec succès.');
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setClients(clients.map(c => c.id === itemToDelete.id ? { ...c, isArchived: true } : c));
        addLogEntry('Archivage', `A archivé le client ${itemToDelete.name}`, 'client', itemToDelete.id);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        if(selectedClient?.id === itemToDelete.id) setSelectedClient(null);
        showAlert('Succès', 'Client archivé.');
    };
    
    const handleGenerateReport = (startDateStr: string, endDateStr: string) => {
        const startDate = new Date(startDateStr).getTime();
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        const newClients = clients.filter(c => {
             const idParts = c.id.split('_');
             if (idParts.length < 3 || idParts[1] !== 'NEW') return false;
             const creationDate = parseInt(idParts[2]);
             return creationDate >= startDate && creationDate <= endDate.getTime();
        });

        const clientRevenueMap = new Map<string, number>();
        [...studioProjects, ...decorOrders, ...shopOrders].forEach(order => {
            if (order.clientId && order.amountPaid > 0) {
                clientRevenueMap.set(order.clientId, (clientRevenueMap.get(order.clientId) || 0) + order.amountPaid);
            }
        });
        const topClients = Array.from(clientRevenueMap.entries())
            .map(([clientId, revenue]) => ({ name: clients.find(c => c.id === clientId)?.name || 'Inconnu', revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const period = `${new Date(startDateStr).toLocaleDateString()} - ${new Date(endDateStr).toLocaleDateString()}`;
        setDocumentToDownload({
            title: `Rapport Clients - ${period}`,
            content: <ClientsReport newClients={newClients} topClients={topClients} period={period} companyProfile={companyProfile} />,
            format: 'pdf',
        });
    };
    
    const filteredClients = useMemo(() => {
        let clientsToFilter = clients.filter(c => !c.isArchived);
        
        if (activeFilter === 'overdue') {
            const indebtedClientIds = new Set(clientsWithDebts.map(c => c.client.id));
            clientsToFilter = clientsToFilter.filter(c => indebtedClientIds.has(c.id));
        }

        if (productFilter !== 'all') {
            const clientIdsWhoBoughtProduct = new Set(
                shopOrders
                    .filter(order => order.items.some(item => item.articleId === productFilter))
                    .map(order => order.clientId)
                    .filter((id): id is string => !!id)
            );
            clientsToFilter = clientsToFilter.filter(c => clientIdsWhoBoughtProduct.has(c.id));
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            clientsToFilter = clientsToFilter.filter(c => (
                c.name.toLowerCase().includes(lowerTerm) ||
                c.email.toLowerCase().includes(lowerTerm) ||
                c.phone.toLowerCase().includes(lowerTerm) ||
                (c.company && c.company.toLowerCase().includes(lowerTerm))
            ));
        }
        
        return clientsToFilter;
    }, [clients, searchTerm, activeFilter, productFilter, clientsWithDebts, shopOrders]);

    const handleExport = () => {
        if (filteredClients.length === 0) {
            showAlert('Information', 'Aucun client à exporter.');
            return;
        }

        const clientsData = clients.map(client => {
            const clientOrders = clientInteractions.filter(i => i.clientId === client.id && !i.isArchived);
            const totalBilled = clientOrders.reduce((sum, order) => {
                if ('serviceIds' in order) { // StudioProject
                    return sum + order.serviceIds.reduce((s, id) => s + (studioServices.find(serv => serv.id === id)?.tarif || 0), 0) - order.discount;
                }
                return sum + (order.totalAmount || 0);
            }, 0);
            const totalPaid = clientOrders.reduce((sum, order) => sum + order.amountPaid, 0);
            return {
                id: client.id,
                totalDue: totalBilled - totalPaid,
            };
        });

        const dataToExport = filteredClients.map(client => {
            const debtInfo = clientsData.find(c => c.id === client.id);
            return {
                'Nom': client.name,
                'Société': client.company || '',
                'Email': client.email,
                'Téléphone': client.phone,
                'Adresse': client.address,
                'Solde Dû': debtInfo?.totalDue || 0,
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
        link.setAttribute('download', 'clients.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const renderDetailView = () => {
        if (!selectedClient) return null;

        const clientSpecificInteractions = clientInteractions
            .filter(i => i.clientId === selectedClient.id && !i.isArchived)
            .map(i => {
                const date = 'startDate' in i ? i.startDate : i.orderDate;
                const description = 'projectName' in i ? i.projectName : ('description' in i ? i.description : `Vente #${i.id}`);
                const type = 'projectName' in i ? 'Studio' : ('description' in i ? 'Décor' : 'Shop');
                const totalAmount = 'serviceIds' in i // StudioProject
                    ? i.serviceIds.reduce((s, id) => s + (studioServices.find(serv => serv.id === id)?.tarif || 0), 0) - i.discount
                    : i.totalAmount;
                return { ...i, date, description, type, totalAmount };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalBilled = clientSpecificInteractions.reduce((sum, item) => sum + item.totalAmount, 0);
        const totalPaid = clientSpecificInteractions.reduce((sum, item) => sum + item.amountPaid, 0);
        const totalDue = totalBilled - totalPaid;

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <div>
                            <h2 className="text-3xl font-bold">{selectedClient.name}</h2>
                            <p className="text-gray-500">{selectedClient.company || selectedClient.email}</p>
                        </div>
                    </div>
                    {hasPermission(Permission.MANAGE_CLIENTS) &&
                        <div className="flex items-center space-x-2">
                            <button onClick={() => openEditModal(selectedClient)} className="btn-secondary flex items-center"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                            <button onClick={() => { setItemToDelete(selectedClient); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50 flex items-center"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Informations</h3>
                            <p><strong>Email:</strong> {selectedClient.email}</p>
                            <p><strong>Téléphone:</strong> {selectedClient.phone}</p>
                            <p><strong>Adresse:</strong> {selectedClient.address}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Résumé Financier</h3>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm mt-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-xs">Total Facturé</p><p className="font-bold">{totalBilled.toLocaleString()} GNF</p></div>
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded"><p className="text-xs">Payé</p><p className="font-bold text-green-700">{totalPaid.toLocaleString()} GNF</p></div>
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded"><p className="text-xs">Solde</p><p className="font-bold text-red-700">{totalDue.toLocaleString()} GNF</p></div>
                            </div>
                            {totalDue > 0 && hasPermission(Permission.MANAGE_CLIENTS) && (
                                <button
                                    onClick={() => setDocumentToDownload({title: `Rappel de Paiement - ${selectedClient.name}`, content: <RappelPaiement client={selectedClient} companyProfile={companyProfile} interactions={clientSpecificInteractions} totalDue={totalDue} />, format: 'pdf'})}
                                    className="btn-secondary w-full mt-4 text-yellow-600 border-yellow-500 hover:bg-yellow-50 flex items-center justify-center"
                                >
                                    <BellAlertIcon className="h-5 w-5 mr-2"/>Générer un Rappel de Paiement
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                         <h3 className="font-semibold text-lg border-b pb-2 mb-2">Historique des Interactions</h3>
                         <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Description</th>
                                        <th className="p-2">Module</th>
                                        <th className="p-2 text-right">Total</th>
                                        <th className="p-2 text-right">Solde</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientSpecificInteractions.map((item, index) => {
                                        const balance = item.totalAmount - item.amountPaid;
                                        const typeColor = {
                                            'Studio': 'text-studio-red',
                                            'Décor': 'text-decor-yellow',
                                            'Shop': 'text-shop-green'
                                        }[item.type] || 'text-gray-500';
                                        return (
                                        <tr key={index} className="border-b dark:border-gray-700">
                                            <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="p-2 font-medium">{item.description}</td>
                                            <td className={`p-2 font-semibold ${typeColor}`}>{item.type}</td>
                                            <td className="p-2 text-right">{item.totalAmount.toLocaleString()} GNF</td>
                                            <td className={`p-2 text-right font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {balance.toLocaleString()} GNF
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-clients-teal">Gestion des Clients</h1>
                {!selectedClient &&
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>
                    <button onClick={handleClose} className="btn-secondary">Fermer</button>
                </div>}
            </div>

            {selectedClient ? renderDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4">
                        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-clients-teal text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Tableau de Bord</button>
                        <button onClick={() => setActiveTab('liste')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'liste' ? 'bg-clients-teal text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Liste des Clients</button>
                    </div>

                    {activeTab === 'dashboard' && <ClientsDashboard clients={clients} studioProjects={studioProjects} decorOrders={decorOrders} shopOrders={shopOrders} />}
                    {activeTab === 'liste' && (
                        <div>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="md:col-span-2 relative"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Rechercher par nom, email, tél..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700"/></div>
                                <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as any)} className="input-style">
                                    <option value="all">Tous les clients</option>
                                    <option value="overdue">Avec Solde Dû</option>
                                </select>
                                <select value={productFilter} onChange={e => setProductFilter(e.target.value as any)} className="input-style">
                                    <option value="all">Tous produits achetés</option>
                                    {articles.filter(a => a.isSellable).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end mb-4">
                                <button onClick={handleExport} className="btn-secondary flex items-center">
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    Exporter la liste (CSV)
                                </button>
                            </div>
                            <table className="w-full text-left">
                                <thead><tr><th className="p-2">Nom</th><th className="p-2">Email</th><th className="p-2">Téléphone</th><th className="p-2">Solde Dû</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>
                                    {filteredClients.map(client => {
                                        const debtInfo = clientsWithDebts.find(c => c.client.id === client.id);
                                        return (
                                            <tr key={client.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedClient(client)}>
                                                <td className="p-2 font-medium">{client.name}</td>
                                                <td className="p-2">{client.email}</td>
                                                <td className="p-2">{client.phone}</td>
                                                <td className={`p-2 font-semibold ${debtInfo && debtInfo.totalDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {(debtInfo?.totalDue || 0).toLocaleString()} GNF
                                                </td>
                                                <td className="p-2" onClick={e => e.stopPropagation()}>{hasPermission(Permission.MANAGE_CLIENTS) && <div className="flex items-center space-x-1">
                                                    {debtInfo && debtInfo.totalDue > 0 && <button onClick={() => {
                                                        const clientInteractions = [...studioProjects, ...decorOrders, ...shopOrders].filter(i => i.clientId === client.id).map(i => {
                                                            const date = 'startDate' in i ? i.startDate : i.orderDate;
                                                            const description = 'projectName' in i ? i.projectName : ('description' in i ? i.description : `Vente #${i.id}`);
                                                            const type = 'projectName' in i ? 'Studio' : ('description' in i ? 'Décor' : 'Shop');
                                                            const totalAmount = 'serviceIds' in i ? i.serviceIds.reduce((s, id) => s + (studioServices.find(serv=>serv.id===id)?.tarif || 0), 0) - i.discount : i.totalAmount;
                                                            return {...i, date, description, type, totalAmount};
                                                        });
                                                        setDocumentToDownload({title: `Rappel de Paiement - ${client.name}`, content: <RappelPaiement client={client} companyProfile={companyProfile} interactions={clientInteractions} totalDue={debtInfo.totalDue} />, format: 'pdf'});
                                                    }} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full" title="Envoyer un rappel"><BellAlertIcon className="h-5 w-5"/></button>}
                                                    <button onClick={() => openEditModal(client)} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                                    <button onClick={() => { setItemToDelete(client); setIsDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                </div>}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
             <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le Client">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input type="text" placeholder="Nom" value={newClientData.name} onChange={e=>setNewClientData({...newClientData, name: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" placeholder="Email" value={newClientData.email} onChange={e=>setNewClientData({...newClientData, email: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Téléphone</label>
                        <input type="tel" placeholder="Téléphone" value={newClientData.phone} onChange={e=>setNewClientData({...newClientData, phone: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Adresse</label>
                        <input type="text" placeholder="Adresse" value={newClientData.address} onChange={e=>setNewClientData({...newClientData, address: e.target.value})} className="input-style"/>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-clients-teal">Enregistrer</button></div>
                </form>
            </Modal>
            <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onClientAdded={handleClientAdded} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`}/>
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport Clients"/>
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
        </div>
    );
};

export default Clients;
