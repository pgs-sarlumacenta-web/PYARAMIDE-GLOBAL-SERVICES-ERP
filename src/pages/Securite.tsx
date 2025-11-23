
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, usePermissions, useAuth } from '../context/DataContext.tsx';
import { useFab } from '../context/FabContext.tsx';
import { Camera, IncidentLog, Permission, Materiel } from '../types.ts';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

type Tab = 'dashboard' | 'cameras' | 'incidents';

const initialCameraState: Omit<Camera, 'id' | 'categoryId' | 'isArchived' | 'assignedTo'> = {
    name: '',
    serialNumber: '',
    status: 'En service',
    ipAddress: '',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
};

const initialIncidentState: Omit<IncidentLog, 'id' | 'isArchived'> = {
    dateTime: new Date().toISOString(),
    cameraIds: [],
    description: '',
    severity: 'Faible',
    status: 'Ouvert',
    reportedById: '',
};

const SecuriteDashboard: React.FC<{ cameras: Camera[], incidents: IncidentLog[] }> = ({ cameras, incidents }) => {
    const onlineCameras = cameras.filter(c => !c.isArchived && c.status === 'En service').length;
    const offlineCameras = cameras.filter(c => !c.isArchived).length - onlineCameras;
    const openIncidents = incidents.filter(i => !i.isArchived && (i.status === 'Ouvert' || i.status === 'En cours de révision')).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">Caméras Installées</p><p className="text-3xl font-bold">{cameras.filter(c => !c.isArchived).length}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">En Ligne / Hors Ligne</p><p className="text-3xl font-bold"><span className="text-green-500">{onlineCameras}</span> / <span className="text-red-500">{offlineCameras}</span></p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"><p className="text-sm text-gray-500">Incidents Ouverts</p><p className="text-3xl font-bold text-yellow-500">{openIncidents}</p></div>
        </div>
    );
};


