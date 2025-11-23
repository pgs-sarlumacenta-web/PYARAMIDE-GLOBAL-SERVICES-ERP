import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { Employee, Payroll, Transaction, Permission } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import HiddenDownloader from '../components/HiddenDownloader.tsx';
import FicheDePaie from '../components/personnel/FicheDePaie.tsx';
import BadgePersonnel from '../components/personnel/BadgePersonnel.tsx';
import AttestationTravail from '../components/personnel/AttestationTravail.tsx';
import PersonnelStats from '../components/personnel/PersonnelStats.tsx';
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, IdentificationIcon, ChartPieIcon, EllipsisVerticalIcon, ArrowLeftIcon, UserCircleIcon, BanknotesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ReportModal from '../components/ReportModal.tsx';
import PersonnelReport from '../components/personnel/PersonnelReport.tsx';
import { useAlert } from '../context/AlertContext.tsx';

type Tab = 'dashboard' | 'employes' | 'paie';
type DetailTab = 'dashboard' | 'paie' | 'documents';

const initialEmployeeState: Omit<Employee, 'id'> = { name: '', role: '', department: 'Admin', salary: 0, avatarUrl: `https://via.placeholder.com/150/6366f1/FFFFFF?text=NE`, hireDate: new Date().toISOString().split('T')[0], iban: '', phone: '' };

