import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useStickyTheme = (): [Theme, () => void] => {
    const [theme, setTheme] = useState<Theme>(() => {
        const stickyValue = window.localStorage.getItem('pgs_theme');
        return (stickyValue === 'dark' || stickyValue === 'light') ? stickyValue : 'light';
    });

    useEffect(() => {
        window.localStorage.setItem('pgs_theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return [theme, toggleTheme];
};


export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, toggleTheme] = useStickyTheme();

    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
