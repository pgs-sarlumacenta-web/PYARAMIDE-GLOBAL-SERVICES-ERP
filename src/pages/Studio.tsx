
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { StudioProject, StudioService, Client, Transaction, Permission, StudioIntervenant, StudioProjectIntervenant, StudioIntervenantPayment, Remuneration } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import Devis from '../components/studio/Devis.tsx';
import Facture from '../components/studio/Facture.tsx';
import Contrat from '../components/studio/Contrat.tsx';
import RecuStudio from '../components/studio/RecuStudio.tsx';
import StudioDashboard from '../components/studio/StudioDashboard.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon, ArrowLeftIcon, BanknotesIcon, UserCircleIcon, InformationCircleIcon, XCircleIcon, PresentationChartLineIcon, ClockIcon } from '@heroicons/react/24/outline';
import ReportModal from '../components/ReportModal.tsx';
import StudioReport from '../components/studio/StudioReport.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import AddClientModal from '../components/AddClientModal.tsx';
import EtatPrestationsStudio from '../components/studio/EtatPrestationsStudio.tsx';

type Tab = 'dashboard' | 'projets' | 'services' | 'intervenants';
type DetailTab = 'dashboard' | 'paiements' | 'documents' | 'intervenants_projet';
type IntervenantDetailTab = 'dashboard' | 'projets' | 'paiements';


const initialProjectState: Omit<StudioProject, 'id' | 'devisRef' | 'factureRef' | 'contratRef'> = {
    projectName: '', projectType: 'Single', status: 'Planifié',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    serviceIds: [], discount: 0, amountPaid: 0, clientId: '', technicianId: '',
    receipts: [], intervenants: []
};

const initialServiceState: Omit<StudioService, 'id'> = { name: '', type: 'Audio', tarif: 0, statut: 'Actif' };
const initialIntervenantState: Omit<StudioIntervenant, 'id'> = { name: '', speciality: '', phone: '', email: '', iban: '', avatarUrl: '' };

