
import React from 'react';
import { useData } from '../context/DataContext.tsx';
import ActivityLogViewer from '../components/settings/ActivityLogViewer.tsx';
import { useNavigate } from 'react-router-dom';

const ActivityLogPage: React.FC = () => {
    const { activityLog, users } = useData();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Journal d'Activité</h1>
                <button onClick={() => navigate(-1)} className="btn-secondary">Retour</button>
            </div>
            <ActivityLogViewer logs={activityLog} users={users} />
        </div>
    );
};

export default ActivityLogPage;
