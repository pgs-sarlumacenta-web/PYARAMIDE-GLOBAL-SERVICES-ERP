import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface FabConfig {
    onClick: () => void;
    title: string;
}

interface FabContextType {
    fabConfig: FabConfig | null;
    setFabConfig: (config: FabConfig | null) => void;
}

const FabContext = createContext<FabContextType | undefined>(undefined);

// FIX: Changed from a function declaration to a const arrow function with explicit children typing to resolve "children is missing" error.
export const FabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fabConfig, setFabConfig] = useState<FabConfig | null>(null);

    const value = useMemo(() => ({ fabConfig, setFabConfig }), [fabConfig]);

    return (
        <FabContext.Provider value={value}>
            {children}
        </FabContext.Provider>
    );
};

export const useFab = () => {
    const context = useContext(FabContext);
    if (context === undefined) {
        throw new Error('useFab must be used within a FabProvider');
    }
    return context;
};