export const Securite: React.FC = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { user } = useAuth();
    const { cameras, setCameras, incidents, setIncidents, addLogEntry } = useData();
    const { setFabConfig } = useFab();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isLiveViewModalOpen, setIsLiveViewModalOpen] = useState(false);
    const [cameraToView, setCameraToView] = useState<Camera | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: string } | null>(null);

    const [newCameraData, setNewCameraData] = useState<Omit<Camera, 'id' | 'categoryId' | 'isArchived' | 'assignedTo'>>(initialCameraState);
    const [newIncidentData, setNewIncidentData] = useState<Omit<IncidentLog, 'id' | 'isArchived'>>(initialIncidentState);

    const openAddCameraModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        setNewCameraData(initialCameraState);
        setIsCameraModalOpen(true);
    }, []);

    const openAddIncidentModal = useCallback(() => {
        setIsEditing(false);
        setCurrentItem(null);
        if (user) {
            setNewIncidentData({ ...initialIncidentState, reportedById: user.id });
        }
        setIsIncidentModalOpen(true);
    }, [user]);

    useEffect(() => {
        if (!hasPermission(Permission.MANAGE_SECURITE)) {
            setFabConfig(null);
            return;
        }
        let config = null;
        if (activeTab === 'cameras') config = { onClick: openAddCameraModal, title: "Nouvelle Caméra" };
        else if (activeTab === 'incidents') config = { onClick: openAddIncidentModal, title: "Nouvel Incident" };
        setFabConfig(config);
        return () => setFabConfig(null);
    }, [activeTab, hasPermission, setFabConfig, openAddCameraModal, openAddIncidentModal]);

    const handleCameraSubmit = () => {
        const action = isEditing ? 'Modification' : 'Création';
        const categoryId = 'CAT006'; // Surveillance category from mock data
        if (isEditing && currentItem) {
            const updatedCamera: Camera = { ...currentItem, ...newCameraData };
            setCameras(prev => prev.map(c => c.id === currentItem.id ? updatedCamera : c));
            addLogEntry(action, `A modifié la caméra ${updatedCamera.name}`, 'camera', updatedCamera.id);
        } else {
            const newId = `CAM-${Date.now()}`;
            const newCamera: Camera = {
                ...newCameraData,
                id: newId,
                categoryId: categoryId,
            };
            setCameras(prev => [newCamera, ...prev]);
            addLogEntry(action, `A créé la caméra ${newCamera.name}`, 'camera', newId);
        }
        setIsCameraModalOpen(false);
    };

    const handleIncidentSubmit = () => {
        const action = isEditing ? 'Modification' : 'Création';
        if (isEditing && currentItem) {
            const updatedIncident = { ...currentItem, ...newIncidentData };
            setIncidents(prev => prev.map(i => i.id === currentItem.id ? updatedIncident : i));
            addLogEntry(action, `A modifié l'incident #${updatedIncident.id}`, 'incidentLog', updatedIncident.id);
        } else {
            const newId = `INC-${Date.now()}`;
            const newIncident: IncidentLog = { ...newIncidentData, id: newId } as IncidentLog;
            setIncidents(prev => [newIncident, ...prev]);
             addLogEntry(action, `A créé l'incident #${newId}`, 'incidentLog', newId);
        }
        setIsIncidentModalOpen(false);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'camera') {
            setCameras(prev => prev.map(c => c.id === itemToDelete.id ? { ...c, isArchived: true } : c));
            addLogEntry('Archivage', `A archivé la caméra ${itemToDelete.name}`, 'camera', itemToDelete.id);
        } else {
            setIncidents(prev => prev.map(i => i.id === itemToDelete.id ? { ...i, isArchived: true } : i));
            addLogEntry('Archivage', `A archivé l'incident ${itemToDelete.name}`, 'incidentLog', itemToDelete.id);
        }
        setIsDeleteModalOpen(false);
    };
    
    const getCameraStatusClass = (status: Materiel['status']) => ({
        'En service': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', 
        'En maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        'Hors service': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', 
        'Stocké': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    })[status];
    
    const getIncidentSeverityClass = (severity: IncidentLog['severity']) => ({
        'Faible': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', 
        'Moyenne': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        'Élevée': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    })[severity];

    const handleClose = () => navigate('/dashboard');

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (<button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-securite-gray text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{label}</button>);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-securite-gray flex items-center"><ShieldCheckIcon className="h-8 w-8 mr-3" />PS-SÉCURITÉ</h1>
                <button onClick={handleClose} className="btn-secondary">Fermer</button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex space-x-2 border-b mb-4">
                    <TabButton tab="dashboard" label="Tableau de Bord" />
                    <TabButton tab="cameras" label="Caméras" />
                    <TabButton tab="incidents" label="Incidents" />
                </div>
                {activeTab === 'dashboard' && <SecuriteDashboard cameras={cameras} incidents={incidents} />}
                {activeTab === 'cameras' && 
                    <table className="w-full text-left">
                        <thead><tr><th>Nom</th><th>Localisation</th><th>Adresse IP</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>{cameras.filter(c=>!c.isArchived).map(c => 
                            <tr key={c.id} className="border-b">
                                <td>{c.name}</td><td>{c.location}</td><td className="font-mono">{c.ipAddress}</td>
                                <td><span className={`px-2 py-1 text-xs rounded-full ${getCameraStatusClass(c.status)}`}>{c.status}</span></td>
                                <td>
                                    <div className="flex space-x-1">
                                        <button onClick={() => { setCameraToView(c); setIsLiveViewModalOpen(true); }} className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full" title="Voir le direct"><VideoCameraIcon className="h-5 w-5"/></button>
                                        {hasPermission(Permission.MANAGE_SECURITE) && <>
                                            <button onClick={() => { setIsEditing(true); setCurrentItem(c); setNewCameraData(c); setIsCameraModalOpen(true); }} className="p-1 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-full" title="Modifier"><PencilIcon className="h-5 w-5"/></button>
                                            <button onClick={() => { setItemToDelete({ id: c.id, name: c.name, type: 'camera' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" title="Archiver"><TrashIcon className="h-5 w-5"/></button>
                                        </>}
                                    </div>
                                </td>
                            </tr>
                        )}</tbody>
                    </table>
                }
                {activeTab === 'incidents' && <table className="w-full text-left"><thead><tr><th>Date/Heure</th><th>Description</th><th>Sévérité</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{incidents.filter(i=>!i.isArchived).map(i => <tr key={i.id} className="border-b"><td>{new Date(i.dateTime).toLocaleString()}</td><td>{i.description}</td><td><span className={`px-2 py-1 text-xs rounded-full ${getIncidentSeverityClass(i.severity)}`}>{i.severity}</span></td><td>{i.status}</td><td>{hasPermission(Permission.MANAGE_SECURITE) && <div className="flex space-x-1"><button onClick={() => { setIsEditing(true); setCurrentItem(i); setNewIncidentData(i); setIsIncidentModalOpen(true); }} className="p-1 text-yellow-500"><PencilIcon className="h-5 w-5"/></button><button onClick={() => { setItemToDelete({ id: i.id, name: `Incident #${i.id}`, type: 'incident' }); setIsDeleteModalOpen(true); }} className="p-1 text-red-500"><TrashIcon className="h-5 w-5"/></button></div>}</td></tr>)}</tbody></table>}
            </div>

            <Modal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} title={isEditing ? 'Modifier Caméra' : 'Nouvelle Caméra'}>
                <form onSubmit={e => {e.preventDefault(); handleCameraSubmit()}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input type="text" placeholder="Nom" value={newCameraData.name} onChange={e=>setNewCameraData({...newCameraData, name: e.target.value})} className="input-style" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Localisation</label>
                        <input type="text" placeholder="Localisation" value={newCameraData.location} onChange={e=>setNewCameraData({...newCameraData, location: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Adresse IP</label>
                        <input type="text" placeholder="Adresse IP (pour le flux live)" value={newCameraData.ipAddress} onChange={e=>setNewCameraData({...newCameraData, ipAddress: e.target.value})} className="input-style"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Statut</label>
                        <select value={newCameraData.status} onChange={e => setNewCameraData({...newCameraData, status: e.target.value as Materiel['status']})} className="input-style">
                            <option value="En service">En service</option>
                            <option value="Hors service">Hors service</option>
                            <option value="En maintenance">En maintenance</option>
                            <option value="Stocké">Stocké</option>
                        </select>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-securite-gray">Enregistrer</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} title={isEditing ? 'Modifier Incident' : 'Nouvel Incident'}>
                 <form onSubmit={e => {e.preventDefault(); handleIncidentSubmit()}} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea placeholder="Description" value={newIncidentData.description} onChange={e=>setNewIncidentData({...newIncidentData, description: e.target.value})} className="input-style" rows={4} required/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sévérité</label>
                            <select value={newIncidentData.severity} onChange={e=>setNewIncidentData({...newIncidentData, severity: e.target.value as any})} className="input-style">
                                <option>Faible</option><option>Moyenne</option><option>Élevée</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Statut</label>
                            <select value={newIncidentData.status} onChange={e=>setNewIncidentData({...newIncidentData, status: e.target.value as any})} className="input-style">
                                <option>Ouvert</option><option>En cours de révision</option><option>Résolu</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Caméras concernées</label>
                        <select
                            multiple
                            value={newIncidentData.cameraIds}
                            onChange={(e) => {
                                const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                setNewIncidentData({...newIncidentData, cameraIds: selectedIds });
                            }}
                            className="input-style h-32"
                        >
                            {cameras.filter(c => !c.isArchived).map(c => <option key={c.id} value={c.id}>{c.name} - {c.location}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="btn-primary bg-securite-gray">Enregistrer</button></div>
                </form>
            </Modal>

            <Modal isOpen={isLiveViewModalOpen} onClose={() => setIsLiveViewModalOpen(false)} title={`Direct - ${cameraToView?.name || ''}`}>
                {cameraToView ? (
                    <div>
                        <p className="text-sm text-gray-500 mb-2">{cameraToView.location}</p>
                        <div className="bg-black rounded-lg overflow-hidden aspect-video">
                            {/* This assumes the camera provides an MJPEG stream directly accessible via its IP */}
                            <img 
                                src={`http://${cameraToView.ipAddress}/mjpg/video.mjpg`} 
                                alt={`Flux de ${cameraToView.name}`} 
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/640x360/000000/FFFFFF?text=Flux+indisponible`; }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Note: Le flux peut ne pas s'afficher si l'ordinateur n'est pas sur le même réseau que la caméra ou si la caméra ne fournit pas un flux compatible.</p>
                    </div>
                ) : <p>Aucune caméra sélectionnée.</p>}
            </Modal>

            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Confirmer l'archivage" message={`Voulez-vous vraiment archiver ${itemToDelete?.name} ?`} />
        </div>
    );
};
