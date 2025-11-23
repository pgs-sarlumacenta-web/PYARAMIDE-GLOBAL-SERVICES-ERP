
import React, { useState } from 'react';
import { useData, useAuth } from '../context/DataContext.tsx';
import { User } from '../types.ts';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import { useAlert } from '../context/AlertContext.tsx';

const Users: React.FC = () => {
    const { users, setUsers, roles, addLogEntry } = useData();
    const { user: currentUserAuth } = useAuth();
    const { showAlert } = useAlert();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User>>({
        name: '',
        email: '',
        password: '',
        roleId: roles.find(r => r.name === 'Employé')?.id || roles[0]?.id,
        avatarUrl: 'https://via.placeholder.com/150/475569/FFFFFF?text=NU',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const togglePasswordVisibility = (userId: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentUser(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCurrentUser(prev => ({ ...prev, avatarUrl: event.target!.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setCurrentUser({ name: '', email: '', password: '', roleId: roles.find(r => r.name === 'Employé')?.id || roles[0]?.id, avatarUrl: 'https://via.placeholder.com/150/475569/FFFFFF?text=NU' });
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setIsEditing(true);
        setCurrentUser({ ...user, password: '' });
        setIsModalOpen(true);
    };
    
    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = () => {
        if (!userToDelete) return;
        setUsers(users.map(u => u.id === userToDelete.id ? { ...u, isArchived: true } : u));
        addLogEntry('Archivage', `A archivé l'utilisateur ${userToDelete.name}.`, 'user', userToDelete.id);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && 'id' in currentUser) {
            setUsers(prev => prev.map(u => {
                if (u.id === (currentUser as User).id) {
                    const updatedPassword = currentUser.password ? currentUser.password : u.password;
                    return { ...u, ...currentUser, password: updatedPassword };
                }
                return u;
            }));
            addLogEntry('Modification', `A modifié l'utilisateur ${currentUser.name}.`, 'user', currentUser.id);
        } else {
            if (!currentUser.password) {
                showAlert("Champ requis", "Le mot de passe est requis pour un nouvel utilisateur.");
                return;
            }
            const newUser: User = {
                ...(currentUser as Omit<User, 'id'>),
                id: `U${(users.length + 10).toString().padStart(3, '0')}`,
                roleId: currentUser.roleId || '',
            };
            setUsers(prev => [...prev, newUser]);
            addLogEntry('Création', `A créé l'utilisateur ${newUser.name}.`, 'user', newUser.id);
        }
        setIsModalOpen(false);
    };
    
    const getRoleClass = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return 'bg-gray-100 text-gray-800';
        switch (role.name) {
            case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'Manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            case 'Employé': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
                <button onClick={openAddModal} className="flex items-center bg-pgs-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Ajouter un utilisateur
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-pgs-border-light dark:border-pgs-border-dark">
                            <th className="py-3 px-4 font-semibold">Utilisateur</th>
                            <th className="py-3 px-4 font-semibold">Email</th>
                            <th className="py-3 px-4 font-semibold">Mot de passe</th>
                            <th className="py-3 px-4 font-semibold">Rôle</th>
                            <th className="py-3 px-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => !u.isArchived).map(user => {
                            const role = roles.find(r => r.id === user.roleId);
                            return (
                            <tr key={user.id} className="border-b border-pgs-border-light dark:border-pgs-border-dark last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4 flex items-center">
                                    <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full mr-4 object-cover" />
                                    <span>{user.name}</span>
                                </td>
                                <td className="py-3 px-4">{user.email}</td>
                                <td className="py-3 px-4 font-mono">
                                    <div className="flex items-center space-x-2">
                                        <span>
                                            {visiblePasswords[user.id] ? user.password : '********'}
                                        </span>
                                        <button onClick={() => togglePasswordVisibility(user.id)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                            {visiblePasswords[user.id] ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleClass(user.roleId)}`}>
                                        {role?.name || 'Inconnu'}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => openEditModal(user)} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-full">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => openDeleteModal(user)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Photo</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <img src={currentUser.avatarUrl} alt="Aperçu" className="h-16 w-16 rounded-full object-cover bg-gray-100" />
                            <input
                                type="file"
                                id="avatarUpload"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="avatarUpload"
                                className="cursor-pointer rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 py-2 px-3 text-sm font-medium leading-4 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Changer
                            </label>
                        </div>
                    </div>
                    <div><label>Nom</label><input name="name" type="text" value={currentUser.name} onChange={handleInputChange} required className="mt-1 block w-full input-style" /></div>
                    <div><label>Email</label><input name="email" type="email" value={currentUser.email} onChange={handleInputChange} required className="mt-1 block w-full input-style" /></div>
                    <div><label>Mot de passe</label><input name="password" type="password" value={currentUser.password} onChange={handleInputChange} placeholder={isEditing ? "Laisser vide pour ne pas changer" : ""} required={!isEditing} className="mt-1 block w-full input-style" /></div>
                    <div><label>Rôle</label><select name="roleId" value={currentUser.roleId} onChange={handleInputChange} required className="mt-1 block w-full input-style">
                        {roles.filter(r => r.isEditable || r.id === currentUser.roleId).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select></div>
                     <div><label>Département</label><select name="department" value={currentUser.department || ''} onChange={handleInputChange} className="mt-1 block w-full input-style">
                        <option value="Admin">Admin</option>
                        <option value="Académie">Académie</option>
                        <option value="Studio">Studio</option>
                        <option value="Décor">Décor</option>
                        <option value="Shop">Shop</option>
                    </select></div>
                    <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 btn-secondary">Annuler</button><button type="submit" className="btn-primary">{isEditing ? 'Enregistrer' : 'Ajouter'}</button></div>
                </form>
            </Modal>

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmer l'archivage"
                message={`Êtes-vous sûr de vouloir archiver l'utilisateur ${userToDelete?.name} ?`}
            />
        </div>
    );
};

export default Users;