export const Personnel: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const { employees, setEmployees, payrolls, setPayrolls, setTransactions, companyProfile } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();
    
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [isPayrollConfirmOpen, setIsPayrollConfirmOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Employee | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Employee | null>(null);
    
    const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id'>>(initialEmployeeState);
    const [payrollData, setPayrollData] = useState<{ period: string, deductions: number } | null>(null);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('dashboard');

    const [documentToDownload, setDocumentToDownload] = useState<{ content: React.ReactNode; format: 'pdf' | 'png', title: string } | null>(null);

    useEffect(() => {
        const state = location.state as { selectedId?: string };
        if (state?.selectedId) {
            const employeeToSelect = employees.find(e => e.id === state.selectedId && !e.isArchived);
            if (employeeToSelect) {
                setSelectedEmployee(employeeToSelect);
                setActiveTab('employes');
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, employees, navigate]);

    const openAddModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewEmployeeData(initialEmployeeState);
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_PERSONNEL) || selectedEmployee) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'employes') {
            config = { onClick: openAddModal, title: "Nouvel Employé" };
        }
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, selectedEmployee, hasPermission, setFabConfig, openAddModal]);
    
    const handleClose = () => navigate(-1);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewEmployeeData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFormSubmit = () => {
        if (isEditing && currentItem) {
            setEmployees(prev => prev.map(e => e.id === currentItem.id ? { ...newEmployeeData, id: e.id, salary: +newEmployeeData.salary } as Employee : e));
            showAlert('Succès', 'Employé mis à jour.');
        } else {
            const newId = `E-${Date.now()}`;
            setEmployees(prev => [{ ...newEmployeeData, id: newId, salary: +newEmployeeData.salary } as Employee, ...prev]);
            showAlert('Succès', 'Employé ajouté.');
        }
        setIsModalOpen(false);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setEmployees(prev => prev.map(e => e.id === itemToDelete.id ? { ...e, isArchived: true } : e));
        if (selectedEmployee?.id === itemToDelete.id) setSelectedEmployee(null);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        showAlert('Succès', 'Employé archivé.');
    };

    const handleGeneratePayroll = () => {
        if (!payrollData || !currentItem) return;
        
        const newPayroll: Payroll = {
            id: `PAY-${currentItem.id}-${Date.now()}`,
            employeeId: currentItem.id,
            period: payrollData.period,
            grossSalary: currentItem.salary,
            deductions: payrollData.deductions,
            netSalary: currentItem.salary - payrollData.deductions,
            paymentDate: new Date().toISOString(),
            status: 'En attente',
        };

        setPayrolls(prev => [newPayroll, ...prev]);
        setIsPayrollModalOpen(false);
        setPayrollData(null);
        setIsPayrollConfirmOpen(true);
    };

    const confirmPayrollPayment = (payroll: Payroll) => {
        setPayrolls(prev => prev.map(p => p.id === payroll.id ? { ...p, status: 'Payé' } : p));
        const newTransaction: Transaction = {
            id: `T-PAY-${payroll.id}`, date: new Date().toISOString(),
            department: 'Général', description: `Paiement salaire ${payroll.period} - ${currentItem?.name}`,
            amount: -payroll.netSalary, type: 'Dépense', category: 'Salaires'
        };
        setTransactions(prev => [newTransaction, ...prev]);
        
        setDocumentToDownload({
            title: `Fiche de Paie - ${currentItem?.name} - ${payroll.period}`,
            content: <FicheDePaie employee={currentItem!} payroll={payroll} companyProfile={companyProfile} />,
            format: 'pdf',
        });
        showAlert('Succès', 'Paiement de la paie confirmé.');
    };

    const openDocument = (type: 'badge' | 'attestation' | 'fiche_paie') => {
        if (!selectedEmployee) return;

        if (type === 'badge') {
            setDocumentToDownload({ title: `Badge - ${selectedEmployee.name}`, content: <BadgePersonnel employee={selectedEmployee} companyProfile={companyProfile} />, format: 'png' });
        } else if (type === 'attestation') {
            setDocumentToDownload({ title: `Attestation - ${selectedEmployee.name}`, content: <AttestationTravail employee={selectedEmployee} companyProfile={companyProfile} directorName={user?.name || 'Le Directeur'} />, format: 'pdf' });
        } else if (type === 'fiche_paie') {
            const lastPayroll = payrolls.filter(p => p.employeeId === selectedEmployee.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
            if (!lastPayroll) {
                showAlert("Information", "Aucune fiche de paie n'a été générée pour cet employé.");
                return;
            }
            setDocumentToDownload({ title: `Fiche de Paie - ${selectedEmployee.name} - ${lastPayroll.period}`, content: <FicheDePaie employee={selectedEmployee} payroll={lastPayroll} companyProfile={companyProfile} />, format: 'pdf' });
        }
    };

    const handleGenerateReport = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const newHires = employees.filter(e => {
            const hireDate = new Date(e.hireDate);
            return hireDate >= start && hireDate <= end;
        });
        const periodPayrolls = payrolls.filter(p => {
            const payDate = new Date(p.paymentDate);
            return payDate >= start && payDate <= end;
        });
        const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        setDocumentToDownload({
            title: `Rapport Personnel - ${period}`,
            content: <PersonnelReport employees={employees} newHires={newHires} payrolls={periodPayrolls} period={period} companyProfile={companyProfile} />,
            format: 'pdf',
        });
    };
    
    const handleExport = (type: 'employees' | 'payrolls') => {
        let dataToExport: any[] = [];
        let fileName = '';

        if (type === 'employees') {
            dataToExport = employees.filter(e => !e.isArchived).map(e => ({
                'Nom': e.name,
                'Rôle': e.role,
                'Département': e.department,
                'Salaire': e.salary,
                'Date Embauche': new Date(e.hireDate).toLocaleDateString('fr-CA'),
                'Téléphone': e.phone,
                'IBAN': e.iban,
            }));
            fileName = 'employes';
        } else if (type === 'payrolls') {
            dataToExport = payrolls.filter(p => !p.isArchived).map(p => {
                const employee = employees.find(e => e.id === p.employeeId);
                return {
                    'Employé': employee?.name || 'N/A',
                    'Période': p.period,
                    'Salaire Brut': p.grossSalary,
                    'Déductions': p.deductions,
                    'Salaire Net': p.netSalary,
                    'Date Paiement': new Date(p.paymentDate).toLocaleDateString('fr-CA'),
                    'Statut': p.status,
                };
            });
            fileName = 'paies';
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

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => ( <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-personnel-indigo text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button> );
    const DetailTabButton: React.FC<{ tab: DetailTab, label: string, icon: React.ElementType }> = ({ tab, label, icon: Icon }) => ( <button onClick={() => setActiveDetailTab(tab)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === tab ? 'border-personnel-indigo text-personnel-indigo' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Icon className="h-5 w-5" /><span>{label}</span></button> );

    const renderDetailView = () => {
        if (!selectedEmployee) return null;
        const employeePayrolls = payrolls.filter(p => p.employeeId === selectedEmployee.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        
        return (
            <div className="animate-fade-in">
                 <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
                    <img src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="h-16 w-16 rounded-full object-cover" />
                    <div><h2 className="text-3xl font-bold">{selectedEmployee.name}</h2><p className="text-gray-500">{selectedEmployee.role}</p></div>
                </div>
                <div className="border-b"><nav className="-mb-px flex space-x-4"><DetailTabButton tab="dashboard" label="Tableau de Bord" icon={UserCircleIcon} /><DetailTabButton tab="paie" label="Historique de Paie" icon={BanknotesIcon} /><DetailTabButton tab="documents" label="Documents" icon={DocumentTextIcon} /></nav></div>
                <div className="mt-6">
                    {activeDetailTab === 'dashboard' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3">
                            <h3 className="font-semibold text-lg">Informations</h3>
                            <p><strong>Département:</strong> {selectedEmployee.department}</p>
                            <p><strong>Salaire Mensuel:</strong> {selectedEmployee.salary.toLocaleString()} GNF</p>
                            <p><strong>Date d'embauche:</strong> {new Date(selectedEmployee.hireDate).toLocaleDateString()}</p>
                            <p><strong>IBAN:</strong> {selectedEmployee.iban}</p>
                            <p><strong>Téléphone:</strong> {selectedEmployee.phone}</p>
                        </div>
                    )}
                    {activeDetailTab === 'paie' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="font-semibold text-lg mb-2">Historique de Paie</h3>
                            <table className="w-full text-left text-sm">
                                <thead><tr><th className="p-2">Période</th><th className="p-2">Salaire Net</th><th className="p-2">Statut</th><th className="p-2">Actions</th></tr></thead>
                                <tbody>{employeePayrolls.map(p => <tr key={p.id} className="border-b"><td>{p.period}</td><td>{p.netSalary.toLocaleString()} GNF</td><td>{p.status}</td><td>{p.status === 'En attente' && <button onClick={() => confirmPayrollPayment(p)} className="text-green-600">Confirmer Paiement</button>}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {activeDetailTab === 'documents' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-3">
                            <h3 className="font-semibold text-lg">Générer des Documents</h3>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openDocument('badge')} className="btn-secondary">Badge</button>
                                <button onClick={() => openDocument('attestation')} className="btn-secondary">Attestation de Travail</button>
                                <button onClick={() => openDocument('fiche_paie')} className="btn-secondary" disabled={employeePayrolls.length === 0}>Dernière Fiche de Paie</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-personnel-indigo">Personnel</h1>{!selectedEmployee && <div className="flex items-center space-x-2"><button onClick={() => setIsReportModalOpen(true)} className="btn-secondary flex items-center"><ChartPieIcon className="h-5 w-5 mr-2" />Générer un Rapport</button><button onClick={handleClose} className="btn-secondary">Fermer</button></div>}</div>
            {selectedEmployee ? renderDetailView() : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                    <div className="flex space-x-2 border-b mb-4"><TabButton tab="dashboard" label="Tableau de Bord" /><TabButton tab="employes" label="Employés" /><TabButton tab="paie" label="Gestion de la Paie" /></div>
                    {activeTab === 'dashboard' && <PersonnelStats employees={employees} payrolls={payrolls} />}
                    {activeTab === 'employes' && (
                        <div>
                        <div className="flex justify-end mb-4"><button onClick={() => handleExport('employees')} className="btn-secondary flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Exporter (CSV)</button></div>
                        <table className="w-full text-left">
                            <thead><tr><th>Nom</th><th>Rôle</th><th>Département</th><th>Salaire</th><th>Actions</th></tr></thead>
                            <tbody>{employees.filter(e => !e.isArchived).map(e => <tr key={e.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedEmployee(e)}><td><div className="flex items-center"><img src={e.avatarUrl} alt={e.name} className="h-8 w-8 rounded-full mr-3"/>{e.name}</div></td><td>{e.role}</td><td>{e.department}</td><td>{e.salary.toLocaleString()} GNF</td><td onClick={ev=>ev.stopPropagation()}>{hasPermission(Permission.MANAGE_PERSONNEL) && <div className="flex space-x-1"><button onClick={() => { setIsEditing(true); setCurrentItem(e); setNewEmployeeData(e); setIsModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-4 w-4"/></button><button onClick={() => { setItemToDelete(e); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-4 w-4"/></button></div>}</td></tr>)}</tbody>
                        </table>
                        </div>
                    )}
                    {activeTab === 'paie' && (
                        <div>
                        <div className="flex justify-end mb-4"><button onClick={() => handleExport('payrolls')} className="btn-secondary flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Exporter (CSV)</button></div>
                        <table className="w-full text-left">
                            <thead><tr><th>Employé</th><th>Période</th><th>Salaire Net</th><th>Statut</th><th>Actions</th></tr></thead>
                            <tbody>{payrolls.filter(p => !p.isArchived).map(p => { const e = employees.find(emp => emp.id === p.employeeId); return <tr key={p.id} className="border-b"><td>{e?.name}</td><td>{p.period}</td><td>{p.netSalary.toLocaleString()} GNF</td><td>{p.status}</td><td>{p.status === 'En attente' && hasPermission(Permission.GENERATE_PAYROLL) && <button onClick={() => { setCurrentItem(e!); setPayrollData(p); setIsPayrollConfirmOpen(true); }} className="text-green-600">Confirmer Paiement</button>}</td></tr>})}</tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Modifier Employé' : 'Nouvel Employé'}>
                <form onSubmit={e => {e.preventDefault(); handleFormSubmit()}} className="space-y-4">
                    <div className="flex items-center space-x-4"><img src={newEmployeeData.avatarUrl} className="h-16 w-16 rounded-full"/><input type="file" onChange={handleImageChange}/></div>
                    <input type="text" placeholder="Nom" value={newEmployeeData.name} onChange={e=>setNewEmployeeData({...newEmployeeData, name: e.target.value})} className="input-style" required/>
                    <input type="text" placeholder="Rôle" value={newEmployeeData.role} onChange={e=>setNewEmployeeData({...newEmployeeData, role: e.target.value})} className="input-style"/>
                    <input type="number" placeholder="Salaire" value={newEmployeeData.salary} onChange={e=>setNewEmployeeData({...newEmployeeData, salary: +e.target.value})} className="input-style"/>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-personnel-indigo">Enregistrer</button></div>
                </form>
            </Modal>
             <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title={`Générer la paie pour ${currentItem?.name}`}>
                <form onSubmit={e => {e.preventDefault(); handleGeneratePayroll()}} className="space-y-4">
                    <input type="text" placeholder="Période (ex: Octobre 2023)" onChange={e=>setPayrollData({...payrollData, period: e.target.value} as any)} className="input-style" required/>
                    <input type="number" placeholder="Déductions (GNF)" onChange={e=>setPayrollData({...payrollData, deductions: +e.target.value} as any)} className="input-style" required/>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-personnel-indigo">Générer</button></div>
                </form>
            </Modal>
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`}/>
            {currentItem && payrollData && <ConfirmationModal isOpen={isPayrollConfirmOpen} onClose={() => setIsPayrollConfirmOpen(false)} onConfirm={() => confirmPayrollPayment(payrolls.find(p=>p.period===payrollData.period && p.employeeId===currentItem.id)!)} title="Confirmer le Paiement" message={`Confirmez-vous le paiement de ${((currentItem?.salary || 0) - (payrollData?.deductions || 0)).toLocaleString()} GNF à ${currentItem.name} ?`}/>}
            {documentToDownload && <HiddenDownloader content={documentToDownload.content} format={documentToDownload.format} title={documentToDownload.title} onComplete={() => setDocumentToDownload(null)} />}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} title="Générer Rapport du Personnel"/>
        </div>
    );
};
