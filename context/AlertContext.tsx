import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import AlertModal from '../components/AlertModal.tsx';

interface AlertContextType {
  showAlert: (title: string, message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlert must be used within an AlertProvider');
    return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

    const showAlert = useCallback((title: string, message: string) => {
        setAlertState({ isOpen: true, title, message });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertState(null);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {alertState && (
                <AlertModal
                    isOpen={alertState.isOpen}
                    onClose={closeAlert}
                    title={alertState.title}
                    message={alertState.message}
                />
            )}
        </AlertContext.Provider>
    );
};
