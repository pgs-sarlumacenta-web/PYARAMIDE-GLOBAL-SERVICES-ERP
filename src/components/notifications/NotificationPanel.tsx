import React from 'react';
import { useData } from '../../context/DataContext.tsx';
import { BellAlertIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, setNotifications } = useData();

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onClose();
  };

  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-pgs-border-light dark:border-pgs-border-dark">
      <div className="p-3 border-b border-pgs-border-light dark:border-pgs-border-dark flex justify-between items-center">
        <h4 className="font-semibold">Notifications</h4>
        <button onClick={handleMarkAllAsRead} className="text-xs text-pgs-blue hover:underline">
          Tout marquer comme lu
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map(n => (
            <div
              key={n.id}
              className={`p-3 flex items-start space-x-3 border-b border-pgs-border-light dark:border-pgs-border-dark last:border-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className={`flex-shrink-0 mt-1 ${n.type === 'alert' ? 'text-red-500' : 'text-green-500'}`}>
                {n.type === 'alert' ? <BellAlertIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString('fr-FR')}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Marquer comme lu"
                  className="flex-shrink-0 p-1"
                >
                  <div className="h-2.5 w-2.5 bg-pgs-blue rounded-full"></div>
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 p-6 text-sm">Aucune nouvelle notification.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;