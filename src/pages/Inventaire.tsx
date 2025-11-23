
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions } from '../context/DataContext.tsx';
import { Materiel, Permission, Article, ItemCategory } from '../types.ts';
import { PlusIcon, PencilIcon, TrashIcon, ChartPieIcon, EyeIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import InventaireDashboard from '../components/inventaire/InventaireDashboard.tsx';
import ReportModal from '../components/ReportModal.tsx';
import InventaireReport from '../components/inventaire/InventaireReport.tsx';
import DocumentViewer from '../components/DocumentViewer.tsx';
import { useFab } from '../context/FabContext.tsx';
import ProductDetailModal from '../components/shop/ProductDetailModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';


type Tab = 'dashboard' | 'liste';
type ListTab = 'materiel' | 'articles' | 'categories';

const initialMaterielState: Omit<Materiel, 'id'> = {
    name: '',
    categoryId: '',
    status: 'En service',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
};

const initialArticleState: Omit<Article, 'id'> = {
    name: '',
    categoryId: '',
    supplierId: '',
    stock: 0,
    alertThreshold: 10,
    purchasePrice: 0,
    isSellable: false,
    sellingPrice: 0,
    isConsumable: false,
    consumptionUnit: 'unité',
};

const initialCategoryState: Omit<ItemCategory, 'id'> = { name: '' };


const Inventaire: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();
    const {
        materiels, setMateriels,
        articles, setArticles,
        employees,
        suppliers,
        itemCategories, setItemCategories,
        companyProfile,
        shopOrders,
        clients,
    } = useData();
    
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [listTab, setListTab] = useState<ListTab>('articles');

    // Modals for Materiel
    const [isMaterielModalOpen, setIsMaterielModalOpen] = useState(false);
    const [isEditingMateriel, setIsEditingMateriel] = useState(false);
    const [currentMateriel, setCurrentMateriel] = useState<Materiel | null>(null);
    const [newMaterielData, setNewMaterielData] = useState<Omit<Materiel, 'id'>>(initialMaterielState);

    // Modals for Articles
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isArticleDetailModalOpen, setIsArticleDetailModalOpen] = useState(false);
    const [isEditingArticle, setIsEditingArticle] = useState(false);
    const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
    const [newArticleData, setNewArticleData] = useState<Omit<Article, 'id'>>(initialArticleState);

    // Modals for Categories
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<ItemCategory | null>(null);
    const [newCategoryData, setNewCategoryData] = useState(initialCategoryState);

    // Generic Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'materiel' | 'article' | 'category' } | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [documentContent, setDocumentContent] = useState<React.ReactNode>(null);
    const [documentTitle, setDocumentTitle] = useState('');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [categoryFilter, setCategoryFilter] = useState('Tous');
    const [expirationFilter, setExpirationFilter] = useState('Tous');
    const [stockFilter, setStockFilter] = useState('Tous');

     useEffect(() => {
        const state = location.state as { selectedId?: string };
        if (state?.selectedId) {
            const itemToSelect = articles.find(a => a.id === state.selectedId && !a.isArchived);
            if (itemToSelect) {
                setCurrentArticle(itemToSelect);
                setIsArticleDetailModalOpen(true);
                setActiveTab('liste');
                setListTab('articles');
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, articles, navigate]);

    const filteredMateriels = useMemo(() => {
        return materiels.filter(m =>
            !m.isArchived &&
            (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.serialNumber && m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))) &&
            (statusFilter === 'Tous' || m.status === statusFilter) &&
            (categoryFilter === 'Tous' || m.categoryId === categoryFilter)
        );
    }, [materiels, searchTerm, statusFilter, categoryFilter]);
    
    const filteredArticles = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return articles.filter(a => {
            if (a.isArchived) return false;
            if (!a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (categoryFilter !== 'Tous' && a.categoryId !== categoryFilter) return false;
            if (stockFilter === 'Faible' && a.stock > a.alertThreshold) return false;

            if (expirationFilter !== 'Tous' && a.datePeremption) {
                const expirationDate = new Date(a.datePeremption);
                if (expirationFilter === 'Périmé' && expirationDate >= now) return false;
                if (expirationFilter === 'Bientôt' && (expirationDate < now || expirationDate > thirtyDaysFromNow)) return false;
            } else if (expirationFilter !== 'Tous' && !a.datePeremption) {
                return false;
            }

            return true;
        });
    }, [articles, searchTerm, categoryFilter, expirationFilter, stockFilter]);

    // FAB Management
    const openAddMaterielModal = useCallback(() => {
        setIsEditingMateriel(false);
        setCurrentMateriel(null);
        setNewMaterielData({ ...initialMaterielState, categoryId: itemCategories[0]?.id || '' });
        setIsMaterielModalOpen(true);
    }, [itemCategories]);
    
    const openAddArticleModal = useCallback(() => {
        setIsEditingArticle(false);
        setCurrentArticle(null);
        setNewArticleData({ ...initialArticleState, categoryId: itemCategories[0]?.id || '', supplierId: suppliers[0]?.id || '' });
        setIsArticleModalOpen(true);
    }, [itemCategories, suppliers]);

    const openAddCategoryModal = useCallback(() => {
        setIsEditingCategory(false);
        setCurrentCategory(null);
        setNewCategoryData(initialCategoryState);
        setIsCategoryModalOpen(true);
    }, []);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_INVENTAIRE)) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'liste') {
            if (listTab === 'materiel') {
                config = { onClick: openAddMaterielModal, title: "Ajouter Matériel" };
            } else if (listTab === 'articles') {
                config = { onClick: openAddArticleModal, title: "Ajouter Article" };
            } else if (listTab === 'categories') {
                config = { onClick: openAddCategoryModal, title: "Nouvelle Catégorie" };
            }
        }
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, listTab, hasPermission, setFabConfig, openAddMaterielModal, openAddArticleModal, openAddCategoryModal]);
    
    const handleClose = () => navigate('/dashboard');
    
    // Materiel Handlers
    const openEditMaterielModal = (materiel: Materiel) => {
        setIsEditingMateriel(true);
        setCurrentMateriel(materiel);
        setNewMaterielData(materiel);
        setIsMaterielModalOpen(true);
    };
    
    const handleMaterielFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...newMaterielData, purchasePrice: +newMaterielData.purchasePrice };
        if (isEditingMateriel && currentMateriel) {
            setMateriels(materiels.map(m => m.id === currentMateriel.id ? { ...dataToSave, id: m.id } : m));
        } else {
            const newId = `MAT-${Date.now()}`;
            setMateriels(prev => [{ ...dataToSave, id: newId }, ...prev]);
        }
        setIsMaterielModalOpen(false);
    };
    
    // Article Handlers
    const openEditArticleModal = (article: Article) => {
        setIsEditingArticle(true);
        setCurrentArticle(article);
        setNewArticleData(article);
        setIsArticleModalOpen(true);
    };

    const openDetailArticleModal = (article: Article) => {
        setCurrentArticle(article);
        setIsArticleDetailModalOpen(true);
    };
    
    const handleArticleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...newArticleData, purchasePrice: +newArticleData.purchasePrice, sellingPrice: +(newArticleData.sellingPrice || 0) };
        if(isEditingArticle && currentArticle) {
            setArticles(articles.map(a => a.id === currentArticle.id ? {...dataToSave, id: a.id} : a));
        } else {
            const newId = `ART-${Date.now()}`;
            setArticles(prev => [{...dataToSave, id: newId}, ...prev]);
        }
        setIsArticleModalOpen(false);
    };

    // Category Handlers
    const openEditCategoryModal = (category: ItemCategory) => {
        setIsEditingCategory(true);
        setCurrentCategory(category);
        setNewCategoryData(category);
        setIsCategoryModalOpen(true);
    };

    const handleCategoryFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditingCategory && currentCategory) {
            setItemCategories(prev => prev.map(c => c.id === currentCategory.id ? { ...newCategoryData, id: c.id } as ItemCategory : c));
        } else {
            const newId = `CAT-${Date.now()}`;
            setItemCategories(prev => [...prev, { ...newCategoryData, id: newId }]);
        }
        setIsCategoryModalOpen(false);
    };
    
    // Generic Delete
    const openDeleteModal = (item: {id: string, name: string}, type: 'materiel' | 'article' | 'category') => {
        setItemToDelete({ ...item, type });
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = () => {
        if (!itemToDelete) return;
        if(itemToDelete.type === 'materiel') {
            setMateriels(materiels.map(m => m.id === itemToDelete.id ? { ...m, isArchived: true } : m));
        } else if (itemToDelete.type === 'article') {
            setArticles(articles.map(a => a.id === itemToDelete.id ? { ...a, isArchived: true } : a));
        } else if (itemToDelete.type === 'category') {
            const isInUse = articles.some(a => a.categoryId === itemToDelete.id && !a.isArchived) || 
                            materiels.some(m => m.categoryId === itemToDelete.id && !m.isArchived);
            if (isInUse) {
                showAlert("Action impossible", "Cette catégorie est utilisée par au moins un article ou matériel et ne peut pas être archivée.");
            } else {
                setItemCategories(categories => categories.map(c => c.id === itemToDelete.id ? { ...c, isArchived: true } : c));
            }
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const periodNewAssets = materiels.filter(m => {
            const purchaseDate = new Date(m.purchaseDate);
            return purchaseDate >= start && purchaseDate <= end;
        });
        const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        setDocumentTitle(`Rapport d'Inventaire - ${period}`);
        setDocumentContent(<InventaireReport newAssets={periodNewAssets} period={period} companyProfile={companyProfile} />);
        setIsDocumentModalOpen(true);
    };

    const handleExport = () => {
        let dataToExport: any[] = [];
        let fileName = '';
    
        if (listTab === 'articles') {
            if (filteredArticles.length === 0) {
                showAlert('Information', 'Aucun article à exporter.');
                return;
            }
            dataToExport = filteredArticles.map(a => ({
                'Nom': a.name,
                'Catégorie': itemCategories.find(c => c.id === a.categoryId)?.name || 'N/A',
                'Stock': a.stock,
                'Seuil Alerte': a.alertThreshold,
                'Prix Achat': a.purchasePrice,
                'Vendable': a.isSellable ? 'Oui' : 'Non',
                'Prix Vente': a.sellingPrice || 0,
                'Consommable': a.isConsumable ? 'Oui' : 'Non',
                'Unité': a.consumptionUnit || '',
                'Date Péremption': a.datePeremption || '',
            }));
            fileName = 'stock_articles';
        } else if (listTab === 'materiel') {
            if (filteredMateriels.length === 0) {
                showAlert('Information', 'Aucun matériel à exporter.');
                return;
            }
            dataToExport = filteredMateriels.map(m => ({
                'Nom': m.name,
                'N° Série': m.serialNumber || '',
                'Catégorie': itemCategories.find(c => c.id === m.categoryId)?.name || 'N/A',
                'Statut': m.status,
                'Date Achat': new Date(m.purchaseDate).toLocaleDateString('fr-CA'),
                'Prix Achat': m.purchasePrice,
                'Assigné à': employees.find(e => e.id === m.assignedTo)?.name || '',
            }));
            fileName = 'inventaire_materiel';
        } else {
            return;
        }
    
        if (dataToExport.length === 0) return;
    
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

    const getStatusClass = (status: Materiel['status']) => ({
        'En service': 'bg-green-100 text-green-800', 'En maintenance': 'bg-yellow-100 text-yellow-800',
        'Hors service': 'bg-red-100 text-red-800', 'Stocké': 'bg-blue-100 text-blue-800'
    })[status];

    const getExpirationInfo = (datePeremption?: string) => {
        if (!datePeremption) return { text: 'N/A', className: '' };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expirationDate = new Date(datePeremption);
        
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        let className = '';
        if (expirationDate < now) {
            className = 'text-red-500 font-bold';
        } else if (expirationDate <= thirtyDaysFromNow) {
            className = 'text-orange-500 font-semibold';
        }
        
        return { text: expirationDate.toLocaleDateString('fr-FR'), className };
    };
    
    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => ( <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-admin-gray text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button> );
    const ListTabButton: React.FC<{ tab: ListTab, label: string }> = ({ tab, label }) => ( <button onClick={() => setListTab(tab)} className={`px-3 py-1.5 text-sm rounded-md ${listTab === tab ? 'bg-slate-200 dark:bg-slate-600 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{label}</button> );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-admin-gray">Inventaire & Stock</h1>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>
                    <button onClick={handleClose} className="btn-secondary">Fermer</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex space-x-2 border-b mb-4">
                    <TabButton tab="dashboard" label="Tableau de Bord & Stats" />
                    <TabButton tab="liste" label="Listes Détaillées" />
                </div>

                {activeTab === 'dashboard' && <InventaireDashboard articles={articles} materiels={materiels} itemCategories={itemCategories} />}

                {activeTab === 'liste' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg max-w-md">
                                <ListTabButton tab="articles" label="Stock d'Articles" />
                                <ListTabButton tab="materiel" label="Matériel" />
                                <ListTabButton tab="categories" label="Catégories" />
                            </div>
                            {listTab !== 'categories' && hasPermission(Permission.MANAGE_INVENTAIRE) &&
                                <button onClick={handleExport} className="btn-secondary flex items-center">
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    Exporter (CSV)
                                </button>
                            }
                        </div>

                        {listTab === 'materiel' && (
                            <div className="animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <input type="text" placeholder="Rechercher par nom ou série..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style md:col-span-2" />
                                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-style">
                                        <option value="Tous">Toutes les catégories</option>
                                        {itemCategories.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-style">
                                        <option value="Tous">Tous les statuts</option>
                                        <option>En service</option><option>En maintenance</option><option>Hors service</option><option>Stocké</option>
                                    </select>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr><th className="p-2">Nom</th><th className="p-2">Catégorie</th><th className="p-2">Statut</th><th className="p-2">Assigné à</th><th className="p-2">Actions</th></tr></thead>
                                        <tbody>
                                            {filteredMateriels.map(m => (
                                                <tr key={m.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="p-2 font-medium">{m.name}</td>
                                                    <td className="p-2">{itemCategories.find(c => c.id === m.categoryId)?.name || 'N/A'}</td>
                                                    <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(m.status)}`}>{m.status}</span></td>
                                                    <td className="p-2">{employees.find(e => e.id === m.assignedTo)?.name || 'N/A'}</td>
                                                    <td className="p-2">{hasPermission(Permission.MANAGE_INVENTAIRE) && <div className="flex items-center space-x-1"><button onClick={() => openEditMaterielModal(m)} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button><button onClick={() => openDeleteModal(m, 'materiel')} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button></div>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {listTab === 'articles' && (
                             <div className="animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <input type="text" placeholder="Rechercher par nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style" />
                                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-style">
                                        <option value="Tous">Toutes les catégories</option>
                                        {itemCategories.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <select value={expirationFilter} onChange={e => setExpirationFilter(e.target.value)} className="input-style">
                                        <option value="Tous">Péremption (Tous)</option>
                                        <option value="Périmé">Périmé</option>
                                        <option value="Bientôt">Expire Bientôt</option>
                                    </select>
                                     <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input-style">
                                        <option value="Tous">Statut stock (Tous)</option>
                                        <option value="Faible">Stock Faible</option>
                                    </select>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr><th className="p-2">Nom</th><th className="p-2">Catégorie</th><th className="p-2">Stock</th><th className="p-2">P. Vente</th><th className="p-2">Péremption</th><th className="p-2">Actions</th></tr></thead>
                                        <tbody>
                                            {filteredArticles.map(a => {
                                                const expInfo = getExpirationInfo(a.datePeremption);
                                                return (
                                                <tr key={a.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => openDetailArticleModal(a)}>
                                                    <td className="p-2 font-medium">{a.name}</td>
                                                    <td className="p-2">{itemCategories.find(c => c.id === a.categoryId)?.name || 'N/A'}</td>
                                                    <td className={`p-2 font-bold ${a.stock <= a.alertThreshold ? 'text-red-500' : ''}`}>{a.stock}</td>
                                                    <td className="p-2">{a.isSellable ? (a.sellingPrice || 0).toLocaleString() + ' GNF' : 'N/A'}</td>
                                                    <td className={`p-2 ${expInfo.className}`}>{expInfo.text}</td>
                                                    <td className="p-2" onClick={e => e.stopPropagation()}>{hasPermission(Permission.MANAGE_INVENTAIRE) && <div className="flex items-center space-x-1"><button onClick={() => openDetailArticleModal(a)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full" title="Détails & Historique"><EyeIcon className="h-5 w-5"/></button><button onClick={() => openEditArticleModal(a)} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button><button onClick={() => openDeleteModal(a, 'article')} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button></div>}</td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {listTab === 'categories' && (
                            <div className="animate-fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr><th className="p-2">Nom de la catégorie</th><th className="p-2">Articles</th><th className="p-2">Matériels</th><th className="p-2">Actions</th></tr></thead>
                                        <tbody>
                                            {itemCategories.filter(c => !c.isArchived).map(c => (
                                                <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="p-2 font-medium">{c.name}</td>
                                                    <td className="p-2">{articles.filter(a => a.categoryId === c.id && !a.isArchived).length}</td>
                                                    <td className="p-2">{materiels.filter(m => m.categoryId === c.id && !m.isArchived).length}</td>
                                                    <td className="p-2">{hasPermission(Permission.MANAGE_INVENTAIRE) && <div className="flex items-center space-x-1">
                                                        <button onClick={() => openEditCategoryModal(c)} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                                        <button onClick={() => openDeleteModal(c, 'category')} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                                    </div>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <Modal isOpen={isMaterielModalOpen} onClose={() => setIsMaterielModalOpen(false)} title={isEditingMateriel ? 'Modifier le Matériel' : 'Nouveau Matériel'}>
                <form onSubmit={handleMaterielFormSubmit} className="space-y-4">
                    <div><label>Nom du matériel</label><input type="text" value={newMaterielData.name} onChange={e => setNewMaterielData(prev => ({...prev, name: e.target.value}))} className="input-style w-full" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Catégorie</label><select value={newMaterielData.categoryId} onChange={e => setNewMaterielData(prev => ({...prev, categoryId: e.target.value}))} className="input-style w-full" required>{itemCategories.filter(c => !c.isArchived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label>Statut</label><select value={newMaterielData.status} onChange={e => setNewMaterielData(prev => ({...prev, status: e.target.value as any}))} className="input-style w-full" required><option>En service</option><option>En maintenance</option><option>Hors service</option><option>Stocké</option></select></div>
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsMaterielModalOpen(false)} className="btn-secondary mr-2">Annuler</button><button type="submit" className="btn-primary bg-admin-gray hover:bg-slate-600">{isEditingMateriel ? 'Enregistrer' : 'Ajouter'}</button></div>
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
                         {newArticleData.isConsumable && <div><label>Unité de consommation (ex: m, L, pièce)</label><input type="text" value={newArticleData.consumptionUnit || ''} onChange={e => setNewArticleData(prev => ({...prev, consumptionUnit: e.target.value}))} className="input-style" /></div>}
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsArticleModalOpen(false)} className="btn-secondary mr-2">Annuler</button><button type="submit" className="btn-primary bg-admin-gray hover:bg-slate-600">{isEditingArticle ? 'Enregistrer' : 'Ajouter'}</button></div>
                </form>
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={isEditingCategory ? "Modifier la Catégorie" : "Nouvelle Catégorie"}>
                <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
                    <div>
                        <label>Nom de la catégorie</label>
                        <input type="text" value={newCategoryData.name} onChange={e => setNewCategoryData({name: e.target.value})} className="input-style" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary mr-2">Annuler</button>
                        <button type="submit" className="btn-primary bg-admin-gray hover:bg-slate-600">{isEditingCategory ? 'Enregistrer' : 'Ajouter'}</button>
                    </div>
                </form>
            </Modal>
            
            {currentArticle && <ProductDetailModal isOpen={isArticleDetailModalOpen} onClose={() => setIsArticleDetailModalOpen(false)} article={currentArticle} readOnly={!hasPermission(Permission.MANAGE_INVENTAIRE)} shopOrders={shopOrders} clients={clients} />}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport d'Inventaire"/>
            <DocumentViewer isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title={documentTitle}>{documentContent}</DocumentViewer>
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`}/>
        </div>
    );
};

export default Inventaire;
