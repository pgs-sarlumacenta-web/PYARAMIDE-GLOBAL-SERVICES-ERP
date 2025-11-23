
import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient.ts';
import { User as SupabaseUser } from '@supabase/supabase-js';
import * as mock from '../data/mockData.ts';
import * as types from '../types.ts';

// --- Standalone Seeding Function (Adapted for Supabase) ---
const seedDatabase = async () => {
    if (!isSupabaseConfigured) return;

    console.log("Checking if database needs seeding...");
    // Check if users table is empty
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (!error && data && data.length > 0) {
        console.log("Database already seeded.");
        return;
    }

    console.log("Database is empty. Seeding data to Supabase...");

    try {
        const collections: { [key: string]: any } = mock;
        for (const collectionName in collections) {
             if (collectionName.startsWith('mock')) {
                // Map mock variable name to table name
                // e.g. mockUsers -> users, mockRoleProfiles -> roles (need mapping)
                let tableName = collectionName.replace('mock', '').toLowerCase();
                
                // Manual mapping for plural/singular mismatches if necessary
                if (tableName === 'roles') tableName = 'roles'; // Adjust if your table is named differently
                
                const data = collections[collectionName];
                
                if (Array.isArray(data) && data.length > 0) {
                    // Clean data to ensure it matches columns (optional, depends on strictness)
                    const { error: insertError } = await supabase.from(tableName).upsert(data);
                    if (insertError) console.warn(`Error seeding ${tableName}:`, insertError.message);
                } else if (typeof data === 'object' && data !== null) {
                    // For single settings objects
                    if (tableName === 'companyprofile' || tableName === 'billingsettings' || tableName === 'wifizonesettings') {
                         // Assuming a 'settings' table with a 'key' column and a jsonb 'value' column, 
                         // OR individual tables for each setting. Let's assume individual tables for simplicity of migration
                         // or a generic settings table. 
                         // For this migration, let's skip complex single-doc seeding or assume a 'settings' table
                         // exists where id='companyprofile'.
                         await supabase.from('settings').upsert({ id: tableName, ...data });
                    }
                }
            }
        }
        console.log("Seeding attempt finished.");
    } catch (error) {
        console.error("Error seeding database: ", error);
    }
};


// --- Auth Context (Internal) ---
interface AuthContextTypeInternal {
    supabaseUser: SupabaseUser | null;
    demoUser: types.User | null;
    authLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    client: types.Client | null;
    clientLogin: (client: types.Client) => void;
    clientLogout: () => void;
    isAppLocked: boolean;
    setIsAppLocked: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextTypeInternal | undefined>(undefined);

const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = useState<T>(() => {
        try {
            const stickyValue = window.localStorage.getItem(key);
            return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    });
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, value]);
    return [value, setValue];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [demoUser, setDemoUser] = useState<types.User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [client, setClient] = useStickyState<types.Client | null>(null, 'pgs_client');
    const [isAppLocked, setIsAppLocked] = useStickyState(false, 'pgs_app_locked');

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setAuthLoading(false);
            return;
        }

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSupabaseUser(session?.user ?? null);
            if (session?.user) seedDatabase(); // Try seed on load
            setAuthLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);


    const login = async (email: string, password: string) => {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Check internal user table for role/archived status
            const { data: appUsers, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .limit(1);

            if (userError || !appUsers || appUsers.length === 0) {
                await supabase.auth.signOut();
                throw new Error("Votre compte n'est pas autorisé. Veuillez contacter l'administrateur.");
            }
            
            const appUser = appUsers[0];
            if (appUser.isArchived) {
                await supabase.auth.signOut();
                throw new Error('AUTH_USER_ARCHIVED');
            }
        } else {
            // Demo Mode Logic
            const foundUser = mock.mockUsers.find(
                u => u.email === email && u.password === password
            );

            if (foundUser) {
                if (foundUser.isArchived) {
                    throw new Error('AUTH_USER_ARCHIVED');
                }
                setDemoUser(foundUser);
            } else {
                throw new Error('auth/invalid-credential');
            }
        }
    };
    
    const signInWithGoogle = async () => {
         if (isSupabaseConfigured) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
            // Redirect happens automatically
        } else {
            throw new Error("Google Sign-In is not available in Demo Mode.");
        }
    };

    const logout = async () => {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        } else {
            setDemoUser(null);
        }
    };
    
    const clientLogin = (clientData: types.Client) => setClient(clientData);
    const clientLogout = () => setClient(null);

    const value = { supabaseUser, demoUser, authLoading, login, logout, signInWithGoogle, client, clientLogin, clientLogout, isAppLocked, setIsAppLocked };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Data Context ---
