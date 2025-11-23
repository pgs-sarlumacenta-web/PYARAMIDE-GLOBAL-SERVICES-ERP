import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, usePermissions } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { Transaction, Permission, ExpenseCategory, Budget, Department } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import ReportModal from '../components/ReportModal.tsx';
import FinanceStats from '../components/finances/FinanceStats.tsx';
import CashFlowAnalysis from '../components/finances/CashFlowAnalysis.tsx';
import CompteDeResultatReport from '../components/finances/CompteDeResultatReport.tsx';
import { PlusIcon, PencilIcon, TrashIcon, ChartPieIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../context/AlertContext.tsx';

type Tab = 'dashboard' | 'cashflow' | 'transactions' | 'budgets';

const initialTransactionState: Omit<Transaction, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    department: 'Général',
    description: '',
    amount: 0,
    type: 'Dépense',
    category: 'Autre',
};

const initialBudgetState: Omit<Budget, 'id'> = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    scope: 'department',
    scopeId: 'Général',
    amount: 0,
};

const departments: Department[] = ['Général', 'Académie', 'Studio', 'Décor', 'Shop', 'Achats'];
const expenseCategories: ExpenseCategory[] = ['Salaires', 'Loyer', 'Fournitures', 'Marketing', 'Services Publics', 'Achats Matières Premières', 'Honoraires', 'Autre'];


