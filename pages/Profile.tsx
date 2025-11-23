import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../context/DataContext.tsx';
import { User } from '../types.ts';
import { CameraIcon } from '@heroicons/react/24/solid';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { users, setUsers, roles } = useData();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        avatarUrl: '',
    });
    
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
            });
        }
    }, [user]);

    if (!user) {
        return <div className="text-center p-8">Chargement du profil...</div>;
    }

    const userRole = roles.find(r => r.id === user.roleId);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData(prev => ({ ...prev, avatarUrl: event.target!.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedUser: User = { ...user, ...formData };
        setUsers(users.map(u => (u.id === user.id ? updatedUser : u)));
        setSuccessMessage('Profil mis à jour avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleClose = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Mon Profil</h1>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                         <div className="relative">
                            <img src={formData.avatarUrl} alt="Avatar" className="h-32 w-32 rounded-full object-cover border-4 border-pgs-blue" />
                             <label htmlFor="avatarUpload" className="absolute bottom-0 right-0 bg-pgs-blue text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                                <CameraIcon className="h-5 w-5" />
                                <input
                                    type="file"
                                    id="avatarUpload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                             </label>
                         </div>
                         <div className="text-center">
                             <h2 className="text-2xl font-bold">{user.name}</h2>
                             <p className="text-gray-500">{userRole?.name} {user.department && user.department !== 'Admin' ? `(${user.department})` : ''}</p>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nom complet</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700"
                            />
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium">Adresse Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-pgs-blue focus:ring-1 focus:ring-pgs-blue sm:text-sm bg-gray-50 dark:bg-gray-700"
                            />
                        </div>
                    </div>
                    
                    <div className="border-t pt-6 flex justify-end items-center space-x-4">
                        {successMessage && <p className="text-green-600 text-sm flex-grow">{successMessage}</p>}
                        <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                            Fermer
                        </button>
                        <button type="submit" className="px-4 py-2 text-white bg-pgs-blue rounded-md hover:bg-blue-700">
                            Enregistrer les modifications
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;