// Note: Interface kept same as before for compatibility
interface DataContextType {
    user: types.User | null;
    roles: types.RoleProfile[];
    users: types.User[];
    clients: types.Client[];
    students: types.Student[];
    paiements: types.Paiement[];
    formations: types.Formation[];
    formateurs: types.Formateur[];
    scheduleEntries: types.ScheduleEntry[];
    studioProjects: types.StudioProject[];
    studioServices: types.StudioService[];
    studioIntervenants: types.StudioIntervenant[];
    studioIntervenantPayments: types.StudioIntervenantPayment[];
    decorOrders: types.DecorOrder[];
    decorServices: types.DecorService[];
    shopOrders: types.ShopOrder[];
    articles: types.Article[];
    materiels: types.Materiel[];
    itemCategories: types.ItemCategory[];
    suppliers: types.Supplier[];
    purchaseOrders: types.PurchaseOrder[];
    transactions: types.Transaction[];
    stockMovements: types.StockMovement[];
    activityLog: types.ActivityLog[];
    clientNotes: types.ClientNote[];
    notifications: types.Notification[];
    employees: types.Employee[];
    payrolls: types.Payroll[];
    formateurPayments: types.FormateurPayment[];
    budgets: types.Budget[];
    wifizonePlans: types.WifizonePlan[];
    wifizoneSales: types.WifizoneSale[];
    wifizoneSettings: types.WifizoneSettings;
    cameras: types.Camera[];
    incidents: types.IncidentLog[];
    companyProfile: types.CompanyProfile;
    billingSettings: types.BillingSettings;
    
    setUsers: (updater: React.SetStateAction<types.User[]>) => Promise<void>;
    setRoles: (updater: React.SetStateAction<types.RoleProfile[]>) => Promise<void>;
    setClients: (updater: React.SetStateAction<types.Client[]>) => Promise<void>;
    setStudents: (updater: React.SetStateAction<types.Student[]>) => Promise<void>;
    setPaiements: (updater: React.SetStateAction<types.Paiement[]>) => Promise<void>;
    setFormations: (updater: React.SetStateAction<types.Formation[]>) => Promise<void>;
    setFormateurs: (updater: React.SetStateAction<types.Formateur[]>) => Promise<void>;
    setScheduleEntries: (updater: React.SetStateAction<types.ScheduleEntry[]>) => Promise<void>;
    setStudioProjects: (updater: React.SetStateAction<types.StudioProject[]>) => Promise<void>;
    setStudioServices: (updater: React.SetStateAction<types.StudioService[]>) => Promise<void>;
    setStudioIntervenants: (updater: React.SetStateAction<types.StudioIntervenant[]>) => Promise<void>;
    setStudioIntervenantPayments: (updater: React.SetStateAction<types.StudioIntervenantPayment[]>) => Promise<void>;
    setDecorOrders: (updater: React.SetStateAction<types.DecorOrder[]>) => Promise<void>;
    setDecorServices: (updater: React.SetStateAction<types.DecorService[]>) => Promise<void>;
    setShopOrders: (updater: React.SetStateAction<types.ShopOrder[]>) => Promise<void>;
    setArticles: (updater: React.SetStateAction<types.Article[]>) => Promise<void>;
    setMateriels: (updater: React.SetStateAction<types.Materiel[]>) => Promise<void>;
    setItemCategories: (updater: React.SetStateAction<types.ItemCategory[]>) => Promise<void>;
    setSuppliers: (updater: React.SetStateAction<types.Supplier[]>) => Promise<void>;
    setPurchaseOrders: (updater: React.SetStateAction<types.PurchaseOrder[]>) => Promise<void>;
    setTransactions: (updater: React.SetStateAction<types.Transaction[]>) => Promise<void>;
    setStockMovements: (updater: React.SetStateAction<types.StockMovement[]>) => Promise<void>;
    setActivityLog: (updater: React.SetStateAction<types.ActivityLog[]>) => Promise<void>;
    setClientNotes: (updater: React.SetStateAction<types.ClientNote[]>) => Promise<void>;
    setNotifications: (updater: React.SetStateAction<types.Notification[]>) => Promise<void>;
    setEmployees: (updater: React.SetStateAction<types.Employee[]>) => Promise<void>;
    setPayrolls: (updater: React.SetStateAction<types.Payroll[]>) => Promise<void>;
    setFormateurPayments: (updater: React.SetStateAction<types.FormateurPayment[]>) => Promise<void>;
    setBudgets: (updater: React.SetStateAction<types.Budget[]>) => Promise<void>;
    setWifizonePlans: (updater: React.SetStateAction<types.WifizonePlan[]>) => Promise<void>;
    setWifizoneSales: (updater: React.SetStateAction<types.WifizoneSale[]>) => Promise<void>;
    setWifizoneSettings: (updater: types.WifizoneSettings) => Promise<void>;
    setCameras: (updater: React.SetStateAction<types.Camera[]>) => Promise<void>;
    setIncidents: (updater: React.SetStateAction<types.IncidentLog[]>) => Promise<void>;
    setCompanyProfile: (updater: types.CompanyProfile) => Promise<void>;
    setBillingSettings: (updater: React.SetStateAction<types.BillingSettings>) => Promise<void>;

