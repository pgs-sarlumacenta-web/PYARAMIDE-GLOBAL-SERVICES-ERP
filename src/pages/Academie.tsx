
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { Student, Formation, Formateur, Paiement, Transaction, Permission, ScheduleEntry, FormateurPayment } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import Recu from '../components/academie/Recu.tsx';
import Badge from '../components/academie/Badge.tsx';
import Attestation from '../components/academie/Attestation.tsx';
import EmploiDuTemps from '../components/academie/EmploiDuTemps.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, CurrencyDollarIcon, ChartPieIcon, EllipsisVerticalIcon, IdentificationIcon, AcademicCapIcon, CalendarDaysIcon, ArrowLeftIcon, UserCircleIcon, BanknotesIcon, PencilSquareIcon, BellAlertIcon, MagnifyingGlassIcon, ChevronDownIcon, ClockIcon, InformationCircleIcon, UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import AcademieStats from '../components/academie/AcademieStats.tsx';
import ScheduleView from '../components/academie/ScheduleView.tsx';
import ReportModal from '../components/ReportModal.tsx';
import AcademieReport from '../components/academie/AcademieReport.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import RappelPaiementAcademie from '../components/academie/RappelPaiementAcademie.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import EtatPrestations from '../components/finances/EtatPrestations.tsx';

type Tab = 'dashboard' | 'apprenants' | 'formations' | 'formateurs' | 'planning';
type StudentDetailTab = 'dashboard' | 'paiements' | 'emploi' | 'documents';
type FormateurDetailTab = 'dashboard' | 'paiements' | 'cours_non_factures';
type FormationDetailTab = 'dashboard' | 'apprenants' | 'planning';

const initialStudentState: Omit<Student, 'id'> = { name: '', email: '', phone: '', address: '', formationId: '', registrationDate: new Date().toISOString().split('T')[0], statut: 'Actif', avatarUrl: '', tarif: 'eleve' };
const initialFormationState: Omit<Formation, 'id'> = { name: '', filiere: 'Musique', coutEleve: 0, coutPro: 0, fraisInscription: 0, duree: 0, statut: 'Actif' };
const initialFormateurState: Omit<Formateur, 'id'> = { name: '', speciality: '', phone: '', email: '', address: '', iban: '', tarifHoraire: 0, avatarUrl: '' };
const initialScheduleState: Omit<ScheduleEntry, 'id'> = { title: '', dayOfWeek: 'Lundi', startTime: '08:00', endTime: '10:00', salle: 'Studio A', formationId: '', formateurId: '' };
const initialPaymentState = { amount: '', objet: 'Tranche 1' as Paiement['objet'] };


