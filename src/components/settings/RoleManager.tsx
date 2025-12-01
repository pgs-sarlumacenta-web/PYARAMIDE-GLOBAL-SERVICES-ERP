
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { RoleProfile, Permission } from '../../types.ts';
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal.tsx';
import ConfirmationModal from '../ConfirmationModal.tsx';
import { useAlert } from '../../context/AlertContext.tsx';

// FIX: Replaced invalid MANAGE_PRODUCTS permission and restructured groups for clarity and completeness.
// Added VIEW_ACTIVITY_LOG to "Général" and created a new "Inventaire & Stock" group.
const permissionGroups = {
    "Général": [
        { id: Permission.MANAGE_USERS_ROLES, label: "Gérer Utilisateurs & Rôles" },
        { id: Permission.MANAGE_SETTINGS, label: "Gérer Paramètres Généraux" },
        { id: Permission.VIEW_DASHBOARD_FINANCES, label: "Voir KPIs Financiers du Dashboard" },
        { id: Permission.VIEW_ACTIVITY_LOG, label: "Voir le Journal d'Activité" },
    ],
    "Clients": [
        { id: Permission.VIEW_CLIENTS, label: "Voir la liste des clients" },
        { id: Permission.MANAGE_CLIENTS, label: "Gérer les clients (Ajout/Modif.)" },
    ],
    "Finances": [
        { id: Permission.VIEW_FINANCES, label: "Voir le module Finances" },
        { id: Permission.MANAGE_FINANCES, label: "Gérer les transactions (Ajout/Modif.)" },
    ],
    "Personnel": [
        { id: Permission.VIEW_PERSONNEL, label: "Voir le module Personnel" },
        { id: Permission.MANAGE_PERSONNEL, label: "Gérer les employés (Ajout/Modif.)" },
        { id: Permission.GENERATE_PAYROLL, label: "Générer les fiches de paie" },
    ],
    "Achats": [
        { id: Permission.VIEW_ACHATS, label: "Voir le module Achats" },
        { id: Permission.MANAGE_PURCHASE_ORDERS, label: "Gérer les bons de commande" },
        { id: Permission.MANAGE_SUPPLIERS, label: "Gérer les fournisseurs" },
    ],
    "Inventaire & Stock": [
        { id: Permission.VIEW_INVENTAIRE, label: "Voir l'Inventaire & Stock" },
        { id: Permission.MANAGE_INVENTAIRE, label: "Gérer l'Inventaire (articles, matériel)" },
    ],
    "PS-ACADÉMIE": [
        { id: Permission.VIEW_ACADEMIE, label: "Voir le module Académie" },
        { id: Permission.MANAGE_ACADEMIE, label: "Gérer l'Académie (étudiants, etc.)" },
    ],
    "PS-STUDIO": [
        { id: Permission.VIEW_STUDIO, label: "Voir le module Studio" },
        { id: Permission.MANAGE_STUDIO, label: "Gérer le Studio (projets, etc.)" },
    ],
    "PS-DÉCOR": [
        { id: Permission.VIEW_DECOR, label: "Voir le module Décor" },
        { id: Permission.MANAGE_DECOR, label: "Gérer Décor (commandes, stock)" },
    ],
    "PS-SHOP": [
        { id: Permission.VIEW_SHOP, label: "Voir le module Shop" },
        { id: Permission.MANAGE_SHOP_ORDERS, label: "Gérer les commandes du Shop" },
    ],
};


const RoleManager: React.FC = () => {
    const { roles, setRoles, users } = useData();
    const { showAlert } = useAlert();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState<RoleProfile | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<RoleProfile | null>(null);

    const initialRoleState: Omit<RoleProfile, 'id'> = { name: '', permissions: [], isEditable: true };
    const [newRoleData, setNewRoleData] = useState(initialRoleState);

    const openAddModal = () => {
        setIsEditing(false);
        setCurrentRole(null);
        setNewRoleData(initialRoleState);
        setIsModalOpen(true);
    };

    const openEditModal = (role: RoleProfile) => {
        if (!role.isEditable) return;
        setIsEditing(true);
        setCurrentRole(role);
        setNewRoleData(role);
        setIsModalOpen(true);
    };

    const openDeleteModal = (role: RoleProfile) => {
        if (!role.isEditable) return;
        const usersInRole = users.filter(u => u.roleId === role.id).length;
        if (usersInRole > 0) {
            showAlert('Action impossible', `Impossible de supprimer le rôle "${role.name}" car il est assigné à ${usersInRole} utilisateur(s).`);
            return;
        }
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        setNewRoleData(prev => {
            const newPermissions = checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission);
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && currentRole) {
            setRoles(roles.map(r => r.id === currentRole.id ? { ...newRoleData, id: r.id } : r));
        } else {
            const newRole: RoleProfile = {
                ...newRoleData,
                id: `role_${Date.now()}`,
            };
            setRoles(prev => [...prev, newRole]);
        }
        setIsModalOpen(false);
    };

    const confirmDelete = () => {
        if (!roleToDelete) return;
        setRoles(roles.filter(r => r.id !== roleToDelete.id));
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-2xl font-bold">Rôles & Permissions</h2>
                    <button onClick={openAddModal} className="btn-primary bg-pgs-blue hover:bg-blue-700 flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nouveau Rôle
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 font-semibold">Nom du Rôle</th>
                                <th className="p-2 font-semibold">Utilisateurs</th>
                                <th className="p-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-2 font-medium">{role.name} {!role.isEditable && <span className="text-xs text-gray-400">(Protégé)</span>}</td>
                                    <td className="p-2">{users.filter(u => u.roleId === role.id && !u.isArchived).length}</td>
                                    <td className="p-2">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => openEditModal(role)} disabled={!role.isEditable} className="p-2 text-yellow-500 hover:bg-yellow-100 rounded-full disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => openDeleteModal(role)} disabled={!role.isEditable} className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Modifier le Rôle' : 'Nouveau Rôle'}>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="roleName" className="block text-sm font-medium">Nom du Rôle</label>
                        <input type="text" id="roleName" value={newRoleData.name} onChange={e => setNewRoleData({...newRoleData, name: e.target.value})} className="input-style w-full mt-1" required />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                            {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                                <div key={groupName}>
                                    <h4 className="font-semibold text-md text-pgs-blue border-b mb-2">{groupName}</h4>
                                    <div className="space-y-2">
                                        {permissions.map(p => (
                                            <div key={p.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={p.id}
                                                    checked={newRoleData.permissions.includes(p.id)}
                                                    onChange={e => handlePermissionChange(p.id, e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-pgs-blue focus:ring-pgs-blue"
                                                />
                                                <label htmlFor={p.id} className="ml-3 text-sm">{p.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary mr-2">Annuler</button><button type="submit" className="btn-primary bg-pgs-blue hover:bg-blue-700">{isEditing ? 'Enregistrer' : 'Créer'}</button></div>
                </form>
            </Modal>
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.name}" ? Cette action est irréversible.`}
            />
        </div>
    );
};

export default RoleManager;