    addLogEntry: (action: string, details: string, entityType?: string, entityId?: string) => void;
    isDataStale: boolean;
    refreshData: () => void;
    loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper Hook for Supabase Tables
const useSupabaseTable = <T extends {id: string}>(tableName: string, mockData: T[]) => {
    const { supabaseUser } = useContext(AuthContext)!;
    const [data, setData] = useState<T[]>(mockData);
    const [loading, setLoading] = useState(false);
    
    // Initial fetch
    useEffect(() => {
        if (!isSupabaseConfigured || !supabaseUser) {
            setData(mockData);
            return;
        }
        
        const fetchData = async () => {
            setLoading(true);
            const { data: tableData, error } = await supabase.from(tableName).select('*');
            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                // Optionally fallback to mock or empty array
            } else {
                setData(tableData as T[]);
            }
            setLoading(false);
        };

        fetchData();

        // Optional: Set up realtime subscription here
        // const channel = supabase.channel('table_db_changes') ...
        
    }, [tableName, supabaseUser, mockData]);
    
    const setCollection = useCallback(async (updater: React.SetStateAction<T[]>) => {
        // Optimistic update for UI responsiveness
        const oldData = data;
        const newData = typeof updater === 'function' ? (updater as (prevState: T[]) => T[])(oldData) : updater;
        setData(newData);

        if (!isSupabaseConfigured) return;

        try {
            // Simple Diffing Strategy for Supabase (Upsert/Delete)
            // Note: In a real production app, you'd usually call specific add/update/delete methods 
            // rather than syncing the whole array state, but this adapts the existing app structure.
            
            const oldDataMap = new Map(oldData.map(item => [item.id, item]));
            const newDataMap = new Map(newData.map(item => [item.id, item]));

            // 1. Upsert (Insert or Update)
            const toUpsert: T[] = [];
            for (const newItem of newData) {
                const oldItem = oldDataMap.get(newItem.id);
                // Simple equality check (JSON stringify is poor man's deep equal)
                if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    toUpsert.push(newItem);
                }
            }

            // 2. Delete
            const toDeleteIds: string[] = [];
            for (const oldItem of oldData) {
                if (!newDataMap.has(oldItem.id)) {
                    toDeleteIds.push(oldItem.id);
                }
            }

            if (toUpsert.length > 0) {
                const { error } = await supabase.from(tableName).upsert(toUpsert);
                if(error) throw error;
            }

            if (toDeleteIds.length > 0) {
                const { error } = await supabase.from(tableName).delete().in('id', toDeleteIds);
                if(error) throw error;
            }

        } catch (error) {
            console.error(`Failed to sync ${tableName}`, error);
            setData(oldData); // Revert on error
        }

    }, [data, tableName]);


    return [data, setCollection] as const;
};