export const Academie: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const {
        students, setStudents,
        formations, setFormations,
        formateurs, setFormateurs,
        paiements, setPaiements,
        scheduleEntries, setScheduleEntries,
        setTransactions,
        companyProfile,
        billingSettings, setBillingSettings,
        addLogEntry,
        formateurPayments, setFormateurPayments,
    } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeStudentDetailTab, setActiveStudentDetailTab] = useState<StudentDetailTab>('dashboard');
    
    const [selectedFormateur, setSelectedFormateur] = useState<Formateur | null>(null);
    const [activeFormateurDetailTab, setActiveFormateurDetailTab] = useState<FormateurDetailTab>('dashboard');
    const [isPayFormateurModalOpen, setIsPayFormateurModalOpen] = useState(false);

    const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
    const [activeFormationDetailTab, setActiveFormationDetailTab] = useState<FormationDetailTab>('dashboard');


    // Modal states
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
    const [isFormateurModalOpen, setIsFormateurModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    // Data states
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
    
    const [newStudentData, setNewStudentData] = useState<Omit<Student, 'id'>>(initialStudentState);
    const [newFormationData, setNewFormationData] = useState(initialFormationState);
    const [newFormateurData, setNewFormateurData] = useState<Omit<Formateur, 'id'>>(initialFormateurState);
    const [newScheduleData, setNewScheduleData] = useState(initialScheduleState);
    const [newPaymentData, setNewPaymentData] = useState(initialPaymentState);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tous');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    // Hidden downloader state
    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    useEffect(() => {
        const state = location.state as { selectedId?: string, type?: string };
        if (state?.selectedId && state.type === 'student') {
            const studentToSelect = students.find(s => s.id === state.selectedId && !s.isArchived);
            if (studentToSelect) {
                setSelectedStudent(studentToSelect);
                setActiveTab('apprenants');
                navigate(location.pathname, { replace: true, state: {} }); // Clear state
            }
        }
    }, [location.state, students, navigate]);
    
    const formationDetails = useMemo(() => {
        if (!selectedFormation) return null;

        const formationStudents = students.filter(s => s.formationId === selectedFormation.id && !s.isArchived);
        const formationSchedule = scheduleEntries.filter(e => e.formationId === selectedFormation.id && !e.isArchived);
        
        const studentIds = new Set(formationStudents.map(s => s.id));
        const totalRevenue = paiements
            .filter(p => !p.isArchived && studentIds.has(p.studentId))
            .reduce((sum, p) => sum + p.amount, 0);
            
        return { formationStudents, formationSchedule, totalRevenue };
    }, [selectedFormation, students, scheduleEntries, paiements]);

    const getStudentTotalCost = (student: Student, formation: Formation | undefined): number => {
        if (!formation) return 0;
        const studentCost = student.tarif === 'professionnel' ? formation.coutPro : formation.coutEleve;
        return studentCost + formation.fraisInscription;
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived) return false;
            
            // Text Search
            if (searchTerm) {
                const lowercasedTerm = searchTerm.toLowerCase();
                if (!(
                    student.name.toLowerCase().includes(lowercasedTerm) ||
                    student.email.toLowerCase().includes(lowercasedTerm) ||
                    student.phone.toLowerCase().includes(lowercasedTerm)
                )) {
                    return false;
                }
            }

            // Status Filter
            if (filterStatus !== 'Tous' && student.statut !== filterStatus) return false;

            // Payment Filter
            if (paymentFilter !== 'all') {
                const formation = formations.find(f => f.id === student.formationId);
                const totalCost = getStudentTotalCost(student, formation);
                const totalPaid = paiements
                    .filter(p => p.studentId === student.id && !p.isArchived)
                    .reduce((sum, p) => sum + p.amount, 0);
                const balance = totalCost - totalPaid;

                if (paymentFilter === 'unpaid' && balance <= 0) return false; // We want debts, skip if paid
                if (paymentFilter === 'paid' && balance > 0) return false; // We want paid, skip if debt
            }

            return true;
        });
    }, [students, searchTerm, filterStatus, paymentFilter, formations, paiements]);

    // Handlers for opening modals
    const openAddStudentModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewStudentData({ ...initialStudentState, formationId: formations[0]?.id || '', avatarUrl: `https://via.placeholder.com/150/3b82f6/FFFFFF?text=NA` });
        setIsStudentModalOpen(true);
    }, [formations]);
    const openAddFormationModal = useCallback(() => { setIsEditing(false); setCurrentItem(null); setNewFormationData(initialFormationState); setIsFormationModalOpen(true); }, []);
    const openAddFormateurModal = useCallback(() => { 
        setIsEditing(false); 
        setCurrentItem(null); 
        setNewFormateurData({ ...initialFormateurState, avatarUrl: `https://via.placeholder.com/150/3b82f6/FFFFFF?text=NA` }); 
        setIsFormateurModalOpen(true); 
    }, []);
    const openAddScheduleModal = useCallback(() => { 
        setIsEditing(false); 
        setCurrentItem(null); 
        setNewScheduleData({...initialScheduleState, formationId: formations[0]?.id || '', formateurId: formateurs[0]?.id || ''});
        setIsScheduleModalOpen(true); 
    }, [formations, formateurs]);

    // FAB configuration
    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_ACADEMIE) || selectedStudent || selectedFormateur || selectedFormation) {
            setFabConfig(null);
            return;
        }
        let config = null;
        switch (activeTab) {
            case 'apprenants': config = { onClick: openAddStudentModal, title: "Nouvel Apprenant" }; break;
            case 'formations': config = { onClick: openAddFormationModal, title: "Nouvelle Formation" }; break;
            case 'formateurs': config = { onClick: openAddFormateurModal, title: "Nouveau Formateur" }; break;
            case 'planning': config = { onClick: openAddScheduleModal, title: "Nouveau Cours" }; break;
        }
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedStudent, selectedFormateur, selectedFormation, setFabConfig, hasPermission, openAddStudentModal, openAddFormationModal, openAddFormateurModal, openAddScheduleModal]);


    // Outside click handler for menus
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-menu-container]')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleClose = () => navigate('/dashboard');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'formateur') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'student') setNewStudentData(prev => ({ ...prev, avatarUrl: result }));
                else if (type === 'formateur') setNewFormateurData(prev => ({ ...prev, avatarUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = (type: string, data: any) => {
        const id = isEditing ? currentItem.id : `NEW_${type.toUpperCase()}_${Date.now()}`;
        const action = isEditing ? 'Modification' : 'Création';
        let details = '';
        let entityType = type;

        switch (type) {
            case 'student':
                if (isEditing) {
                    setStudents(students.map(s => s.id === currentItem.id ? { ...currentItem, ...data } : s));
                    if(selectedStudent && selectedStudent.id === currentItem.id) setSelectedStudent({ ...currentItem, ...data });
                } else {
                    const newStudent = { ...data, id };
                    setStudents(prev => [newStudent, ...prev]);
                }
                details = `A ${action === 'Création' ? 'créé' : 'modifié'} l'apprenant ${data.name}.`;
                setIsStudentModalOpen(false);
                break;
            case 'formation':
                // Assurer que les nombres sont bien des nombres
                const formationData = {
                    ...data,
                    coutEleve: Number(data.coutEleve),
                    coutPro: Number(data.coutPro),
                    fraisInscription: Number(data.fraisInscription),
                    duree: Number(data.duree)
                };
                if (isEditing) {
                    setFormations(formations.map(f => f.id === currentItem.id ? { ...currentItem, ...formationData } : f));
                    if(selectedFormation && selectedFormation.id === currentItem.id) setSelectedFormation({ ...currentItem, ...formationData });
                }
                else setFormations(prev => [{ ...formationData, id }, ...prev]);
                details = `A ${action === 'Création' ? 'créé' : 'modifié'} la formation ${data.name}.`;
                setIsFormationModalOpen(false);
                break;
            case 'formateur':
                const formateurData = { ...data, tarifHoraire: +data.tarifHoraire };
                if (isEditing) {
                    setFormateurs(formateurs.map(f => f.id === currentItem.id ? { ...currentItem, ...formateurData } : f));
                    if(selectedFormateur && selectedFormateur.id === currentItem.id) setSelectedFormateur({ ...currentItem, ...formateurData });
                } else {
                    setFormateurs(prev => [{ ...formateurData, id }, ...prev]);
                }
                details = `A ${action === 'Création' ? 'créé' : 'modifié'} le formateur ${data.name}.`;
                setIsFormateurModalOpen(false);
                break;
            case 'schedule':
                 if (isEditing) setScheduleEntries(scheduleEntries.map(e => e.id === currentItem.id ? { ...currentItem, ...data } : e));
                else setScheduleEntries(prev => [{ ...data, id }, ...prev]);
                details = `A ${action === 'Création' ? 'créé' : 'modifié'} le cours ${data.title}.`;
                entityType = 'scheduleEntry';
                setIsScheduleModalOpen(false);
                break;
        }
        addLogEntry(action, details, entityType, id);
        showAlert('Succès', `${isEditing ? 'Modification' : 'Ajout'} effectué avec succès.`);
    };
    
    const handlePaymentSubmit = () => {
        const student = selectedStudent || currentItem;
        if (!student || !newPaymentData.amount || +newPaymentData.amount <= 0) return;

        const newReceiptRef = `${billingSettings.receiptPrefix}ACA-${billingSettings.receiptNextNumber}`;
        const newPaiement: Paiement = {
            id: `PAY_ACA_${student.id}_${Date.now()}`,
            studentId: student.id,
            amount: +newPaymentData.amount,
            date: new Date().toISOString(),
            objet: newPaymentData.objet,
            receiptRef: newReceiptRef,
        };

        setPaiements(prev => [newPaiement, ...prev]);
        setBillingSettings(prev => ({...prev, receiptNextNumber: prev.receiptNextNumber + 1}));

        const newTransaction: Transaction = {
            id: `T_ACA_${student.id}_${Date.now()}`,
            date: new Date().toISOString(),
            department: 'Académie',
            description: `Paiement ${newPaymentData.objet} - ${student.name}`,
            amount: +newPaymentData.amount,
            type: 'Revenu',
        };
        setTransactions(prev => [newTransaction, ...prev]);
        
        addLogEntry('Paiement', `A enregistré un paiement de ${newPaiement.amount.toLocaleString()} GNF pour ${student.name}.`, 'paiement', newPaiement.id);

        showAlert('Succès', `Paiement de ${newPaiement.amount.toLocaleString()} GNF enregistré pour ${student.name}.`);
        setIsPaymentModalOpen(false);
        setNewPaymentData(initialPaymentState);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id, name } = itemToDelete;
        let details = '';
        let entityType = type;

        const archive = (setter: React.Dispatch<React.SetStateAction<any[]>>) => setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, isArchived: true } : item));
        
        switch (type) {
            case 'student': 
                archive(setStudents); 
                details = `A archivé l'apprenant ${name}.`;
                if(selectedStudent?.id === id) setSelectedStudent(null);
                break;
            case 'formation': 
                archive(setFormations);
                details = `A archivé la formation ${name}.`;
                if(selectedFormation?.id === id) setSelectedFormation(null);
                break;
            case 'formateur': 
                archive(setFormateurs); 
                details = `A archivé le formateur ${name}.`;
                if(selectedFormateur?.id === id) setSelectedFormateur(null);
                break;
            case 'schedule': 
                setScheduleEntries(prev => prev.filter(e => e.id !== id)); 
                details = `A supprimé le cours ${name}.`;
                entityType = 'scheduleEntry';
                addLogEntry('Suppression', details, entityType, id);
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
                showAlert('Succès', 'Élément supprimé.');
                return;
        }

        addLogEntry('Archivage', details, entityType, id);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        showAlert('Succès', 'Élément archivé.');
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const periodStudents = students.filter(s => { 
            const d = new Date(s.registrationDate);
            return d >= start && d <= end; 
        });

        const periodPaiements = paiements.filter(p => {
            const pDate = new Date(p.date);
            return pDate >= start && pDate <= end;
        });

        const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        const docTitle = `Rapport PS-ACADÉMIE - ${period}`;
        const docContent = <AcademieReport students={periodStudents} formations={formations} paiements={periodPaiements} period={period} companyProfile={companyProfile} />;
        
        showAlert('Téléchargement en cours', 'Votre rapport sera téléchargé automatiquement.');
        setDocumentToDownload({
            content: docContent,
            format: 'pdf',
            title: docTitle
        });
    };

    const handlePayFormateur = (formateur: Formateur, unpaidEntries: ScheduleEntry[], amountDue: number) => {
        if (amountDue <= 0) return;
    
        const newTransaction: Transaction = {
            id: `T_PAY_FORM_${formateur.id}_${Date.now()}`,
            date: new Date().toISOString(),
            department: 'Académie',
            description: `Paiement honoraires pour ${formateur.name}`,
            amount: -amountDue,
            type: 'Dépense',
            category: 'Honoraires'
        };
        
        const statementRef = `${billingSettings.statementPrefix}ACA-${billingSettings.statementNextNumber}`;
    
        const newPayment: FormateurPayment = {
            id: `FPAY_${formateur.id}_${Date.now()}`,
            formateurId: formateur.id,
            periodDescription: `Prestations jusqu'au ${new Date().toLocaleDateString()}`,
            amount: amountDue,
            paymentDate: new Date().toISOString(),
            scheduleEntryIds: unpaidEntries.map(e => e.id),
            transactionId: newTransaction.id,
            statementRef: statementRef
        };
    
        setTransactions(prev => [newTransaction, ...prev]);
        setFormateurPayments(prev => [newPayment, ...prev]);
        setBillingSettings(prev => ({ ...prev, statementNextNumber: prev.statementNextNumber + 1 }));
    
        addLogEntry('Paiement Formateur', `A payé ${amountDue.toLocaleString()} GNF à ${formateur.name}.`, 'formateurPayment', newPayment.id);
        showAlert('Succès', 'Paiement effectué avec succès.');
    
        const docTitle = `État de Prestations - ${formateur.name}`;
        const docContent = <EtatPrestations formateur={formateur} payment={newPayment} entries={unpaidEntries} companyProfile={companyProfile} />;
        
        showAlert('Téléchargement en cours', 'Votre état de prestations sera téléchargé automatiquement.');
        setDocumentToDownload({
            content: docContent,
            format: 'pdf',
            title: docTitle
        });
    };

    const openDocument = (type: 'badge' | 'attestation' | 'recu' | 'emploi' | 'rappel', student: Student, formation: Formation, allPaiements: Paiement[]) => {
        let docContent: React.ReactNode = null;
        let docTitle = '';
        let format: 'pdf' | 'png' = 'pdf';

        if (type === 'badge') {
            docTitle = `Badge de ${student.name}`;
            docContent = <Badge student={student} formation={formation} companyProfile={companyProfile} />;
            format = 'png';
        } else if (type === 'attestation') {
            docTitle = `Attestation de ${student.name}`;
            docContent = <Attestation student={student} formation={formation} companyProfile={companyProfile} directorName={user?.name || 'Le Directeur'} />;
        } else if (type === 'recu') {
            const lastPayment = [...allPaiements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (!lastPayment) return showAlert("Information", "Aucun paiement n'a été enregistré pour cet apprenant.");

            docTitle = `Reçu ${lastPayment.receiptRef}`;
            docContent = <Recu student={student} formation={formation} paiement={lastPayment} allPaiements={allPaiements} companyProfile={companyProfile} />;
        } else if (type === 'emploi') {
            const studentSchedule = scheduleEntries.filter(e => e.formationId === student.formationId && !e.isArchived);
            docTitle = `Emploi du temps - ${formation.name}`;
            docContent = <EmploiDuTemps schedule={studentSchedule} formation={formation} formateurs={formateurs} companyProfile={companyProfile} />;
        } else if (type === 'rappel') {
            const totalCost = getStudentTotalCost(student, formation);
            const totalPaid = allPaiements.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalCost - totalPaid;
            if (balance <= 0) return showAlert("Information", "Cet apprenant n'a pas de solde dû.");
            docTitle = `Rappel de Paiement - ${student.name}`;
            docContent = <RappelPaiementAcademie student={student} formation={formation} companyProfile={companyProfile} balance={balance} />;
        }
        
        if (docContent) {
            showAlert('Téléchargement en cours', `Votre document (${type}) sera téléchargé automatiquement.`);
            setDocumentToDownload({
                content: docContent,
                format,
                title: docTitle
            });
        }
    };

    const handleExport = () => {
        if (filteredStudents.length === 0) {
            showAlert('Information', 'Aucun apprenant à exporter.');
            return;
        }
    
        const dataToExport = filteredStudents.map(student => {
            const formation = formations.find(f => f.id === student.formationId);
            const studentPaiements = paiements.filter(p => p.studentId === student.id && !p.isArchived);
            const totalPaid = studentPaiements.reduce((sum, p) => sum + p.amount, 0);
            const totalCost = getStudentTotalCost(student, formation);
            const balance = totalCost - totalPaid;
    
            return {
                'Nom': student.name,
                'Email': student.email,
                'Téléphone': student.phone,
                'Formation': formation?.name || 'N/A',
                'Tarif': student.tarif,
                'Statut': student.statut,
                'Date Inscription': new Date(student.registrationDate).toLocaleDateString('fr-CA'),
                'Coût Total': totalCost,
                'Total Payé': totalPaid,
                'Solde Dû': balance,
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
        link.setAttribute('download', 'apprenants_academie.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // --- RENDER FUNCTIONS ---
    
    const renderFormationDetailView = () => {
        if (!selectedFormation || !formationDetails) return null;
    
        const { formationStudents, formationSchedule, totalRevenue } = formationDetails;

        const DetailTabButton: React.FC<{ tab: FormationDetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
            <button onClick={() => setActiveFormationDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeFormationDetailTab === tab ? 'border-academie-blue text-academie-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-5 w-5" /><span>{label}</span>
            </button>
        );

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4 mb-6">
                        <button onClick={() => setSelectedFormation(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <div>
                            <h2 className="text-3xl font-bold">{selectedFormation.name}</h2>
                            <p className="text-gray-500">{selectedFormation.filiere}</p>
                        </div>
                    </div>
                    {hasPermission(Permission.MANAGE_ACADEMIE) && 
                        <div className="flex items-center space-x-2">
                             <button onClick={() => { setIsEditing(true); setCurrentItem(selectedFormation); setNewFormationData(selectedFormation); setIsFormationModalOpen(true); }} className="btn-secondary"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                             <button onClick={() => { setItemToDelete({ id: selectedFormation.id, name: selectedFormation.name, type: 'formation' }); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>

                <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="apprenants" label="Apprenants" icon={UserGroupIcon} /><DetailTabButton tab="planning" label="Planning" icon={CalendarDaysIcon} /></nav></div>
                
                <div className="mt-6">
                    {activeFormationDetailTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
                                <h3 className="font-semibold text-lg">Informations</h3>
                                <p><strong>Statut:</strong> {selectedFormation.statut}</p>
                                <p><strong>Durée:</strong> {selectedFormation.duree} mois</p>
                                <p><strong>Coût (Élève):</strong> {selectedFormation.coutEleve.toLocaleString()} GNF</p>
                                <p><strong>Coût (Pro):</strong> {selectedFormation.coutPro.toLocaleString()} GNF</p>
                                <p><strong>Frais d'inscription:</strong> {selectedFormation.fraisInscription.toLocaleString()} GNF</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center flex flex-col justify-center">
                                <h3 className="font-semibold text-lg">Apprenants Actifs</h3>
                                <p className="text-4xl font-bold">{formationStudents.length}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center flex flex-col justify-center">
                                <h3 className="font-semibold text-lg">Revenu Total Généré</h3>
                                <p className="text-4xl font-bold text-green-600">{totalRevenue.toLocaleString()} GNF</p>
                            </div>
                        </div>
                    )}
                    {activeFormationDetailTab === 'apprenants' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <table className="w-full text-left text-sm">
                                <thead><tr><th className="p-2">Nom</th><th className="p-2">Statut</th><th className="p-2">Email</th></tr></thead>
                                <tbody>
                                    {formationStudents.map(s => (
                                        <tr key={s.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => { setSelectedFormation(null); setSelectedStudent(s); }}>
                                            <td className="p-2">{s.name}</td>
                                            <td className="p-2">{s.statut}</td>
                                            <td className="p-2">{s.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeFormationDetailTab === 'planning' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <ScheduleView schedule={formationSchedule} formations={formations} formateurs={formateurs} onEdit={() => {}} onDelete={() => {}} hasPermission={false} />
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    const renderStudentDetailView = () => {
        if (!selectedStudent) return null;
        const formation = formations.find(f => f.id === selectedStudent.formationId);
        if (!formation) return <div className="p-4 bg-red-100 text-red-800 rounded-lg">Erreur: Formation non trouvée pour cet apprenant.</div>;
        
        const studentPaiements = paiements.filter(p => p.studentId === selectedStudent.id);
        const totalPaid = studentPaiements.reduce((sum, p) => sum + p.amount, 0);
        const totalCost = getStudentTotalCost(selectedStudent, formation);
        const balance = totalCost - totalPaid;
        const studentSchedule = scheduleEntries.filter(e => e.formationId === selectedStudent.formationId && !e.isArchived);

        const DetailTabButton: React.FC<{ tab: StudentDetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
            <button onClick={() => setActiveStudentDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeStudentDetailTab === tab ? 'border-academie-blue text-academie-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-5 w-5" /><span>{label}</span>
            </button>
        );

        return (
             <div className="animate-fade-in">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4 mb-6">
                        <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                            <h2 className="text-3xl font-bold">{selectedStudent.name}</h2>
                            <p className="text-gray-500">{selectedStudent.email}</p>
                        </div>
                    </div>
                     {hasPermission(Permission.MANAGE_ACADEMIE) && 
                        <div className="flex items-center space-x-2">
                             <button onClick={() => { setIsEditing(true); setCurrentItem(selectedStudent); setNewStudentData(selectedStudent); setIsStudentModalOpen(true); }} className="btn-secondary"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                             <button onClick={() => { setItemToDelete({ id: selectedStudent.id, name: selectedStudent.name, type: 'student' }); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>

                <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="paiements" label="Paiements" icon={BanknotesIcon} /><DetailTabButton tab="emploi" label="Emploi du temps" icon={CalendarDaysIcon} /><DetailTabButton tab="documents" label="Documents" icon={DocumentTextIcon} /></nav></div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        {activeStudentDetailTab === 'dashboard' && <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3"><h3 className="font-semibold text-lg">Informations sur la Formation</h3><p><strong>Formation:</strong> {formation.name}</p><p><strong>Statut Apprenant:</strong> {selectedStudent.statut}</p><p><strong>Tarif:</strong> {selectedStudent.tarif === 'eleve' ? 'Élève' : 'Professionnel'}</p><p><strong>Date d'inscription:</strong> {new Date(selectedStudent.registrationDate).toLocaleDateString()}</p></div>}
                        {activeStudentDetailTab === 'paiements' && <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="font-semibold text-lg mb-2">Historique des Paiements</h3><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Date</th><th className="p-2">Objet</th><th className="p-2 text-right">Montant</th><th className="p-2">Réf.</th></tr></thead><tbody>{studentPaiements.map(p => <tr key={p.id} className="border-b"><td className="p-2">{new Date(p.date).toLocaleDateString()}</td><td className="p-2">{p.objet}</td><td className="p-2 text-right">{p.amount.toLocaleString()} GNF</td><td className="p-2">{p.receiptRef}</td></tr>)}</tbody></table></div>}
                        {activeStudentDetailTab === 'emploi' && <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><ScheduleView schedule={studentSchedule} formations={formations} formateurs={formateurs} onEdit={()=>{}} onDelete={()=>{}} hasPermission={false}/></div>}
                        {activeStudentDetailTab === 'documents' && <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-3"><h3 className="font-semibold text-lg">Générer des Documents</h3><div className="flex flex-wrap gap-2"><button onClick={() => openDocument('badge', selectedStudent, formation, studentPaiements)} className="btn-secondary">Badge</button><button onClick={() => openDocument('attestation', selectedStudent, formation, studentPaiements)} className="btn-secondary">Attestation de Fin</button><button onClick={() => openDocument('recu', selectedStudent, formation, studentPaiements)} className="btn-secondary" disabled={studentPaiements.length === 0}>Dernier Reçu</button><button onClick={() => openDocument('emploi', selectedStudent, formation, studentPaiements)} className="btn-secondary">Emploi du Temps</button></div></div>}
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg">Résumé Financier</h3>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm mt-2">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded"><p className="text-xs">Coût Total</p><p className="font-bold">{totalCost.toLocaleString()} GNF</p></div>
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded"><p className="text-xs">Payé</p><p className="font-bold text-green-700">{totalPaid.toLocaleString()} GNF</p></div>
                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded"><p className="text-xs">Solde</p><p className="font-bold text-red-700">{balance.toLocaleString()} GNF</p></div>
                            </div>
                            {hasPermission(Permission.MANAGE_ACADEMIE) && (
                                <div className="mt-4 space-y-2">
                                    <button 
                                        onClick={() => { setCurrentItem(selectedStudent); setIsPaymentModalOpen(true); }} 
                                        className="btn-primary bg-academie-blue w-full flex items-center justify-center"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2"/>Nouveau Paiement
                                    </button>
                                    {balance > 0 && (
                                        <button 
                                            onClick={() => openDocument('rappel', selectedStudent, formation, studentPaiements)} 
                                            className="btn-secondary w-full text-yellow-600 border-yellow-500 hover:bg-yellow-50 flex items-center justify-center"
                                        >
                                            <BellAlertIcon className="h-5 w-5 mr-2"/>Télécharger un Rappel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFormateurDetailView = () => {
        if (!selectedFormateur) return null;
        
        const formateurCourses = scheduleEntries.filter(s => s.formateurId === selectedFormateur.id && !s.isArchived);
        const formateurPaymentsHistory = formateurPayments.filter(p => p.formateurId === selectedFormateur.id);
        const totalPaid = formateurPaymentsHistory.reduce((sum, p) => sum + p.amount, 0);
        
        const unpaidCourses = formateurCourses.filter(course => 
            !formateurPaymentsHistory.some(p => p.scheduleEntryIds?.includes(course.id))
        );
        
        const totalDue = unpaidCourses.reduce((sum, course) => {
            const duration = (new Date(`1970-01-01T${course.endTime}`).getTime() - new Date(`1970-01-01T${course.startTime}`).getTime()) / (1000 * 60 * 60);
            return sum + (duration * selectedFormateur.tarifHoraire);
        }, 0);

        const DetailTabButton: React.FC<{ tab: FormateurDetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => (
            <button onClick={() => setActiveFormateurDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeFormateurDetailTab === tab ? 'border-academie-blue text-academie-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-5 w-5" /><span>{label}</span>
            </button>
        );

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-start">
                     <div className="flex items-center space-x-4 mb-6">
                        <button onClick={() => setSelectedFormateur(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                        <img src={selectedFormateur.avatarUrl} alt={selectedFormateur.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                            <h2 className="text-3xl font-bold">{selectedFormateur.name}</h2>
                            <p className="text-gray-500">{selectedFormateur.speciality}</p>
                        </div>
                    </div>
                     {hasPermission(Permission.MANAGE_ACADEMIE) && 
                        <div className="flex items-center space-x-2">
                             <button onClick={() => { setIsEditing(true); setCurrentItem(selectedFormateur); setNewFormateurData(selectedFormateur); setIsFormateurModalOpen(true); }} className="btn-secondary"><PencilIcon className="h-5 w-5 mr-2" />Modifier</button>
                             <button onClick={() => { setItemToDelete({ id: selectedFormateur.id, name: selectedFormateur.name, type: 'formateur' }); setIsDeleteModalOpen(true); }} className="btn-secondary text-red-600 border-red-500 hover:bg-red-50"><TrashIcon className="h-5 w-5 mr-2"/>Archiver</button>
                        </div>
                    }
                </div>
                 <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={ChartPieIcon} /><DetailTabButton tab="paiements" label="Historique Paiements" icon={BanknotesIcon} /><DetailTabButton tab="cours_non_factures" label="Prestations en attente" icon={ClockIcon} /></nav></div>

                <div className="mt-6">
                    {activeFormateurDetailTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3"><h3 className="font-semibold text-lg">Informations</h3><p><strong>Email:</strong> {selectedFormateur.email}</p><p><strong>Téléphone:</strong> {selectedFormateur.phone}</p><p><strong>Tarif Horaire:</strong> {selectedFormateur.tarifHoraire.toLocaleString()} GNF</p><p><strong>IBAN:</strong> {selectedFormateur.iban}</p></div>
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4"><h3 className="font-semibold text-lg">Résumé Financier</h3><div className="grid grid-cols-2 gap-4 text-center"><div className="p-2 bg-red-100 dark:bg-red-900/50 rounded"><p className="text-xs">Montant Dû</p><p className="font-bold text-lg text-red-700">{totalDue.toLocaleString()} GNF</p></div><div className="p-2 bg-green-100 dark:bg-green-900/50 rounded"><p className="text-xs">Total Payé</p><p className="font-bold text-lg text-green-700">{totalPaid.toLocaleString()} GNF</p></div></div><button onClick={() => setIsPayFormateurModalOpen(true)} className="btn-primary bg-green-600 w-full mt-4" disabled={totalDue <= 0}>Payer les Prestations ({totalDue.toLocaleString()} GNF)</button></div>
                        </div>
                    )}
                    {activeFormateurDetailTab === 'paiements' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">Historique des Paiements</h3>
                            <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Montant</th><th className="p-2">Réf.</th></tr></thead>
                                <tbody>{formateurPaymentsHistory.map(p => <tr key={p.id} className="border-b"><td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td><td className="p-2">{p.periodDescription}</td><td className="p-2 text-right">{p.amount.toLocaleString()} GNF</td><td className="p-2">{p.statementRef}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                     {activeFormateurDetailTab === 'cours_non_factures' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">Cours non facturés</h3>
                            <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Titre</th><th className="p-2">Jour</th><th className="p-2">Heure</th><th className="p-2 text-right">Montant estimé</th></tr></thead>
                                <tbody>
                                    {unpaidCourses.map(c => {
                                        const duration = (new Date(`1970-01-01T${c.endTime}`).getTime() - new Date(`1970-01-01T${c.startTime}`).getTime()) / (1000 * 60 * 60);
                                        const amount = duration * selectedFormateur.tarifHoraire;
                                        return <tr key={c.id} className="border-b"><td className="p-2">{c.title}</td><td className="p-2">{c.dayOfWeek}</td><td className="p-2">{c.startTime}-{c.endTime}</td><td className="p-2 text-right">{amount.toLocaleString()} GNF</td></tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                 <ConfirmationModal isOpen={isPayFormateurModalOpen} onClose={() => setIsPayFormateurModalOpen(false)} onConfirm={() => { handlePayFormateur(selectedFormateur, unpaidCourses, totalDue); setIsPayFormateurModalOpen(false); }} title={`Confirmer le paiement de ${totalDue.toLocaleString()} GNF`} message={`Voulez-vous payer toutes les prestations en attente pour ${selectedFormateur.name} ?`} />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-academie-blue">PS-ACADÉMIE</h1>
                {!selectedStudent && !selectedFormateur && !selectedFormation &&
                <div className="flex items-center space-x-2">
                    {hasPermission(Permission.MANAGE_ACADEMIE) && <button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button>}
                    <button onClick={handleClose} className="btn-secondary">Fermer</button>
                </div>}
            </div>

            {selectedStudent ? renderStudentDetailView() : selectedFormateur ? renderFormateurDetailView() : selectedFormation ? renderFormationDetailView() : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex space-x-2 border-b mb-4">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-academie-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Tableau de Bord</button>
                    <button onClick={() => setActiveTab('apprenants')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'apprenants' ? 'bg-academie-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Apprenants</button>
                    <button onClick={() => setActiveTab('formations')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'formations' ? 'bg-academie-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Formations</button>
                    <button onClick={() => setActiveTab('formateurs')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'formateurs' ? 'bg-academie-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Formateurs</button>
                    <button onClick={() => setActiveTab('planning')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'planning' ? 'bg-academie-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Planning</button>
                </div>
                
                {activeTab === 'dashboard' && <AcademieStats students={students} formations={formations} paiements={paiements} />}
                
                {activeTab === 'apprenants' && 
                    <div>
                        <div className="flex flex-wrap gap-4 mb-4 justify-between items-center">
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <div className="relative flex-grow md:w-64">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                    <input type="text" placeholder="Rechercher un apprenant..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700"/>
                                </div>
                                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input-style max-w-xs">
                                    <option value="Tous">Tous statuts</option>
                                    <option value="Actif">Actif</option>
                                    <option value="En pause">En pause</option>
                                    <option value="Terminé">Terminé</option>
                                    <option value="Annulé">Annulé</option>
                                </select>
                                <select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value as any)} className="input-style max-w-xs">
                                    <option value="all">Tous paiements</option>
                                    <option value="paid">À jour</option>
                                    <option value="unpaid">En retard de paiement</option>
                                </select>
                            </div>
                            <button onClick={handleExport} className="btn-secondary flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Exporter (CSV)</button>
                        </div>
                        <table className="w-full text-left">
                            <thead><tr><th>Nom</th><th>Formation</th><th>Statut</th><th>Actions</th></tr></thead>
                            <tbody>{filteredStudents.map(student => { const f = formations.find(form => form.id === student.formationId); return <tr key={student.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedStudent(student)}><td><div className="flex items-center"><img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full mr-3"/>{student.name}</div></td><td>{f?.name || 'N/A'}</td><td>{student.statut}</td><td onClick={e=>e.stopPropagation()}>{hasPermission(Permission.MANAGE_ACADEMIE) && <div className="flex space-x-1"><button onClick={() => { setIsEditing(true); setCurrentItem(student); setNewStudentData(student); setIsStudentModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button><button onClick={() => { setItemToDelete({ id: student.id, name: student.name, type: 'student' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button></div>}</td></tr>})}</tbody>
                        </table>
                    </div>
                }
                
                {activeTab === 'formations' && 
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="p-3 font-semibold">Nom</th>
                                    <th className="p-3 font-semibold">Filière</th>
                                    <th className="p-3 font-semibold">Durée</th>
                                    <th className="p-3 font-semibold">Tarifs (Élève / Pro)</th>
                                    <th className="p-3 font-semibold">Inscription</th>
                                    <th className="p-3 font-semibold">Statut</th>
                                    <th className="p-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formations.filter(f=>!f.isArchived).map(f => (
                                    <tr key={f.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => setSelectedFormation(f)}>
                                        <td className="p-3 font-medium">{f.name}</td>
                                        <td className="p-3">{f.filiere}</td>
                                        <td className="p-3">{f.duree} mois</td>
                                        <td className="p-3">
                                            <div className="flex flex-col text-xs space-y-1">
                                                <span className="text-gray-600 dark:text-gray-400">E: <span className="font-bold">{f.coutEleve?.toLocaleString()} GNF</span></span>
                                                <span className="text-academie-blue font-medium">P: <span className="font-bold">{f.coutPro?.toLocaleString()} GNF</span></span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 text-xs font-mono">
                                            {f.fraisInscription?.toLocaleString()} GNF
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.statut === 'Actif' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {f.statut}
                                            </span>
                                        </td>
                                        <td className="p-3" onClick={e=>e.stopPropagation()}>
                                            {hasPermission(Permission.MANAGE_ACADEMIE) && (
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => { setIsEditing(true); setCurrentItem(f); setNewFormationData(f); setIsFormationModalOpen(true); }} className="p-1 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-full transition-colors" title="Modifier">
                                                        <PencilIcon className="h-4 w-4"/>
                                                    </button>
                                                    <button onClick={() => { setItemToDelete({ id: f.id, name: f.name, type: 'formation' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors" title="Archiver">
                                                        <TrashIcon className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                }
                
                {activeTab === 'formateurs' && <table className="w-full text-left"><thead><tr><th>Nom</th><th>Spécialité</th><th>Email</th><th>Tarif Horaire</th><th>Actions</th></tr></thead><tbody>{formateurs.filter(f=>!f.isArchived).map(f => <tr key={f.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedFormateur(f)}><td><div className="flex items-center"><img src={f.avatarUrl} alt={f.name} className="h-8 w-8 rounded-full mr-3"/>{f.name}</div></td><td>{f.speciality}</td><td>{f.email}</td><td>{f.tarifHoraire.toLocaleString()} GNF</td><td onClick={e=>e.stopPropagation()}>{hasPermission(Permission.MANAGE_ACADEMIE) && <div className="flex space-x-1"><button onClick={() => { setIsEditing(true); setCurrentItem(f); setNewFormateurData(f); setIsFormateurModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button><button onClick={() => { setItemToDelete({ id: f.id, name: f.name, type: 'formateur' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button></div>}</td></tr>)}</tbody></table>}

                {activeTab === 'planning' && <ScheduleView schedule={scheduleEntries.filter(e=>!e.isArchived)} formations={formations} formateurs={formateurs} onEdit={(entry) => {setIsEditing(true); setCurrentItem(entry); setNewScheduleData(entry); setIsScheduleModalOpen(true);}} onDelete={(entry) => {setItemToDelete({id: entry.id, name: entry.title, type: 'schedule'}); setIsDeleteModalOpen(true);}} hasPermission={hasPermission(Permission.MANAGE_ACADEMIE)} />}
            </div>
            )}
            
            <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title={isEditing ? 'Modifier Apprenant' : 'Nouvel Apprenant'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('student', newStudentData)}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Photo</label>
                        <div className="flex items-center space-x-4"><img src={newStudentData.avatarUrl} className="h-16 w-16 rounded-full"/><input type="file" onChange={(e) => handleImageChange(e, 'student')}/></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nom complet</label>
                        <input type="text" placeholder="Nom" value={newStudentData.name} onChange={e=>setNewStudentData({...newStudentData, name: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" placeholder="Email" value={newStudentData.email} onChange={e=>setNewStudentData({...newStudentData, email: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Téléphone</label>
                        <input type="tel" placeholder="Téléphone" value={newStudentData.phone} onChange={e=>setNewStudentData({...newStudentData, phone: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Formation</label>
                        <select value={newStudentData.formationId} onChange={e=>setNewStudentData({...newStudentData, formationId: e.target.value})} className="input-style" required><option value="">-- Choisir une formation --</option>{formations.filter(f=>f.statut==='Actif').map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tarif</label>
                        <select value={newStudentData.tarif} onChange={e=>setNewStudentData({...newStudentData, tarif: e.target.value as any})} className="input-style"><option value="eleve">Élève</option><option value="professionnel">Professionnel</option></select>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-academie-blue">Enregistrer</button></div>
                </form>
            </Modal>

            <Modal isOpen={isFormateurModalOpen} onClose={() => setIsFormateurModalOpen(false)} title={isEditing ? 'Modifier Formateur' : 'Nouveau Formateur'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('formateur', newFormateurData)}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Photo</label>
                        <div className="flex items-center space-x-4"><img src={newFormateurData.avatarUrl} className="h-16 w-16 rounded-full"/><input type="file" onChange={(e) => handleImageChange(e, 'formateur')}/></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nom complet</label>
                        <input type="text" placeholder="Nom" value={newFormateurData.name} onChange={e=>setNewFormateurData({...newFormateurData, name: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Spécialité</label>
                        <input type="text" placeholder="Spécialité" value={newFormateurData.speciality} onChange={e=>setNewFormateurData({...newFormateurData, speciality: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tarif Horaire</label>
                        <input type="number" placeholder="Tarif Horaire" value={newFormateurData.tarifHoraire} onChange={e=>setNewFormateurData({...newFormateurData, tarifHoraire: +e.target.value})} className="input-style"/>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-academie-blue">Enregistrer</button></div>
                </form>
            </Modal>

            <Modal isOpen={isFormationModalOpen} onClose={() => setIsFormationModalOpen(false)} title={isEditing ? 'Modifier Formation' : 'Nouvelle Formation'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('formation', newFormationData)}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nom de la formation</label>
                        <input type="text" placeholder="Nom de la formation" value={newFormationData.name} onChange={e=>setNewFormationData({...newFormationData, name: e.target.value})} className="input-style" required/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Filière</label>
                            <select value={newFormationData.filiere} onChange={e => setNewFormationData({...newFormationData, filiere: e.target.value as any})} className="input-style">
                                <option value="Musique">Musique</option>
                                <option value="Design">Design</option>
                                <option value="Textile">Textile</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Durée (Mois)</label>
                            <input type="number" min="1" value={newFormationData.duree} onChange={e=>setNewFormationData({...newFormationData, duree: +e.target.value})} className="input-style" required/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Coût Élève (GNF)</label>
                            <input type="number" min="0" placeholder="0" value={newFormationData.coutEleve} onChange={e=>setNewFormationData({...newFormationData, coutEleve: +e.target.value})} className="input-style" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Coût Pro (GNF)</label>
                            <input type="number" min="0" placeholder="0" value={newFormationData.coutPro} onChange={e=>setNewFormationData({...newFormationData, coutPro: +e.target.value})} className="input-style" required/>
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Frais d'inscription (GNF)</label>
                        <input type="number" min="0" value={newFormationData.fraisInscription} onChange={e=>setNewFormationData({...newFormationData, fraisInscription: +e.target.value})} className="input-style"/>
                    </div>

                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-academie-blue">Enregistrer</button></div>
                </form>
            </Modal>

            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title={isEditing ? 'Modifier Cours' : 'Nouveau Cours'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit('schedule', newScheduleData)}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Titre du cours</label>
                        <input type="text" placeholder="Titre du cours" value={newScheduleData.title} onChange={e=>setNewScheduleData({...newScheduleData, title: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Formation</label>
                        <select value={newScheduleData.formationId} onChange={e=>setNewScheduleData({...newScheduleData, formationId: e.target.value})} className="input-style">
                            <option value="">-- Formation --</option>
                            {formations.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Formateur</label>
                        <select value={newScheduleData.formateurId} onChange={e=>setNewScheduleData({...newScheduleData, formateurId: e.target.value})} className="input-style">
                            <option value="">-- Formateur --</option>
                            {formateurs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Jour</label>
                        <select value={newScheduleData.dayOfWeek} onChange={e=>setNewScheduleData({...newScheduleData, dayOfWeek: e.target.value as any})} className="input-style">
                            <option>Lundi</option><option>Mardi</option><option>Mercredi</option><option>Jeudi</option><option>Vendredi</option><option>Samedi</option><option>Dimanche</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Début</label>
                            <input type="time" value={newScheduleData.startTime} onChange={e=>setNewScheduleData({...newScheduleData, startTime: e.target.value})} className="input-style"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Fin</label>
                            <input type="time" value={newScheduleData.endTime} onChange={e=>setNewScheduleData({...newScheduleData, endTime: e.target.value})} className="input-style"/>
                        </div>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-academie-blue">Enregistrer</button></div>
                </form>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Ajouter un paiement pour ${selectedStudent?.name}`}>
                <form onSubmit={e => {e.preventDefault(); handlePaymentSubmit()}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Montant (GNF)</label>
                        <input type="number" placeholder="Montant" value={newPaymentData.amount} onChange={e=>setNewPaymentData({...newPaymentData, amount: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Objet du paiement</label>
                        <select value={newPaymentData.objet} onChange={e=>setNewPaymentData({...newPaymentData, objet: e.target.value as any})} className="input-style">
                            <option>Inscription</option><option>Tranche 1</option><option>Tranche 2</option><option>Solde</option>
                        </select>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-green-600">Enregistrer</button></div>
                </form>
            </Modal>
            
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer la suppression" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`}/>
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport PS-ACADÉMIE"/>
        </div>
    );
};