const Finances: React.FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { showAlert } = useAlert();
    const { setFabConfig } = useFab();
    const {
        transactions, setTransactions,
        budgets, setBudgets,
        companyProfile,
        addLogEntry
    } = useData();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Transaction | Budget | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'transaction' | 'budget' } | null>(null);

    const [newTransactionData, setNewTransactionData] = useState<Omit<Transaction, 'id'>>(initialTransactionState);
    const [newBudgetData, setNewBudgetData] = useState<Omit<Budget, 'id'>>(initialBudgetState);


    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        type: 'Tous',
        department: 'Tous',
        startDate: '',
        endDate: '',
    });
    
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => !t.isArchived)
            .filter(t => {
                if (filters.type !== 'Tous' && t.type !== filters.type) return false;
                if (filters.department !== 'Tous' && t.department !== filters.department) return false;
                const tDate = new Date(t.date);
                if (filters.startDate && tDate < new Date(filters.startDate)) return false;
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (tDate > endDate) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filters]);

    const openAddModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewTransactionData(initialTransactionState);
        setIsModalOpen(true);
    }, []);

    const openAddBudgetModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewBudgetData(initialBudgetState);
        setIsBudgetModalOpen(true);
    }, []);


    useEffect(() => {
        if (selectedTransaction) {
            setFabConfig(null);
            return;
        }

        let config = null;
        if (activeTab === 'transactions' && hasPermission(Permission.MANAGE_FINANCES)) {
            config = { onClick: openAddModal, title: "Nouvelle Transaction" };
        } else if (activeTab === 'budgets' && hasPermission(Permission.MANAGE_BUDGETS)) {
            config = { onClick: openAddBudgetModal, title: "Nouveau Budget" };
        }
        setFabConfig(config);

        return () => setFabConfig(null);
    }, [activeTab, hasPermission, setFabConfig, openAddModal, selectedTransaction, openAddBudgetModal]);

    const handleClose = () => navigate(-1);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...newTransactionData,
            amount: newTransactionData.type === 'Dépense' ? -Math.abs(newTransactionData.amount) : Math.abs(newTransactionData.amount),
        };
        
        if (isEditing && currentItem && 'description' in currentItem) {
            const updatedTransaction = { ...dataToSave, id: currentItem.id };
            setTransactions(prev => prev.map(t => t.id === currentItem.id ? updatedTransaction : t));
            setSelectedTransaction(updatedTransaction);
            addLogEntry('Modification', `A modifié la transaction: ${dataToSave.description}`, 'transaction', currentItem.id);
        } else {
            const newId = `TR-${Date.now()}`;
            setTransactions(prev => [{ ...dataToSave, id: newId }, ...prev]);
            addLogEntry('Création', `A créé la transaction: ${dataToSave.description}`, 'transaction', newId);
        }
        setIsModalOpen(false);
    };

    const handleBudgetFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && currentItem && 'scope' in currentItem) {
            setBudgets(prev => prev.map(b => b.id === currentItem.id ? { ...newBudgetData, id: b.id } as Budget : b));
            addLogEntry('Modification', `A modifié le budget pour ${newBudgetData.scopeId}`, 'budget', currentItem.id);
        } else {
            const newId = `BUD-${Date.now()}`;
            setBudgets(prev => [{ ...newBudgetData, id: newId } as Budget, ...prev]);
            addLogEntry('Création', `A créé un budget pour ${newBudgetData.scopeId}`, 'budget', newId);
        }
        setIsBudgetModalOpen(false);
    };
    
    const openEditModal = (transaction: Transaction) => {
        setIsEditing(true);
        setCurrentItem(transaction);
        setNewTransactionData(transaction);
        setIsModalOpen(true);
    };

    const openEditBudgetModal = (budget: Budget) => {
        setIsEditing(true);
        setCurrentItem(budget);
        setNewBudgetData(budget);
        setIsBudgetModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        
        if (type === 'transaction') {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
            addLogEntry('Archivage', `A archivé la transaction ${name}`, 'transaction', id);
            if (selectedTransaction?.id === id) setSelectedTransaction(null);
        } else if (type === 'budget') {
            setBudgets(prev => prev.map(b => b.id === id ? { ...b, isArchived: true } : b));
            addLogEntry('Archivage', `A archivé le budget ${name}`, 'budget', id);
        }
        
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        showAlert('Succès', 'Élément archivé.');
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const periodTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= start && date <= end;
        });
        
        const revenueByDept = periodTransactions.filter(t => t.type === 'Revenu').reduce<Record<string, number>>((acc, t) => {
            acc[t.department] = (acc[t.department] || 0) + t.amount;
            return acc;
        }, {});
        
        const expenseByCategory = periodTransactions.filter(t => t.type === 'Dépense').reduce<Record<string, number>>((acc, t) => {
            const category = t.category || 'Autre';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {});

        const totalRevenue = Object.values(revenueByDept).reduce<number>((sum, amount) => sum + (amount as number), 0);
        const totalExpense = Object.values(expenseByCategory).reduce<number>((sum, amount) => sum + (amount as number), 0);
        const netResult = totalRevenue + totalExpense;
        
        const reportData = {
            revenueByDept, expenseByCategory, totalRevenue, totalExpense, netResult, transactions: periodTransactions
        };

        const periodStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        
        setDocumentToDownload({
            title: `Compte de Résultat - ${periodStr}`,
            content: <CompteDeResultatReport data={reportData} period={periodStr} companyProfile={companyProfile} />,
            format: 'pdf',
        });
    };

    const handleExport = () => {
        if (filteredTransactions.length === 0) {
            showAlert('Information', 'Aucune transaction à exporter.');
            return;
        }
        const dataToExport = filteredTransactions.map(t => ({
            'Date': new Date(t.date).toLocaleDateString('fr-CA'),
            'Description': t.description,
            'Département': t.department,
            'Type': t.type,
            'Catégorie': t.category || '',
            'Montant': t.amount,
        }));
    
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
        link.setAttribute('download', 'transactions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-finances-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {label}
        </button>
    );
    
    const renderTransactionDetailView = () => {
        if (!selectedTransaction) return null;

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <div>
                            <h2 className="text-3xl font-bold">Détail de la Transaction</h2>
                            <p className="text-gray-500 font-mono text-sm">#{selectedTransaction.id}</p>
                        </div>
                    </div>
                    {hasPermission(Permission.MANAGE_FINANCES) && 
                        <div className="flex items-center space-x-2">
                            <button onClick={() => openEditModal(selectedTransaction)} className="btn-secondary flex items-center"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                            <button onClick={() => { setItemToDelete({id: selectedTransaction.id, name: selectedTransaction.description, type: 'transaction'}); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50 flex items-center"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                <p className="font-semibold text-lg">{selectedTransaction.description}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                <p>{new Date(selectedTransaction.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="space-y-6 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 border-gray-200 dark:border-gray-700">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                                <p className={`font-bold text-3xl ${selectedTransaction.type === 'Revenu' ? 'text-green-500' : 'text-red-500'}`}>
                                    {selectedTransaction.amount.toLocaleString()} GNF
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Département</p>
                                <p>{selectedTransaction.department}</p>
                            </div>
                            {selectedTransaction.type === 'Dépense' && selectedTransaction.category && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Catégorie de Dépense</p>
                                    <p>{selectedTransaction.category}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-finances-blue">Finances</h1>
                {!selectedTransaction && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>
                        <button onClick={handleClose} className="btn-secondary">Fermer</button>
                    </div>
                )}
            </div>

            {selectedTransaction ? renderTransactionDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4">
                        <TabButton tab="dashboard" label="Tableau de Bord" />
                        <TabButton tab="cashflow" label="Flux de Trésorerie" />
                        <TabButton tab="transactions" label="Transactions" />
                        <TabButton tab="budgets" label="Budgets" />
                    </div>
                    
                    {activeTab === 'dashboard' && <FinanceStats />}
                    {activeTab === 'cashflow' && <CashFlowAnalysis />}
                    
                    {activeTab === 'transactions' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="input-style"><option value="Tous">Tous Types</option><option value="Revenu">Revenu</option><option value="Dépense">Dépense</option></select>
                                <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} className="input-style"><option value="Tous">Tous Départements</option>{departments.map(d => <option key={d}>{d}</option>)}</select>
                                <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="input-style" />
                                <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="input-style" />
                                <button onClick={handleExport} className="btn-secondary h-full flex items-center justify-center">
                                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                    Exporter (CSV)
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className="border-b"><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Département</th><th className="p-2">Catégorie</th><th className="p-2 text-right">Montant</th></tr></thead>
                                    <tbody>
                                        {filteredTransactions.map(t => (
                                            <tr key={t.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedTransaction(t)}>
                                                <td>{new Date(t.date).toLocaleDateString()}</td>
                                                <td>{t.description}</td>
                                                <td>{t.department}</td>
                                                <td>{t.category || 'N/A'}</td>
                                                <td className={`font-semibold text-right ${t.type === 'Revenu' ? 'text-green-600' : 'text-red-600'}`}>{t.amount.toLocaleString()} GNF</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                     {activeTab === 'budgets' && (
                        <div className="animate-fade-in">
                            <table className="w-full text-left text-sm">
                                <thead><tr className="border-b"><th className="p-2">Période</th><th className="p-2">Portée</th><th className="p-2">Nom</th><th className="p-2 text-right">Montant</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>
                                    {budgets.filter(b => !b.isArchived).map(b => (
                                        <tr key={b.id} className="border-b">
                                            <td className="p-2">{b.month}/{b.year}</td>
                                            <td className="p-2">{b.scope === 'department' ? 'Département' : 'Catégorie'}</td>
                                            <td className="p-2">{b.scopeId}</td>
                                            <td className="p-2 text-right">{b.amount.toLocaleString()} GNF</td>
                                            <td className="p-2">
                                                {hasPermission(Permission.MANAGE_BUDGETS) && (
                                                    <div className="flex items-center space-x-1">
                                                        <button onClick={() => openEditBudgetModal(b)} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button>
                                                        <button onClick={() => { setItemToDelete({ id: b.id, name: `budget pour ${b.scopeId}`, type: 'budget' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Modifier la Transaction' : 'Nouvelle Transaction'}>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Date</label><input type="date" value={newTransactionData.date} onChange={e=>setNewTransactionData({...newTransactionData, date: e.target.value})} className="input-style" required/></div>
                        <div><label>Type</label><select value={newTransactionData.type} onChange={e=>setNewTransactionData({...newTransactionData, type: e.target.value as any})} className="input-style" required><option>Revenu</option><option>Dépense</option></select></div>
                    </div>
                    <div><label>Description</label><input type="text" value={newTransactionData.description} onChange={e=>setNewTransactionData({...newTransactionData, description: e.target.value})} className="input-style" required/></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label>Montant (GNF)</label><input type="number" value={Math.abs(newTransactionData.amount)} onChange={e=>setNewTransactionData({...newTransactionData, amount: +e.target.value})} className="input-style" required/></div>
                        <div><label>Département</label><select value={newTransactionData.department} onChange={e=>setNewTransactionData({...newTransactionData, department: e.target.value as any})} className="input-style" required>{departments.map(d => <option key={d}>{d}</option>)}</select></div>
                    </div>
                    {newTransactionData.type === 'Dépense' && (
                         <div><label>Catégorie de Dépense</label><select value={newTransactionData.category} onChange={e=>setNewTransactionData({...newTransactionData, category: e.target.value as any})} className="input-style"><option value="">-- Sélectionner --</option>{expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    )}
                    <div className="flex justify-end pt-4"><button type="submit" className="btn-primary bg-finances-blue">{isEditing ? 'Enregistrer' : 'Ajouter'}</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title={isEditing ? "Modifier le Budget" : "Nouveau Budget"}>
                <form onSubmit={handleBudgetFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Année</label><input type="number" value={newBudgetData.year} onChange={e => setNewBudgetData({...newBudgetData, year: +e.target.value})} className="input-style" required /></div>
                        <div><label>Mois</label><input type="number" min="1" max="12" value={newBudgetData.month} onChange={e => setNewBudgetData({...newBudgetData, month: +e.target.value})} className="input-style" required /></div>
                    </div>
                    <div><label>Portée</label><select value={newBudgetData.scope} onChange={e => setNewBudgetData({...newBudgetData, scope: e.target.value as any, scopeId: (e.target.value === 'department' ? departments[0] : expenseCategories[0])})} className="input-style" required><option value="department">Département</option><option value="category">Catégorie de Dépense</option></select></div>
                    <div><label>Nom</label>
                        <select value={newBudgetData.scopeId} onChange={e => setNewBudgetData({...newBudgetData, scopeId: e.target.value as any})} className="input-style" required>
                            {(newBudgetData.scope === 'department' ? departments : expenseCategories).map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div><label>Montant du Budget (GNF)</label><input type="number" value={newBudgetData.amount} onChange={e => setNewBudgetData({...newBudgetData, amount: +e.target.value})} className="input-style" required /></div>
                    <div className="flex justify-end pt-4"><button type="submit" className="btn-primary bg-finances-blue">{isEditing ? "Enregistrer" : "Créer"}</button></div>
                </form>
            </Modal>
            
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver "${itemToDelete?.name}" ?`}/>
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer un Rapport Financier" />
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
        </div>
    );
};

export default Finances;