// Helper Hook for Single Documents (Settings)
const useSupabaseDoc = <T extends object>(tableName: string, docId: string, mockData: T) => {
    const { supabaseUser } = useContext(AuthContext)!;
    const [data, setData] = useState<T>(mockData);
    
    useEffect(() => {
        if (!isSupabaseConfigured || !supabaseUser) {
            setData(mockData);
            return;
        }
        
        const fetchDoc = async () => {
            // Assuming a table structure where id = docId for singleton rows like 'companyprofile'
            const { data: result, error } = await supabase.from(tableName).select('*').eq('id', docId).single();
            if (result) {
                 // Strip ID from result if T doesn't have it, or keep it
                 // For now assume result matches T structure roughly
                 const { id, ...rest } = result;
                 setData(rest as unknown as T); // Casting for flexibility
            }
        };
        fetchDoc();
    }, [tableName, docId, supabaseUser, mockData]);
    
    const setDocument = useCallback(async (updater: T | React.SetStateAction<T>) => {
        const newData = typeof updater === 'function' ? (updater as (prevState: T) => T)(data) : updater;
        setData(newData);

        if (!isSupabaseConfigured) return;
        
        // Upsert logic
        await supabase.from(tableName).upsert({ id: docId, ...newData });
    }, [tableName, docId, data]);

    return [data, setDocument] as const;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { supabaseUser, authLoading, demoUser } = useContext(AuthContext)!;
    const [user, setUser] = useState<types.User | null>(null);

    // Use the new Supabase hooks
    // Note: Table names in Supabase are usually lowercase.
    const [users, setUsers] = useSupabaseTable('users', mock.mockUsers);
    const [roles, setRoles] = useSupabaseTable('roles', mock.mockRoles);
    const [clients, setClients] = useSupabaseTable('clients', mock.mockClients);
    const [students, setStudents] = useSupabaseTable('students', mock.mockStudents);
    const [paiements, setPaiements] = useSupabaseTable('paiements', mock.mockPaiements);
    const [formations, setFormations] = useSupabaseTable('formations', mock.mockFormations);
    const [formateurs, setFormateurs] = useSupabaseTable('formateurs', mock.mockFormateurs);
    const [scheduleEntries, setScheduleEntries] = useSupabaseTable('schedule_entries', mock.mockScheduleEntries);
    const [studioProjects, setStudioProjects] = useSupabaseTable('studio_projects', mock.mockStudioProjects);
    const [studioServices, setStudioServices] = useSupabaseTable('studio_services', mock.mockStudioServices);
    const [studioIntervenants, setStudioIntervenants] = useSupabaseTable('studio_intervenants', mock.mockStudioIntervenants);
    const [studioIntervenantPayments, setStudioIntervenantPayments] = useSupabaseTable('studio_intervenant_payments', mock.mockStudioIntervenantPayments);
    const [decorOrders, setDecorOrders] = useSupabaseTable('decor_orders', mock.mockDecorOrders);
    const [decorServices, setDecorServices] = useSupabaseTable('decor_services', mock.mockDecorServices);
    const [shopOrders, setShopOrders] = useSupabaseTable('shop_orders', mock.mockShopOrders);
    const [articles, setArticles] = useSupabaseTable('articles', mock.mockArticles);
    const [materiels, setMateriels] = useSupabaseTable('materiels', mock.mockMateriels);
    const [itemCategories, setItemCategories] = useSupabaseTable('item_categories', mock.mockItemCategories);
    const [suppliers, setSuppliers] = useSupabaseTable('suppliers', mock.mockSuppliers);
    const [purchaseOrders, setPurchaseOrders] = useSupabaseTable('purchase_orders', mock.mockPurchaseOrders);
    const [transactions, setTransactions] = useSupabaseTable('transactions', mock.mockTransactions);
    const [stockMovements, setStockMovements] = useSupabaseTable('stock_movements', mock.mockStockMovements);
    const [activityLog, setActivityLog] = useSupabaseTable('activity_log', mock.mockActivityLog);
    const [clientNotes, setClientNotes] = useSupabaseTable('client_notes', mock.mockClientNotes);
    const [notifications, setNotifications] = useSupabaseTable('notifications', mock.mockNotifications);
    const [employees, setEmployees] = useSupabaseTable('employees', mock.mockEmployees);
    const [payrolls, setPayrolls] = useSupabaseTable('payrolls', mock.mockPayrolls);
    const [formateurPayments, setFormateurPayments] = useSupabaseTable('formateur_payments', mock.mockFormateurPayments);
    const [budgets, setBudgets] = useSupabaseTable('budgets', mock.mockBudgets);
    const [wifizonePlans, setWifizonePlans] = useSupabaseTable('wifizone_plans', mock.mockWifizonePlans);
    const [wifizoneSales, setWifizoneSales] = useSupabaseTable('wifizone_sales', mock.mockWifizoneSales);
    const [cameras, setCameras] = useSupabaseTable('cameras', mock.mockCameras);
    const [incidents, setIncidents] = useSupabaseTable('incidents', mock.mockIncidents);
    
    // Settings stored in a generic 'settings' table with an ID
    const [companyProfile, setCompanyProfile] = useSupabaseDoc('settings', 'companyprofile', mock.mockCompanyProfile);
    const [billingSettings, setBillingSettings] = useSupabaseDoc('settings', 'billingsettings', mock.mockBillingSettings);
    const [wifizoneSettings, setWifizoneSettings] = useSupabaseDoc('settings', 'wifizonesettings', mock.mockWifizoneSettings);
    
    useEffect(() => {
        if (!isSupabaseConfigured) {
            setUser(demoUser);
        } else {
            if (supabaseUser) {
                const appUser = users.find(u => u.email === supabaseUser.email);
                setUser(appUser || null);
            } else {
                setUser(null);
            }
        }
    }, [supabaseUser, users, demoUser]);

    const addLogEntry = useCallback(async (action: string, details: string, entityType?: string, entityId?: string) => {
        if (!user || !isSupabaseConfigured) return;
        
        const newLog: types.ActivityLog = {
            id: `log_${Date.now()}`,
            date: new Date().toISOString(),
            userId: user.id, action, details, entityType, entityId,
        };
        // Directly insert to Supabase to avoid state sync delay
        await supabase.from('activity_log').insert(newLog);
        // Also update local state
        setActivityLog(prev => [newLog, ...prev]);
    }, [user, setActivityLog]);

    const value = {
        user,
        authLoading,
        loading: authLoading, 
        isDataStale: false, 
        refreshData: () => {}, 
        addLogEntry,
        users, setUsers, roles, setRoles, clients, setClients, students, setStudents, paiements, setPaiements, formations, setFormations, formateurs, setFormateurs, scheduleEntries, setScheduleEntries, studioProjects, setStudioProjects, studioServices, setStudioServices, studioIntervenants, setStudioIntervenants, studioIntervenantPayments, setStudioIntervenantPayments, decorOrders, setDecorOrders, decorServices, setDecorServices, shopOrders, setShopOrders, articles, setArticles, materiels, setMateriels, itemCategories, setItemCategories, suppliers, setSuppliers, purchaseOrders, setPurchaseOrders, transactions, setTransactions, stockMovements, setStockMovements, activityLog, setActivityLog, clientNotes, setClientNotes, notifications, setNotifications, employees, setEmployees, payrolls, setPayrolls, formateurPayments, setFormateurPayments, budgets, setBudgets, wifizonePlans, setWifizonePlans, wifizoneSales, setWifizoneSales, wifizoneSettings, setWifizoneSettings, cameras, setCameras, incidents, setIncidents, companyProfile, setCompanyProfile, billingSettings, setBillingSettings,
    };

    return <DataContext.Provider value={value as DataContextType}>{children}</DataContext.Provider>;
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    const dataContext = useContext(DataContext);
    if (context === undefined || dataContext === undefined) {
        throw new Error('useAuth must be used within AuthProvider and DataProvider');
    }
    return { ...context, user: dataContext.user };
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const usePermissions = () => {
    const { user } = useAuth();
    const { roles } = useData();

    const hasPermission = useCallback((requiredPermission: types.Permission): boolean => {
        if (!user) return false;
        const userRole = roles.find(role => role.id === user.roleId);
        if (!userRole) return false;
        if (userRole.name === 'Admin') return true;
        return userRole.permissions.includes(requiredPermission);
    }, [user, roles]);
    
    return { hasPermission };
};