const getStatusClass = (status: StudioProject['status']) => {
    const classes: { [key in StudioProject['status']]: string } = {
        'Planifié': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        'En cours': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Mixage': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Terminé': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Livré': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return classes[status];
};


export const Studio: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const {
        studioProjects, setStudioProjects,
        studioServices, setStudioServices,
        clients, setClients,
        users,
        studioIntervenants, setStudioIntervenants,
        studioIntervenantPayments, setStudioIntervenantPayments,
        setTransactions,
        companyProfile,
        billingSettings, setBillingSettings,
        addLogEntry
    } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('dashboard');
    const [selectedIntervenant, setSelectedIntervenant] = useState<StudioIntervenant | null>(null);
    const [activeIntervenantDetailTab, setActiveIntervenantDetailTab] = useState<IntervenantDetailTab>('dashboard');

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isIntervenantModalOpen, setIsIntervenantModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isPayIntervenantModalOpen, setIsPayIntervenantModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
    
    const [newProjectData, setNewProjectData] = useState<any>(initialProjectState);
    const [newServiceData, setNewServiceData] = useState(initialServiceState);
    const [newIntervenantData, setNewIntervenantData] = useState<Omit<StudioIntervenant, 'id'>>(initialIntervenantState);
    const [newPaymentData, setNewPaymentData] = useState({ amount: 0 });
    
    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);
    
    const [newProjectIntervenant, setNewProjectIntervenant] = useState<{ intervenantId: string; description: string; remunerationType: 'forfait' | 'pourcentage'; remunerationValue: number }>({ intervenantId: '', description: '', remunerationType: 'forfait', remunerationValue: 0 });

    useEffect(() => {
        const state = location.state as { selectedId?: string, type?: string };
        if (state?.selectedId) {
             if (state.type === 'project') {
                const projectToSelect = studioProjects.find(p => p.id === state.selectedId && !p.isArchived);
                if (projectToSelect) {
                    setSelectedProject(projectToSelect);
                    setActiveTab('projets');
                    navigate(location.pathname, { replace: true, state: {} });
                }
            } else if (state.type === 'intervenant') {
                const intervenantToSelect = studioIntervenants.find(i => i.id === state.selectedId && !i.isArchived);
                if(intervenantToSelect) {
                    setSelectedIntervenant(intervenantToSelect);
                    setActiveTab('intervenants');
                    navigate(location.pathname, { replace: true, state: {} });
                }
            }
        }
    }, [location.state, studioProjects, studioIntervenants, navigate]);


    const openAddProjectModal = useCallback(() => {
        setIsEditing(false); setCurrentItem(null);
        const firstClient = clients.find(c => !c.isArchived);
        const firstUser = users.find(u => u.department === 'Studio');
        setNewProjectData({ ...initialProjectState, clientId: firstClient?.id || '', technicianId: firstUser?.id || users[0]?.id || '' });
        setNewProjectIntervenant({ intervenantId: studioIntervenants.find(i => !i.isArchived)?.id || '', description: '', remunerationType: 'forfait', remunerationValue: 0 });
        setIsProjectModalOpen(true);
    }, [clients, users, studioIntervenants]);

    const openAddServiceModal = useCallback(() => { setIsEditing(false); setCurrentItem(null); setNewServiceData(initialServiceState); setIsServiceModalOpen(true); }, []);
    const openAddIntervenantModal = useCallback(() => { 
        setIsEditing(false); 
        setCurrentItem(null); 
        setNewIntervenantData({ ...initialIntervenantState, avatarUrl: `https://via.placeholder.com/150/E53E3E/FFFFFF?text=NA` }); 
        setIsIntervenantModalOpen(true); 
    }, []);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_STUDIO) || selectedProject || selectedIntervenant) { setFabConfig(null); return; }
        let config = null;
        if (activeTab === 'projets') config = { onClick: openAddProjectModal, title: "Nouveau Projet" };
        else if (activeTab === 'services') config = { onClick: openAddServiceModal, title: "Nouveau Service" };
        else if (activeTab === 'intervenants') config = { onClick: openAddIntervenantModal, title: "Nouvel Intervenant" };
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedProject, selectedIntervenant, hasPermission, setFabConfig, openAddProjectModal, openAddServiceModal, openAddIntervenantModal]);

    const handleClose = () => navigate('/dashboard');

    const handleIntervenantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewIntervenantData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = (type: 'project' | 'service' | 'intervenant', data: any) => {
        const action = isEditing ? 'Modification' : 'Création';
        const id = isEditing && currentItem ? currentItem.id : `${type.toUpperCase()}-${Date.now()}`;
        
        let entityType = '', details = '';
        if (type === 'project') {
            const finalData = { ...data, id };
            if (isEditing) setStudioProjects(prev => prev.map(p => p.id === id ? finalData : p)); else setStudioProjects(prev => [finalData, ...prev]);
            if (selectedProject?.id === id) setSelectedProject(finalData);
            entityType = 'studioProject'; details = `A ${action === 'Création' ? 'créé' : 'modifié'} le projet ${data.projectName}.`;
            setIsProjectModalOpen(false);
        } else if (type === 'service') {
            const finalData = { ...data, id };
            if (isEditing) setStudioServices(prev => prev.map(s => s.id === id ? finalData : s)); else setStudioServices(prev => [finalData, ...prev]);
            entityType = 'studioService'; details = `A ${action === 'Création' ? 'créé' : 'modifié'} le service ${data.name}.`;
            setIsServiceModalOpen(false);
        } else if (type === 'intervenant') {
            const finalData = { ...data, id };
            if (isEditing) setStudioIntervenants(prev => prev.map(i => i.id === id ? finalData : i)); else setStudioIntervenants(prev => [finalData, ...prev]);
            entityType = 'studioIntervenant'; details = `A ${action === 'Création' ? 'créé' : 'modifié'} l'intervenant ${data.name}.`;
            setIsIntervenantModalOpen(false);
        }
        addLogEntry(action, details, entityType, id);
        showAlert('Succès', `${isEditing ? 'Modification' : 'Ajout'} effectué avec succès.`);
    };
    
    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        const archive = (setter: Function) => setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isArchived: true } : item));
        
        if (type === 'project') archive(setStudioProjects);
        else if (type === 'service') archive(setStudioServices);
        else if (type === 'intervenant') archive(setStudioIntervenants);

        addLogEntry('Archivage', `A archivé ${type} ${name}`, `studio${type.charAt(0).toUpperCase() + type.slice(1)}`, id);
        setIsDeleteModalOpen(false); setItemToDelete(null);
        showAlert('Succès', 'Élément archivé.');
    };
    
    // Payment Handlers
    const handlePaymentSubmit = () => {
        if (!selectedProject || newPaymentData.amount <= 0) return;
        const newReceiptRef = `${billingSettings.receiptPrefix}STU-${billingSettings.receiptNextNumber}`;
        const newReceipt = { amount: newPaymentData.amount, date: new Date().toISOString(), ref: newReceiptRef };
        const updatedProject = { ...selectedProject, amountPaid: selectedProject.amountPaid + newPaymentData.amount, receipts: [...(selectedProject.receipts || []), newReceipt] };

        setStudioProjects(projects => projects.map(p => p.id === selectedProject.id ? updatedProject : p));
        setSelectedProject(updatedProject);
        setBillingSettings(prev => ({...prev, receiptNextNumber: prev.receiptNextNumber + 1}));
        
        const newTransaction: Transaction = { id: `T_STU_${selectedProject.id}_${Date.now()}`, date: new Date().toISOString(), department: 'Studio', description: `Paiement projet: ${selectedProject.projectName}`, amount: newPaymentData.amount, type: 'Revenu' };
        setTransactions(prev => [newTransaction, ...prev]);
        addLogEntry('Paiement', `A enregistré un paiement de ${newPaymentData.amount.toLocaleString()} GNF pour le projet ${selectedProject.projectName}`, 'studioProject', selectedProject.id);
        
        showAlert('Succès', `Paiement de ${newPaymentData.amount.toLocaleString()} GNF enregistré.`);
        setIsPaymentModalOpen(false); setNewPaymentData({ amount: 0 });
    };

    const getProjectTotal = useCallback((project: StudioProject) => {
        if (!project) return 0;
        const subTotal = project.serviceIds.reduce((sum, id) => {
            const service = studioServices.find(s => s.id === id);
            return sum + (service?.tarif || 0);
        }, 0);
        return subTotal - (project.discount || 0);
    }, [studioServices]);

    const projectProfitability = useMemo(() => {
        if (!selectedProject) return { totalRevenue: 0, totalCosts: 0, grossMargin: 0, marginPercentage: 0 };

        const totalRevenue = getProjectTotal(selectedProject);

        const totalCosts = (selectedProject.intervenants || []).reduce((sum, interv) => {
            if (interv.remuneration.type === 'forfait') {
                return sum + interv.remuneration.amount;
            } else { // 'pourcentage'
                return sum + (totalRevenue * interv.remuneration.value) / 100;
            }
        }, 0);

        const grossMargin = totalRevenue - totalCosts;
        const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

        return { totalRevenue, totalCosts, grossMargin, marginPercentage };
    }, [selectedProject, getProjectTotal]);

    const intervenantDetails = useMemo(() => {
        if (!selectedIntervenant) return null;
        
        const unpaidInterventions: {project: StudioProject, intervention: StudioProjectIntervenant}[] = [];
        const projectHistory: {project: StudioProject, intervention: StudioProjectIntervenant}[] = [];
        
        studioProjects.forEach(project => {
            if (project.intervenants) {
                project.intervenants.forEach(interv => {
                    if (interv.intervenantId === selectedIntervenant.id) {
                         projectHistory.push({ project, intervention: interv });
                        if (interv.status === 'En attente') {
                            unpaidInterventions.push({ project, intervention: interv });
                        }
                    }
                });
            }
        });
        
        const totalDue = unpaidInterventions.reduce((sum, item) => {
            const { remuneration } = item.intervention;
            if (remuneration.type === 'forfait') {
                return sum + remuneration.amount;
            } else { // 'pourcentage'
                const projectTotal = getProjectTotal(item.project);
                const percentageAmount = (projectTotal * remuneration.value) / 100;
                return sum + percentageAmount;
            }
        }, 0);

        const payments = studioIntervenantPayments.filter(p => p.intervenantId === selectedIntervenant.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        return { unpaidInterventions, totalDue, payments, totalPaid, projectHistory };
    }, [selectedIntervenant, studioProjects, studioIntervenantPayments, getProjectTotal]);


    const handlePayIntervenant = () => {
        if (!selectedIntervenant || !intervenantDetails || intervenantDetails.totalDue <= 0) return;

        const interventionsToPay = intervenantDetails.unpaidInterventions.map(item => {
            const { project, intervention } = item;
            const { remuneration } = intervention;
            let amount = 0;
            if (remuneration.type === 'forfait') {
                amount = remuneration.amount;
            } else {
                const projectTotal = getProjectTotal(project);
                amount = (projectTotal * remuneration.value) / 100;
            }
            return { projectId: project.id, description: intervention.description, amount };
        });
        
        const totalDueToPay = interventionsToPay.reduce((sum, item) => sum + item.amount, 0);

        const newTransaction: Transaction = { id: `T-HONORAIRES-STU-${Date.now()}`, date: new Date().toISOString(), department: 'Studio', description: `Paiement honoraires pour ${selectedIntervenant.name}`, amount: -totalDueToPay, type: 'Dépense', category: 'Honoraires' };
        const statementRef = `${billingSettings.statementPrefix}STU-${billingSettings.statementNextNumber}`;
        const newPayment: StudioIntervenantPayment = {
            id: `IPAY_${selectedIntervenant.id}_${Date.now()}`,
            intervenantId: selectedIntervenant.id,
            periodDescription: `Prestations jusqu'au ${new Date().toLocaleDateString()}`,
            amount: totalDueToPay,
            paymentDate: new Date().toISOString(),
            interventions: interventionsToPay,
            transactionId: newTransaction.id,
            statementRef: statementRef
        };
    
        setTransactions(prev => [newTransaction, ...prev]);
        setStudioIntervenantPayments(prev => [newPayment, ...prev]);
        setBillingSettings(prev => ({ ...prev, statementNextNumber: prev.statementNextNumber + 1 }));
    
        const projectIdsToUpdate = new Set(intervenantDetails.unpaidInterventions.map(item => item.project.id));
        setStudioProjects(prevProjects => {
            return prevProjects.map(p => {
                if (projectIdsToUpdate.has(p.id)) {
                    return {
                        ...p,
                        intervenants: p.intervenants?.map(i => {
                            if (i.intervenantId === selectedIntervenant.id && i.status === 'En attente') {
                                return { ...i, status: 'Payé', paymentId: newPayment.id };
                            }
                            return i;
                        })
                    };
                }
                return p;
            });
        });
        
        addLogEntry('Paiement Intervenant', `A payé ${totalDueToPay.toLocaleString()} GNF à ${selectedIntervenant.name}.`, 'studioIntervenantPayment', newPayment.id);
        showAlert('Succès', 'Paiement effectué avec succès.');
    
        const docTitle = `État de Prestations - ${selectedIntervenant.name}`;
        const docContent = <EtatPrestationsStudio intervenant={selectedIntervenant} payment={newPayment} companyProfile={companyProfile} />;
        
        setDocumentToDownload({ content: docContent, format: 'pdf', title: docTitle });
    
        setIsPayIntervenantModalOpen(false);
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const periodProjects = studioProjects.filter(p => { const d = new Date(p.startDate); return d >= start && d <= end; });
        const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

        setDocumentToDownload({
            title: `Rapport PS-STUDIO - ${period}`,
            content: <StudioReport projects={periodProjects} clients={clients} period={period} companyProfile={companyProfile} />,
            format: 'pdf',
        });
    };
    
    const toggleServiceInProject = (serviceId: string) => {
        setNewProjectData((prev: any) => {
            const currentServices = prev.serviceIds || [];
            if (currentServices.includes(serviceId)) {
                return { ...prev, serviceIds: currentServices.filter((id: string) => id !== serviceId) };
            } else {
                return { ...prev, serviceIds: [...currentServices, serviceId] };
            }
        });
    };
    
    const estimatedTotal = useMemo(() => {
        if(!newProjectData.serviceIds) return 0;
        return newProjectData.serviceIds.reduce((sum: number, id: string) => {
            const s = studioServices.find(serv => serv.id === id);
            return sum + (s?.tarif || 0);
        }, 0) - (newProjectData.discount || 0);
    }, [newProjectData.serviceIds, newProjectData.discount, studioServices]);


    const renderProjectDetailView = () => {
        if (!selectedProject) return null;
        
        const client = clients.find(c => c.id === selectedProject.clientId);
        const technician = users.find(u => u.id === selectedProject.technicianId);
        const projectServices = studioServices.filter(s => selectedProject.serviceIds.includes(s.id));
        const projectTotal = getProjectTotal(selectedProject);
        const balance = projectTotal - selectedProject.amountPaid;

        return (
            <div className="animate-fade-in">
                <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                    <div>
                        <h2 className="text-3xl font-bold">{selectedProject.projectName}</h2>
                        <p className="text-gray-500">{client?.name || 'Client non trouvé'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg">Détails du Projet</h3>
                             <div className="grid grid-cols-2 gap-4 mt-4">
                                <p><strong>Status:</strong> {selectedProject.status}</p>
                                <p><strong>Type:</strong> {selectedProject.projectType}</p>
                                <p><strong>Début:</strong> {new Date(selectedProject.startDate).toLocaleDateString()}</p>
                                <p><strong>Fin:</strong> {new Date(selectedProject.endDate).toLocaleDateString()}</p>
                                <p><strong>Technicien:</strong> {technician?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg">Résumé Financier</h3>
                             <div className="space-y-2 mt-2">
                                <div className="flex justify-between"><span>Sous-total:</span><span>{(projectTotal + selectedProject.discount).toLocaleString()} GNF</span></div>
                                <div className="flex justify-between text-red-500"><span>Remise:</span><span>- {selectedProject.discount.toLocaleString()} GNF</span></div>
                                <div className="flex justify-between font-bold border-t pt-1"><span>Total:</span><span>{projectTotal.toLocaleString()} GNF</span></div>
                                <div className="flex justify-between text-green-600"><span>Payé:</span><span>{selectedProject.amountPaid.toLocaleString()} GNF</span></div>
                                <div className="flex justify-between text-red-600 font-bold border-t pt-2"><span>Solde:</span><span>{balance.toLocaleString()} GNF</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderIntervenantDetailView = () => {
        if (!selectedIntervenant) return null;
        
        const { totalDue, totalPaid, projectHistory, payments } = intervenantDetails;
        
         const DetailTabButton: React.FC<{ tab: IntervenantDetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
            <button onClick={() => setActiveIntervenantDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeIntervenantDetailTab === tab ? 'border-studio-red text-studio-red' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-5 w-5" /><span>{label}</span>
            </button>
        );


        return (
            <div className="animate-fade-in">
                 <div className="flex justify-between items-start">
                     <div className="flex items-center space-x-4 mb-6">
                        <button onClick={() => setSelectedIntervenant(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <img src={selectedIntervenant.avatarUrl} alt={selectedIntervenant.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                            <h2 className="text-3xl font-bold">{selectedIntervenant.name}</h2>
                            <p className="text-gray-500">{selectedIntervenant.speciality}</p>
                        </div>
                    </div>
                     {hasPermission(Permission.MANAGE_STUDIO) && 
                        <div className="flex items-center space-x-2">
                             <button onClick={() => { setIsEditing(true); setCurrentItem(selectedIntervenant); setNewIntervenantData(selectedIntervenant); setIsIntervenantModalOpen(true); }} className="btn-secondary"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                             <button onClick={() => { setItemToDelete({ id: selectedIntervenant.id, name: selectedIntervenant.name, type: 'intervenant' }); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>
                 <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="projets" label="Historique Projets" icon={ClockIcon} /><DetailTabButton tab="paiements" label="Historique Paiements" icon={BanknotesIcon} /></nav></div>

                <div className="mt-6">
                    {activeIntervenantDetailTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3"><h3 className="font-semibold text-lg">Informations</h3><p><strong>Email:</strong> {selectedIntervenant.email}</p><p><strong>Téléphone:</strong> {selectedIntervenant.phone}</p><p><strong>IBAN:</strong> {selectedIntervenant.iban}</p></div>
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4"><h3 className="font-semibold text-lg">Résumé Financier</h3><div className="grid grid-cols-2 gap-4 text-center"><div className="p-2 bg-red-100 dark:bg-red-900/50 rounded"><p className="text-xs">Montant Dû (En attente)</p><p className="font-bold text-lg text-red-700">{totalDue.toLocaleString()} GNF</p></div><div className="p-2 bg-green-100 dark:bg-green-900/50 rounded"><p className="text-xs">Total Payé</p><p className="font-bold text-lg text-green-700">{totalPaid.toLocaleString()} GNF</p></div></div><button onClick={() => setIsPayIntervenantModalOpen(true)} className="btn-primary bg-green-600 w-full mt-4" disabled={totalDue <= 0}>Payer les prestations en attente ({totalDue.toLocaleString()} GNF)</button></div>
                        </div>
                    )}
                    {activeIntervenantDetailTab === 'projets' && (
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">Historique des Contributions</h3>
                            <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Projet</th><th className="p-2">Rôle/Description</th><th className="p-2">Rémunération</th><th className="p-2">Statut</th></tr></thead>
                                <tbody>
                                    {projectHistory.map((item, idx) => {
                                        const remunerationText = item.intervention.remuneration.type === 'forfait' ? `${item.intervention.remuneration.amount.toLocaleString()} GNF` : `${item.intervention.remuneration.value}%`;
                                        return (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2 font-medium">{item.project.projectName}</td>
                                                <td className="p-2">{item.intervention.description}</td>
                                                <td className="p-2">{remunerationText}</td>
                                                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${item.intervention.status === 'Payé' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.intervention.status}</span></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                         </div>
                    )}
                    {activeIntervenantDetailTab === 'paiements' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">Historique des Paiements</h3>
                            <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Montant</th><th className="p-2">Réf.</th></tr></thead>
                                <tbody>{payments.map(p => <tr key={p.id} className="border-b"><td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td><td className="p-2">{p.periodDescription}</td><td className="p-2 text-right">{p.amount.toLocaleString()} GNF</td><td className="p-2">{p.statementRef}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                </div>
                 <ConfirmationModal isOpen={isPayIntervenantModalOpen} onClose={() => setIsPayIntervenantModalOpen(false)} onConfirm={handlePayIntervenant} title={`Confirmer le paiement`} message={`Voulez-vous payer toutes les prestations en attente pour ${selectedIntervenant.name} d'un montant total de ${totalDue.toLocaleString()} GNF ?`} />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-studio-red">PS-STUDIO</h1>
                {!selectedProject && !selectedIntervenant && (
                    <div className="flex items-center space-x-2">
                        {hasPermission(Permission.MANAGE_STUDIO) && <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>}
                        <button onClick={handleClose} className="btn-secondary">Fermer</button>
                    </div>
                )}
            </div>

            {selectedProject ? renderProjectDetailView() : selectedIntervenant ? renderIntervenantDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4">
                        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-studio-red text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Tableau de Bord</button>
                        <button onClick={() => setActiveTab('projets')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'projets' ? 'bg-studio-red text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Projets</button>
                        <button onClick={() => setActiveTab('services')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'services' ? 'bg-studio-red text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Services</button>
                        <button onClick={() => setActiveTab('intervenants')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'intervenants' ? 'bg-studio-red text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Intervenants</button>
                    </div>
                    
                    {activeTab === 'dashboard' && <StudioDashboard projects={studioProjects} services={studioServices} clients={clients} />}

                    {activeTab === 'projets' && (
                        <table className="w-full text-left">
                            <thead><tr><th>Projet</th><th>Client</th><th>Statut</th><th>Actions</th></tr></thead>
                            <tbody>{studioProjects.filter(p => !p.isArchived).map(p => <tr key={p.id} onClick={() => setSelectedProject(p)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"><td>{p.projectName}</td><td>{clients.find(c=>c.id===p.clientId)?.name}</td><td><span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(p.status)}`}>{p.status}</span></td><td>...</td></tr>)}</tbody>
                        </table>
                    )}
                     {activeTab === 'services' && (
                        <table className="w-full text-left">
                            <thead><tr><th>Service</th><th>Type</th><th>Tarif</th><th>Statut</th><th>Actions</th></tr></thead>
                            <tbody>{studioServices.filter(s => !s.isArchived).map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td><td>{s.type}</td><td>{s.tarif.toLocaleString()} GNF</td><td>{s.statut}</td>
                                    <td>{hasPermission(Permission.MANAGE_STUDIO) && <div className="flex space-x-1">
                                        <button onClick={() => { setIsEditing(true); setCurrentItem(s); setNewServiceData(s); setIsServiceModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button>
                                        <button onClick={() => { setItemToDelete({ id: s.id, name: s.name, type: 'service' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button>
                                    </div>}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                    {activeTab === 'intervenants' && (
                        <table className="w-full text-left">
                            <thead><tr><th>Nom</th><th>Spécialité</th><th>Email</th><th>Actions</th></tr></thead>
                            <tbody>{studioIntervenants.filter(i => !i.isArchived).map(i => <tr key={i.id} onClick={() => setSelectedIntervenant(i)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"><td>{i.name}</td><td>{i.speciality}</td><td>{i.email}</td><td>...</td></tr>)}</tbody>
                        </table>
                    )}
                </div>
            )}
            
            <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={isEditing ? 'Modifier le Projet' : 'Nouveau Projet'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('project', newProjectData)}} className="space-y-4 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="mb-4">
                             <label className="block text-sm font-medium mb-1">Nom du projet</label>
                             <input type="text" value={newProjectData.projectName} onChange={e=>setNewProjectData({...newProjectData, projectName: e.target.value})} className="input-style" required/>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-medium mb-1">Type</label><select value={newProjectData.projectType} onChange={e=>setNewProjectData({...newProjectData, projectType: e.target.value as any})} className="input-style"><option>Single</option><option>EP</option><option>Album</option></select></div>
                            <div><label className="block text-sm font-medium mb-1">Statut</label><select value={newProjectData.status} onChange={e=>setNewProjectData({...newProjectData, status: e.target.value as any})} className="input-style"><option>Planifié</option><option>En cours</option><option>Mixage</option><option>Terminé</option><option>Livré</option></select></div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Client</label>
                            <div className="flex items-center"><select value={newProjectData.clientId} onChange={e=>setNewProjectData({...newProjectData, clientId: e.target.value})} className="input-style flex-grow" required><option value="">-- Sélectionner Client --</option>{clients.filter(c=>!c.isArchived).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" onClick={() => setIsAddClientModalOpen(true)} className="ml-2 btn-secondary">+</button></div>
                        </div>
                        
                        <div className="mb-4">
                             <label className="block text-sm font-medium mb-1">Technicien Responsable</label>
                             <select value={newProjectData.technicianId} onChange={e=>setNewProjectData({...newProjectData, technicianId: e.target.value})} className="input-style"><option value="">-- Sélectionner --</option>{users.filter(u=>!u.isArchived).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-medium mb-1">Date de début</label><input type="date" value={newProjectData.startDate} onChange={e=>setNewProjectData({...newProjectData, startDate: e.target.value})} className="input-style" required/></div>
                            <div><label className="block text-sm font-medium mb-1">Date de fin (est.)</label><input type="date" value={newProjectData.endDate} onChange={e=>setNewProjectData({...newProjectData, endDate: e.target.value})} className="input-style" required/></div>
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block font-semibold">Services Inclus</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md mb-4">
                                {studioServices.filter(s => !s.isArchived && s.statut === 'Actif').map(service => (
                                    <div key={service.id} className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id={`service-${service.id}`} 
                                            checked={(newProjectData.serviceIds || []).includes(service.id)} 
                                            onChange={() => toggleServiceInProject(service.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-studio-red focus:ring-studio-red"
                                        />
                                        <label htmlFor={`service-${service.id}`} className="ml-2 text-sm cursor-pointer select-none">{service.name} ({service.tarif.toLocaleString()} GNF)</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Financial Summary Section */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mt-2 mb-4">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-1 border-gray-300 dark:border-gray-600">Résumé Financier</h4>
                            <div className="flex items-center justify-between mb-2">
                                 <span className="text-sm text-gray-600 dark:text-gray-400">Sous-total Services:</span>
                                 <span className="font-medium">{(estimatedTotal + (newProjectData.discount || 0)).toLocaleString()} GNF</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <label htmlFor="discount-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">Remise (GNF):</label>
                                <input 
                                    id="discount-input"
                                    type="number" 
                                    min="0"
                                    value={newProjectData.discount || ''} 
                                    onChange={e => setNewProjectData({...newProjectData, discount: e.target.value === '' ? 0 : parseFloat(e.target.value)})} 
                                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-studio-red focus:ring-studio-red sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                                <span className="text-lg font-bold text-gray-800 dark:text-white">Total à Payer:</span>
                                <span className="text-xl font-bold text-studio-red">{estimatedTotal.toLocaleString()} GNF</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 mt-auto border-t dark:border-gray-700">
                        <button type="button" onClick={() => setIsProjectModalOpen(false)} className="btn-secondary mr-2">Annuler</button>
                        <button type="submit" className="btn-primary bg-studio-red">Enregistrer</button>
                    </div>
                </form>
            </Modal>

             <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title={isEditing ? 'Modifier le Service' : 'Nouveau Service'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('service', newServiceData)}} className="space-y-4">
                    <div><label>Nom du service</label><input type="text" value={newServiceData.name} onChange={e=>setNewServiceData({...newServiceData, name: e.target.value})} className="input-style" required/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Type</label><select value={newServiceData.type} onChange={e=>setNewServiceData({...newServiceData, type: e.target.value as any})} className="input-style"><option>Audio</option><option>Vidéo</option><option>Graphisme</option><option>Autre</option></select></div>
                        <div><label>Statut</label><select value={newServiceData.statut} onChange={e=>setNewServiceData({...newServiceData, statut: e.target.value as any})} className="input-style"><option>Actif</option><option>Inactif</option></select></div>
                    </div>
                    <div><label>Tarif de base (GNF)</label><input type="number" value={newServiceData.tarif} onChange={e=>setNewServiceData({...newServiceData, tarif: +e.target.value})} className="input-style" required/></div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-studio-red">Enregistrer</button></div>
                </form>
            </Modal>

             <Modal isOpen={isIntervenantModalOpen} onClose={() => setIsIntervenantModalOpen(false)} title="Nouvel Intervenant">
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('intervenant', newIntervenantData)}} className="space-y-4">
                    <div className="flex items-center space-x-4"><img src={newIntervenantData.avatarUrl} className="h-16 w-16 rounded-full"/><input type="file" onChange={handleIntervenantImageChange}/></div>
                    <input type="text" placeholder="Nom complet" value={newIntervenantData.name} onChange={e=>setNewIntervenantData({...newIntervenantData, name: e.target.value})} className="input-style" required/>
                    <input type="text" placeholder="Spécialité" value={newIntervenantData.speciality} onChange={e=>setNewIntervenantData({...newIntervenantData, speciality: e.target.value})} className="input-style"/>
                    <input type="email" placeholder="Email" value={newIntervenantData.email} onChange={e=>setNewIntervenantData({...newIntervenantData, email: e.target.value})} className="input-style"/>
                    <input type="text" placeholder="IBAN / Compte" value={newIntervenantData.iban} onChange={e=>setNewIntervenantData({...newIntervenantData, iban: e.target.value})} className="input-style"/>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-studio-red">Enregistrer</button></div>
                </form>
            </Modal>

            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onClientAdded={(client) => { setClients(prev => [client, ...prev]); setNewProjectData({...newProjectData, clientId: client.id}); }} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />

            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport PS-STUDIO"/>
        </div>
    );
};
