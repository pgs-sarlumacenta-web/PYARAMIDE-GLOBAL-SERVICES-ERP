import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.tsx';
// FIX: Updated import path for useAuth to break circular dependency.
import { useAuth, usePermissions } from '../context/DataContext.tsx';
import { ActivityLog, CompanyProfile, BillingSettings, Permission } from '../types.ts';
import Users from './Users.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import RoleManager from '../components/settings/RoleManager.tsx';
import { UsersIcon, WrenchScrewdriverIcon, ArchiveBoxIcon, ArrowUturnDownIcon, TrashIcon, CameraIcon, ShieldCheckIcon, ClipboardDocumentListIcon, LockClosedIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../context/AlertContext.tsx';
import ActivityLogViewer from '../components/settings/ActivityLogViewer.tsx';

type SettingsTab = 'users' | 'roles' | 'general' | 'activity' | 'archives';

const ArchiveManager: React.FC = () => {
    const data = useData();
    const { showAlert } = useAlert();
    const { addLogEntry } = data;
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(null);

    const archiveSections = useMemo(() => [
        { type: 'client', title: 'Clients', items: data.clients, setter: data.setClients, nameKey: 'name' },
        { type: 'student', title: 'Apprenants', items: data.students, setter: data.setStudents, nameKey: 'name' },
        { type: 'studioProject', title: 'Projets Studio', items: data.studioProjects, setter: data.setStudioProjects, nameKey: 'projectName' },
        { type: 'decorOrder', title: 'Commandes Décor', items: data.decorOrders, setter: data.setDecorOrders, nameKey: 'description' },
        { type: 'shopOrder', title: 'Ventes Shop', items: data.shopOrders, setter: data.setShopOrders, nameKey: 'id' },
        { type: 'supplier', title: 'Fournisseurs', items: data.suppliers, setter: data.setSuppliers, nameKey: 'name' },
        { type: 'employee', title: 'Employés', items: data.employees, setter: data.setEmployees, nameKey: 'name' },
        { type: 'article', title: 'Articles', items: data.articles, setter: data.setArticles, nameKey: 'name' },
        { type: 'user', title: 'Utilisateurs', items: data.users, setter: data.setUsers, nameKey: 'name' },
    ], [data]);

    const handleRestore = (id: string, type: string) => {
        const section = archiveSections.find(s => s.type === type);
        if (section) {
            section.setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isArchived: false } : item));
            addLogEntry('Restauration', `A restauré l'élément de type ${type} (ID: ${id})`, type, id);
            showAlert('Succès', 'Élément restauré avec succès.');
        }
    };

    const openDeleteModal = (id: string, name: string, type: string) => {
        setItemToDelete({ id, name, type });
        setIsDeleteModalOpen(true);
    };

    const confirmPermanentDelete = () => {
        if (!itemToDelete) return;
        const { id, type, name } = itemToDelete;
        const section = archiveSections.find(s => s.type === type);
        if (section) {
            section.setter((prev: any[]) => prev.filter(item => item.id !== id));
            addLogEntry('Suppression Définitive', `A supprimé définitivement l'élément ${name} (ID: ${id})`, type, id);
            showAlert('Succès', 'Élément supprimé définitivement.');
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Gestion des Archives</h2>
            <div className="space-y-2">
                {archiveSections.map(section => {
                    const archivedItems = section.items.filter(item => item.isArchived);
                    if (archivedItems.length === 0) return null;

                    return (
                        <div key={section.type} className="border dark:border-gray-700 rounded-lg">
                            <button onClick={() => setOpenSection(openSection === section.type ? null : section.type)} className="w-full flex justify-between items-center p-4 text-left font-semibold">
                                <span>{section.title} ({archivedItems.length})</span>
                                {openSection === section.type ? <ChevronUpIcon className="h-5 w-5"/> : <ChevronDownIcon className="h-5 w-5"/>}
                            </button>
                            {openSection === section.type && (
                                <div className="p-4 border-t dark:border-gray-700 max-h-64 overflow-y-auto">
                                    {archivedItems.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md">
                                            <span>{item[section.nameKey]}</span>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleRestore(item.id, section.type)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Restaurer"><ArrowPathIcon className="h-5 w-5"/></button>
                                                <button onClick={() => openDeleteModal(item.id, item[section.nameKey], section.type)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Supprimer Définitivement"><TrashIcon className="h-5 w-5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmPermanentDelete}
                title="Confirmer la Suppression Définitive"
                message={`ATTENTION ! Vous allez supprimer définitivement "${itemToDelete?.name}". Cette action est IRREVERSIBLE. Êtes-vous certain ?`}
            />
        </div>
    );
};


const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('users');
    const navigate = useNavigate();
    const { user, isAppLocked, setIsAppLocked } = useAuth();
    const { hasPermission } = usePermissions();
    const { showAlert } = useAlert();
    const dataContext = useData();
    const {
        activityLog, setActivityLog,
        setTransactions, setStudents, setPaiements, setStudioProjects,
        setDecorOrders, setShopOrders, setPayrolls, setPurchaseOrders, setStockMovements,
        companyProfile, setCompanyProfile,
        billingSettings, setBillingSettings,
        addLogEntry
    } = dataContext;

    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    
    const [profileData, setProfileData] = useState<CompanyProfile>(companyProfile);
    const [billingData, setBillingData] = useState<BillingSettings>(billingSettings);
    const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
    const [billingSuccessMessage, setBillingSuccessMessage] = useState('');

    const availableTabs = useMemo(() => {
        const tabs: {id: SettingsTab, label: string, icon: React.ElementType, permission: Permission}[] = [];
        if (hasPermission(Permission.MANAGE_USERS_ROLES)) {
            tabs.push({ id: 'users', label: 'Utilisateurs', icon: UsersIcon, permission: Permission.MANAGE_USERS_ROLES });
            tabs.push({ id: 'roles', label: 'Rôles & Permissions', icon: ShieldCheckIcon, permission: Permission.MANAGE_USERS_ROLES });
        }
        tabs.push({ id: 'general', label: 'Général', icon: WrenchScrewdriverIcon, permission: Permission.MANAGE_SETTINGS });

        if(hasPermission(Permission.VIEW_ACTIVITY_LOG)) {
            tabs.push({ id: 'activity', label: "Journal d'Activité", icon: ClipboardDocumentListIcon, permission: Permission.VIEW_ACTIVITY_LOG });
        }
        
        if(hasPermission(Permission.MANAGE_SETTINGS)) { // Or a new MANAGE_ARCHIVES permission
            tabs.push({ id: 'archives', label: "Gestion des Archives", icon: ArchiveBoxIcon, permission: Permission.MANAGE_SETTINGS });
        }

        return tabs;
    }, [hasPermission]);

    useEffect(() => {
        // Set a valid default tab if the current one is no longer available
        if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeTab)) {
            setActiveTab(availableTabs[0].id);
        }
    }, [activeTab, availableTabs]);


    useEffect(() => {
        setProfileData(companyProfile);
    }, [companyProfile]);

    useEffect(() => {
        setBillingData(billingSettings);
    }, [billingSettings]);


    const handleClose = () => navigate(-1);
    
    const handleProfileFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCompanyProfile(profileData);
        addLogEntry("Modification des paramètres", "Le profil de l'entreprise a été mis à jour.");
        setProfileSuccessMessage("Informations de l'entreprise enregistrées avec succès !");
        setTimeout(() => setProfileSuccessMessage(''), 3000);
    };

    const handleBillingFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBillingSettings(billingData);
        addLogEntry("Modification des paramètres", "Les préférences de facturation ont été mises à jour.");
        setBillingSuccessMessage("Préférences de facturation enregistrées avec succès !");
        setTimeout(() => setBillingSuccessMessage(''), 3000);
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setProfileData(prev => ({ ...prev, logoUrl: event.target!.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArchiveOldData = () => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const archiveItem = (item: any) => ({ ...item, isArchived: true });

        dataContext.setStudioProjects(prev => prev.map(p => new Date(p.startDate) < oneYearAgo ? archiveItem(p) : p));
        dataContext.setDecorOrders(prev => prev.map(o => new Date(o.orderDate) < oneYearAgo ? archiveItem(o) : o));
        dataContext.setShopOrders(prev => prev.map(o => new Date(o.orderDate) < oneYearAgo ? archiveItem(o) : o));
        dataContext.setStudents(prev => prev.map(s => new Date(s.registrationDate) < oneYearAgo ? archiveItem(s) : s));
        dataContext.setPurchaseOrders(prev => prev.map(p => new Date(p.orderDate) < oneYearAgo ? archiveItem(p) : p));
        
        addLogEntry("Maintenance", "Archivage des données de plus d'un an.");
        showAlert("Opération réussie", "Les anciennes données ont été archivées avec succès.");
    };
    
    const handleRestoreArchivedData = () => {
        const restoreItem = (item: any) => ({ ...item, isArchived: false });
        
        const restoreAll = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
            setter(prev => prev.map(item => item.isArchived ? restoreItem(item) : item));
        };
        
        restoreAll(dataContext.setUsers);
        restoreAll(dataContext.setClients);
        restoreAll(dataContext.setStudents);
        restoreAll(dataContext.setFormations);
        restoreAll(dataContext.setFormateurs);
        restoreAll(dataContext.setStudioProjects);
        restoreAll(dataContext.setStudioServices);
        restoreAll(dataContext.setDecorOrders);
        restoreAll(dataContext.setDecorServices);
        restoreAll(dataContext.setArticles);
        restoreAll(dataContext.setSuppliers);
        restoreAll(dataContext.setEmployees);
        restoreAll(dataContext.setShopOrders);
        restoreAll(dataContext.setPurchaseOrders);
        
        addLogEntry("Maintenance", "Toutes les données archivées ont été restaurées.");
        showAlert("Opération réussie", "Toutes les données archivées ont été restaurées avec succès.");
    };

    const handleClearTransactionalData = () => {
        setTransactions([]);
        setStudents([]);
        setPaiements([]);
        setStudioProjects([]);
        setDecorOrders([]);
        setShopOrders([]);
        setPayrolls([]);
        setPurchaseOrders([]);
        setStockMovements([]);
        addLogEntry("Maintenance", "Toutes les données transactionnelles ont été effacées (action dangereuse).");
        showAlert("Opération réussie", "Les données de test ont été vidées avec succès.");
    };

    const TabButton: React.FC<{ tab: SettingsTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
                activeTab === tab 
                ? 'bg-pgs-blue text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            <Icon className="h-5 w-5 mr-3" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Paramètres</h1>
                 <button onClick={handleClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700" title="Retourner à la page précédente">Fermer</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md h-fit">
                    <nav className="space-y-2">
                         {availableTabs.map(tab => (
                            <TabButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} />
                        ))}
                    </nav>
                </aside>

                <main className="md:col-span-3">
                    {activeTab === 'users' && hasPermission(Permission.MANAGE_USERS_ROLES) && <Users />}
                    {activeTab === 'roles' && hasPermission(Permission.MANAGE_USERS_ROLES) && <RoleManager />}
                    {activeTab === 'activity' && hasPermission(Permission.VIEW_ACTIVITY_LOG) && <ActivityLogViewer logs={activityLog} users={dataContext.users} />}
                    {activeTab === 'archives' && hasPermission(Permission.MANAGE_SETTINGS) && <ArchiveManager />}
                    {activeTab === 'general' && hasPermission(Permission.MANAGE_SETTINGS) && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                                <h2 className="text-2xl font-bold mb-4 border-b pb-2 flex items-center"><LockClosedIcon className="h-6 w-6 mr-3 text-yellow-500"/>Sécurité de l'Application</h2>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <div>
                                        <label htmlFor="app-lock-toggle" className="font-semibold text-yellow-800 dark:text-yellow-200">Verrouiller l'application (mode lecture seule)</label>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Active le mode lecture seule. Toutes les actions de création, modification et suppression seront désactivées pour tous les utilisateurs.</p>
                                    </div>
                                    <label htmlFor="app-lock-toggle" className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id="app-lock-toggle" className="sr-only" checked={isAppLocked} onChange={(e) => setIsAppLocked(e.target.checked)} />
                                            <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isAppLocked ? 'transform translate-x-6 bg-pgs-blue' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                                <form onSubmit={handleProfileFormSubmit}>
                                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Profil de l'Entreprise</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1 flex flex-col items-center">
                                            <label className="block text-sm font-medium mb-2">Logo</label>
                                            <div className="relative">
                                                <img src={profileData.logoUrl} alt="Logo" className="h-32 w-32 rounded-full object-cover border-4 border-gray-300" />
                                                <label htmlFor="logoUpload" className="absolute bottom-0 right-0 bg-pgs-blue text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                                                    <CameraIcon className="h-5 w-5" />
                                                    <input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={handleProfileImageChange} />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2"><label className="block text-sm font-medium">Nom de l'entreprise</label><input type="text" value={profileData.nom} onChange={e => setProfileData({...profileData, nom: e.target.value})} className="input-style w-full mt-1" required /></div>
                                            <div><label className="block text-sm font-medium">NIF (ID Fiscale)</label><input type="text" value={profileData.nif} onChange={e => setProfileData({...profileData, nif: e.target.value})} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">RCCM</label><input type="text" value={profileData.rccm || ''} onChange={e => setProfileData({...profileData, rccm: e.target.value})} className="input-style w-full mt-1" /></div>
                                            <div className="md:col-span-2"><label className="block text-sm font-medium">Adresse</label><input type="text" value={profileData.adresse} onChange={e => setProfileData({...profileData, adresse: e.target.value})} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Téléphone</label><input type="tel" value={profileData.telephone} onChange={e => setProfileData({...profileData, telephone: e.target.value})} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Email</label><input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="input-style w-full mt-1" /></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center mt-6 pt-4 border-t">
                                        {profileSuccessMessage && <p className="text-green-600 text-sm flex-grow">{profileSuccessMessage}</p>}
                                        <button type="submit" className="btn-primary bg-pgs-blue hover:bg-blue-700">Enregistrer les informations</button>
                                    </div>
                                </form>
                            </div>

                             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                                <form onSubmit={handleBillingFormSubmit}>
                                    <h2 className="text-2xl font-bold mb-4 border-b pb-2">Préférences de Facturation et Numérotation</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Devis</label><input type="text" value={billingData.quotePrefix} onChange={e => setBillingData(prev => ({...prev, quotePrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.quoteNextNumber} onChange={e => setBillingData(prev => ({...prev, quoteNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Facture Proforma</label><input type="text" value={billingData.proformaPrefix} onChange={e => setBillingData(prev => ({...prev, proformaPrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.proformaNextNumber} onChange={e => setBillingData(prev => ({...prev, proformaNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                         <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Facture Définitive</label><input type="text" value={billingData.invoicePrefix} onChange={e => setBillingData(prev => ({...prev, invoicePrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.invoiceNextNumber} onChange={e => setBillingData(prev => ({...prev, invoiceNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Bon Livraison</label><input type="text" value={billingData.deliveryNotePrefix} onChange={e => setBillingData(prev => ({...prev, deliveryNotePrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.deliveryNoteNextNumber} onChange={e => setBillingData(prev => ({...prev, deliveryNoteNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Reçu de Paiement</label><input type="text" value={billingData.receiptPrefix} onChange={e => setBillingData(prev => ({...prev, receiptPrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.receiptNextNumber} onChange={e => setBillingData(prev => ({...prev, receiptNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 items-end">
                                            <div><label className="block text-sm font-medium">Préfixe Contrat</label><input type="text" value={billingData.contratPrefix} onChange={e => setBillingData(prev => ({...prev, contratPrefix: e.target.value}))} className="input-style w-full mt-1" /></div>
                                            <div><label className="block text-sm font-medium">Prochain N°</label><input type="number" min="1" value={billingData.contratNextNumber} onChange={e => setBillingData(prev => ({...prev, contratNextNumber: +e.target.value}))} className="input-style w-full mt-1" /></div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium">Pied de page par défaut des factures</label>
                                            <textarea value={billingData.defaultFooter} onChange={e => setBillingData(prev => ({...prev, defaultFooter: e.target.value}))} rows={3} className="input-style w-full mt-1"></textarea>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center mt-6 pt-4 border-t">
                                        {billingSuccessMessage && <p className="text-green-600 text-sm flex-grow">{billingSuccessMessage}</p>}
                                        <button type="submit" className="btn-primary bg-pgs-blue hover:bg-blue-700">Enregistrer les préférences</button>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Gestion des Données</h2>
                                <p className="text-sm text-gray-500 mb-6">Actions de maintenance sur la base de données. Ces actions sont irréversibles.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button type="button" onClick={() => setIsArchiveModalOpen(true)} className="flex items-center justify-center space-x-2 p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                                        <ArchiveBoxIcon className="h-5 w-5"/>
                                        <span>Archiver les anciennes données</span>
                                    </button>
                                    <button type="button" onClick={() => setIsRestoreModalOpen(true)} className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                        <ArrowUturnDownIcon className="h-5 w-5"/>
                                        <span>Restaurer les archives</span>
                                    </button>
                                     <button type="button" onClick={() => setIsClearModalOpen(true)} className="flex items-center justify-center space-x-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                        <TrashIcon className="h-5 w-5"/>
                                        <span>Vider les données de test</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            <ConfirmationModal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={handleArchiveOldData}
                title="Confirmer l'archivage"
                message="Voulez-vous vraiment archiver toutes les données de plus d'un an ? Cette action est réversible via la restauration."
            />
            <ConfirmationModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                onConfirm={handleRestoreArchivedData}
                title="Confirmer la restauration"
                message="Voulez-vous vraiment restaurer TOUTES les données archivées dans le système ?"
            />
             <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleClearTransactionalData}
                title="Confirmer la suppression des données"
                message="ATTENTION ! Vous allez supprimer toutes les données transactionnelles (commandes, projets, étudiants, finances...). Les utilisateurs, produits et fournisseurs seront conservés. Cette action est IRREVERSIBLE. Êtes-vous certain ?"
            />

        </div>
    );
};

export default Settings;