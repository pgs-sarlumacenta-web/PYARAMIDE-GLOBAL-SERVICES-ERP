import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData, usePermissions } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { WifizonePlan, WifizoneSale, Client, Transaction, Permission, WifizoneSettings } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import AddClientModal from '../components/AddClientModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import { PlusIcon, PencilIcon, TrashIcon, TicketIcon, ChartPieIcon, WifiIcon, ClipboardDocumentIcon, Cog6ToothIcon, BanknotesIcon, ScaleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import WifizoneRecu from '../components/wifizone/WifizoneRecu.tsx';

type Tab = 'dashboard' | 'ventes' | 'forfaits' | 'parametres';

const initialPlanState: Omit<WifizonePlan, 'id'> = { name: '', duration: 1, price: 0 };

const WifizoneDashboard: React.FC<{ sales: WifizoneSale[], plans: WifizonePlan[], settings: WifizoneSettings }> = ({ sales, plans, settings }) => {
    
    const monthlySales = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return sales.filter(s => new Date(s.saleDate) >= firstDayOfMonth);
    }, [sales]);

    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const netProfit = monthlyRevenue - settings.monthlyCost;
    const averagePassPrice = sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0;
    const breakEvenPoint = averagePassPrice > 0 ? Math.ceil(settings.monthlyCost / averagePassPrice) : 0;


    const salesByPlan = useMemo(() => {
        const data: { [key: string]: number } = {};
        sales.forEach(sale => {
            const plan = plans.find(p => p.id === sale.planId);
            if (plan) {
                data[plan.name] = (data[plan.name] || 0) + 1;
            }
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [sales, plans]);

    const COLORS = ['#F97316', '#EA580C', '#D97706', '#B45309'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">Revenu (ce mois)</p><p className="text-2xl font-bold">{monthlyRevenue.toLocaleString()} GNF</p></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">Coût Mensuel (Starlink)</p><p className="text-2xl font-bold text-red-500">{settings.monthlyCost.toLocaleString()} GNF</p></div>
                <div className={`p-4 rounded-lg shadow text-center ${netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}><p className="text-sm">Bénéfice Net (ce mois)</p><p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netProfit.toLocaleString()} GNF</p></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">Point Mort (Pass vendus)</p><p className="text-2xl font-bold text-blue-500">{breakEvenPoint}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Popularité des Forfaits</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={salesByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {salesByPlan.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Wifizone: React.FC = () => {
    const { hasPermission } = usePermissions();
    const { wifizonePlans, setWifizonePlans, wifizoneSales, setWifizoneSales, clients, setClients, setTransactions, billingSettings, setBillingSettings, companyProfile, addLogEntry, wifizoneSettings, setWifizoneSettings } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [saleResult, setSaleResult] = useState<{ sale: WifizoneSale, plan: WifizonePlan, client?: Client } | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: string } | null>(null);

    const [newPlanData, setNewPlanData] = useState(initialPlanState);
    const [newSaleData, setNewSaleData] = useState({ planId: '', clientId: '' });
    const [settingsData, setSettingsData] = useState(wifizoneSettings);

    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);
    
    const openSaleModal = useCallback(() => {
        const firstPlan = wifizonePlans.find(p => !p.isArchived);
        if (!firstPlan) {
            showAlert("Action requise", "Veuillez d'abord créer au moins un forfait Wifizone.");
            return;
        }
        setNewSaleData({ planId: firstPlan.id, clientId: '' });
        setIsSaleModalOpen(true);
    }, [wifizonePlans, showAlert]);
    
    const openPlanModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewPlanData(initialPlanState);
        setIsPlanModalOpen(true);
    }, []);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_WIFIZONE)) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'ventes') config = { onClick: openSaleModal, title: "Nouvelle Vente" };
        else if (activeTab === 'forfaits') config = { onClick: openPlanModal, title: "Nouveau Forfait" };
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, hasPermission, setFabConfig, openSaleModal, openPlanModal]);

    const handlePlanSubmit = () => {
        const action = isEditing ? 'Modification' : 'Création';
        if (isEditing && currentItem) {
            const updatedPlan = { ...newPlanData, id: currentItem.id };
            setWifizonePlans(prev => prev.map(p => p.id === currentItem.id ? updatedPlan : p));
            addLogEntry(action, `A modifié le forfait Wifizone ${updatedPlan.name}`, 'wifizonePlan', updatedPlan.id);
        } else {
            const newId = `WZP-${Date.now()}`;
            const newPlan = { ...newPlanData, id: newId };
            setWifizonePlans(prev => [newPlan, ...prev]);
            addLogEntry(action, `A créé le forfait Wifizone ${newPlan.name}`, 'wifizonePlan', newId);
        }
        setIsPlanModalOpen(false);
    };

    const generateVoucherCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'WZ-';
        for (let i = 0; i < 8; i++) {
            if (i === 4) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleSaleSubmit = () => {
        const plan = wifizonePlans.find(p => p.id === newSaleData.planId);
        if (!plan) return;

        const newId = `WZS-${Date.now()}`;
        const newReceiptRef = `${billingSettings.receiptPrefix}WIFI-${billingSettings.receiptNextNumber}`;
        
        const newSale: WifizoneSale = {
            id: newId,
            planId: plan.id,
            clientId: newSaleData.clientId || undefined,
            saleDate: new Date().toISOString(),
            voucherCode: generateVoucherCode(),
            totalAmount: plan.price,
            receiptRef: newReceiptRef,
        };

        setWifizoneSales(prev => [newSale, ...prev]);
        setBillingSettings(prev => ({ ...prev, receiptNextNumber: prev.receiptNextNumber + 1 }));

        const newTransaction: Transaction = {
            id: `T_WIFI_${newId}`,
            date: new Date().toISOString(),
            department: 'Wifizone',
            description: `Vente forfait: ${plan.name}`,
            amount: plan.price,
            type: 'Revenu',
        };
        setTransactions(prev => [newTransaction, ...prev]);

        addLogEntry('Vente Wifizone', `A vendu le forfait ${plan.name} pour ${plan.price.toLocaleString()} GNF`, 'wifizoneSale', newId);
        setIsSaleModalOpen(false);
        const client = clients.find(c => c.id === newSaleData.clientId);
        setSaleResult({ sale: newSale, plan, client });
    };
    
    const handleSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setWifizoneSettings(settingsData);
        addLogEntry('Modification Paramètres', "A mis à jour les paramètres du Wifizone.", 'wifizoneSettings');
        showAlert("Succès", "Paramètres enregistrés.");
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setWifizonePlans(prev => prev.map(p => p.id === itemToDelete.id ? { ...p, isArchived: true } : p));
        addLogEntry('Archivage', `A archivé le forfait ${itemToDelete.name}`, 'wifizonePlan', itemToDelete.id);
        setIsDeleteModalOpen(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showAlert("Copié !", "Le code a été copié dans le presse-papiers.");
        }, (err) => {
            showAlert("Erreur", "Impossible de copier le code.");
        });
    };

    const downloadReceipt = () => {
        if (!saleResult) return;
        const { sale, plan, client } = saleResult;
        const docTitle = `Recu-${sale.receiptRef}`;
        const docContent = <WifizoneRecu sale={sale} plan={plan} client={client} companyProfile={companyProfile} />;
        setDocumentToDownload({ content: docContent, format: 'pdf', title: docTitle });
        showAlert("Téléchargement", "Le reçu va être téléchargé.");
    };

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (<button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-wifizone-orange text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button>);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-wifizone-orange flex items-center"><WifiIcon className="h-8 w-8 mr-3" />PS-WIFIZONE</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex space-x-2 border-b mb-4">
                    <TabButton tab="dashboard" label="Tableau de Bord" />
                    <TabButton tab="ventes" label="Ventes & Vouchers" />
                    <TabButton tab="forfaits" label="Forfaits" />
                    {hasPermission(Permission.MANAGE_WIFIZONE) && <TabButton tab="parametres" label="Paramètres" />}
                </div>
                {activeTab === 'dashboard' && <WifizoneDashboard sales={wifizoneSales} plans={wifizonePlans} settings={wifizoneSettings} />}
                {activeTab === 'ventes' && <table className="w-full text-left"><thead><tr><th>Date</th><th>Forfait</th><th>Client</th><th>Code Voucher</th><th>Montant</th></tr></thead><tbody>{wifizoneSales.map(s => { const p = wifizonePlans.find(pl => pl.id === s.planId); const c = clients.find(cl => cl.id === s.clientId); return <tr key={s.id} className="border-b"><td>{new Date(s.saleDate).toLocaleString()}</td><td>{p?.name}</td><td>{c?.name || 'Au comptoir'}</td><td className="font-mono">{s.voucherCode}</td><td>{s.totalAmount.toLocaleString()} GNF</td></tr>})}</tbody></table>}
                {activeTab === 'forfaits' && <table className="w-full text-left"><thead><tr><th>Nom</th><th>Durée</th><th>Prix</th><th>Actions</th></tr></thead><tbody>{wifizonePlans.filter(p=>!p.isArchived).map(p => <tr key={p.id} className="border-b"><td>{p.name}</td><td>{p.duration} heures</td><td>{p.price.toLocaleString()} GNF</td><td>{hasPermission(Permission.MANAGE_WIFIZONE) && <div className="flex space-x-1"><button onClick={() => { setIsEditing(true); setCurrentItem(p); setNewPlanData(p); setIsPlanModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button><button onClick={() => { setItemToDelete({ id: p.id, name: p.name, type: 'plan' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button></div>}</td></tr>)}</tbody></table>}
                {activeTab === 'parametres' && (
                    <div className="max-w-md">
                        <form onSubmit={handleSettingsSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="monthlyCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Coût Mensuel de l'Abonnement Internet (Starlink)
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="number"
                                        id="monthlyCost"
                                        value={settingsData.monthlyCost}
                                        onChange={e => setSettingsData({ monthlyCost: +e.target.value })}
                                        className="input-style"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">GNF</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="btn-primary bg-wifizone-orange">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Nouvelle Vente Wifizone">
                <form onSubmit={e => {e.preventDefault(); handleSaleSubmit()}} className="space-y-4">
                    <div><label>Forfait</label><select value={newSaleData.planId} onChange={e=>setNewSaleData(p=>({...p, planId: e.target.value}))} className="input-style" required>{wifizonePlans.filter(p=>!p.isArchived).map(p=><option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()} GNF</option>)}</select></div>
                    <div><label>Client (facultatif)</label><div className="flex items-center"><select value={newSaleData.clientId} onChange={e=>setNewSaleData(p=>({...p, clientId: e.target.value}))} className="input-style flex-grow"><option value="">-- Vente au comptoir --</option>{clients.filter(c=>!c.isArchived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" onClick={() => setIsAddClientModalOpen(true)} className="ml-2 btn-secondary p-2 text-sm">+</button></div></div>
                    <div className="font-bold text-xl text-right pt-4">Total: {wifizonePlans.find(p=>p.id === newSaleData.planId)?.price.toLocaleString() || 0} GNF</div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-wifizone-orange">Vendre & Générer Voucher</button></div>
                </form>
            </Modal>
            <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={isEditing ? 'Modifier le Forfait' : 'Nouveau Forfait'}>
                <form onSubmit={e => {e.preventDefault(); handlePlanSubmit()}} className="space-y-4">
                    <input type="text" placeholder="Nom du forfait" value={newPlanData.name} onChange={e=>setNewPlanData({...newPlanData, name: e.target.value})} className="input-style" required/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Durée (en heures)" value={newPlanData.duration} onChange={e=>setNewPlanData({...newPlanData, duration: +e.target.value})} className="input-style" required/>
                        <input type="number" placeholder="Prix (GNF)" value={newPlanData.price} onChange={e=>setNewPlanData({...newPlanData, price: +e.target.value})} className="input-style" required/>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-wifizone-orange">Enregistrer</button></div>
                </form>
            </Modal>
            <Modal isOpen={!!saleResult} onClose={() => setSaleResult(null)} title="Vente Réussie !">
                {saleResult && (
                    <div className="text-center space-y-4">
                        <p>Voucher généré pour le forfait <strong>{saleResult.plan.name}</strong>.</p>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Code d'accès / Voucher</p>
                            <div className="flex items-center justify-center space-x-2">
                                <p className="text-2xl font-bold font-mono tracking-widest">{saleResult.sale.voucherCode}</p>
                                <button onClick={() => copyToClipboard(saleResult.sale.voucherCode)} title="Copier le code"><ClipboardDocumentIcon className="h-6 w-6 text-gray-500 hover:text-wifizone-orange"/></button>
                            </div>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button onClick={downloadReceipt} className="btn-secondary">Télécharger le Reçu</button>
                            <button onClick={() => setSaleResult(null)} className="btn-primary bg-wifizone-orange">Fermer</button>
                        </div>
                    </div>
                )}
            </Modal>
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onClientAdded={(client) => { setClients(prev => [client, ...prev]); setNewSaleData({...newSaleData, clientId: client.id}); }} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
        </div>
    );
};

export default Wifizone;