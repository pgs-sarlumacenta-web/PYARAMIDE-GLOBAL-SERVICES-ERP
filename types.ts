// FIX: Removed circular self-import which caused multiple declaration conflicts.

// ROLES & PERMISSIONS
export enum Permission {
    // Dashboard
    VIEW_DASHBOARD_FINANCES = 'VIEW_DASHBOARD_FINANCES',

    // Academie
    VIEW_ACADEMIE = 'VIEW_ACADEMIE',
    MANAGE_ACADEMIE = 'MANAGE_ACADEMIE',
    
    // Studio
    VIEW_STUDIO = 'VIEW_STUDIO',
    MANAGE_STUDIO = 'MANAGE_STUDIO',

    // Decor
    VIEW_DECOR = 'VIEW_DECOR',
    MANAGE_DECOR = 'MANAGE_DECOR',

    // Shop
    VIEW_SHOP = 'VIEW_SHOP',
    MANAGE_SHOP_ORDERS = 'MANAGE_SHOP_ORDERS',

    // Wifizone
    VIEW_WIFIZONE = 'VIEW_WIFIZONE',
    MANAGE_WIFIZONE = 'MANAGE_WIFIZONE',
    
    // Securite
    VIEW_SECURITE = 'VIEW_SECURITE',
    MANAGE_SECURITE = 'MANAGE_SECURITE',

    // Achats
    VIEW_ACHATS = 'VIEW_ACHATS',
    MANAGE_PURCHASE_ORDERS = 'MANAGE_PURCHASE_ORDERS',
    MANAGE_SUPPLIERS = 'MANAGE_SUPPLIERS',
    
    // Finances
    VIEW_FINANCES = 'VIEW_FINANCES',
    MANAGE_FINANCES = 'MANAGE_FINANCES',
    MANAGE_BUDGETS = 'MANAGE_BUDGETS',

    // Personnel
    VIEW_PERSONNEL = 'VIEW_PERSONNEL',
    MANAGE_PERSONNEL = 'MANAGE_PERSONNEL',
    GENERATE_PAYROLL = 'GENERATE_PAYROLL',

    // Clients
    VIEW_CLIENTS = 'VIEW_CLIENTS',
    MANAGE_CLIENTS = 'MANAGE_CLIENTS',

    // Inventaire & Stock
    VIEW_INVENTAIRE = 'VIEW_INVENTAIRE',
    MANAGE_INVENTAIRE = 'MANAGE_INVENTAIRE',

    // Settings & Logs
    VIEW_ACTIVITY_LOG = 'VIEW_ACTIVITY_LOG',
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',
    MANAGE_USERS_ROLES = 'MANAGE_USERS_ROLES',
}

export interface RoleProfile {
    id: string;
    name: string;
    permissions: Permission[];
    isEditable: boolean;
}

// USERS
export interface User extends Archivable {
    id: string;
    name: string;
    email: string;
    password?: string;
    roleId: string;
    avatarUrl?: string;
    department: 'Admin' | 'Studio' | 'Académie' | 'Décor' | 'Shop' | 'Finances' | 'Achats';
}

// CLIENTS
export interface Client extends Archivable {
    id: string;
    name: string;
    company?: string;
    email: string;
    phone: string;
    address: string;
}

// ACADEMIE
export interface Formation extends Archivable {
    id: string;
    name: string;
    filiere: 'Musique' | 'Design' | 'Textile' | 'Autre';
    coutEleve: number;
    coutPro: number;
    fraisInscription: number;
    duree: number; // in months
    statut: 'Actif' | 'Inactif';
}

export interface Student extends Archivable {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    formationId: string;
    registrationDate: string; // ISO date string
    statut: 'Actif' | 'En pause' | 'Terminé' | 'Annulé';
    avatarUrl?: string;
    tarif: 'eleve' | 'professionnel';
}

export interface Paiement extends Archivable {
    id: string;
    studentId: string;
    amount: number;
    date: string; // ISO date string
    objet: 'Inscription' | 'Tranche 1' | 'Tranche 2' | 'Solde';
    receiptRef: string;
}

export interface Formateur extends Archivable {
    id: string;
    name: string;
    speciality: string;
    phone: string;
    email: string;
    address: string;
    iban: string;
    tarifHoraire: number;
    avatarUrl?: string;
}

export interface ScheduleEntry extends Archivable {
    id: string;
    title: string;
    dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    salle: string;
    formationId: string;
    formateurId: string;
}

// STUDIO
export type StudioProjectStatus = 'Planifié' | 'En cours' | 'Mixage' | 'Terminé' | 'Livré';

export interface StudioService extends Archivable {
    id: string;
    name: string;
    type: 'Audio' | 'Vidéo' | 'Graphisme' | 'Autre';
    tarif: number;
    statut: 'Actif' | 'Inactif';
}

export interface StudioIntervenant extends Archivable {
    id: string;
    name: string;
    speciality: string;
    phone: string;
    email: string;
    iban: string;
    avatarUrl?: string;
}

export type Remuneration = 
    | { type: 'forfait'; amount: number }
    | { type: 'pourcentage'; value: number }; // Percentage value, e.g. 10 for 10%

export interface StudioProjectIntervenant {
    intervenantId: string;
    description: string;
    remuneration: Remuneration;
    status: 'En attente' | 'Payé';
    paymentId?: string;
}

export interface StudioProject extends Archivable {
    id: string;
    projectName: string;
    projectType: 'Single' | 'EP' | 'Album';
    status: StudioProjectStatus;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    serviceIds: string[];
    discount: number;
    amountPaid: number;
    clientId: string;
    technicianId?: string; // User ID of the technician assigned
    intervenants?: StudioProjectIntervenant[];
    devisRef?: string;
    factureRef?: string;
    contratRef?: string;
    receipts?: { amount: number; date: string; ref: string }[];
}

export interface StudioIntervenantPayment extends Archivable {
    id: string;
    intervenantId: string;
    periodDescription: string;
    amount: number;
    paymentDate: string; // ISO date string
    interventions: { projectId: string; description: string; amount: number }[];
    transactionId: string;
    statementRef: string;
}


// DECOR
export type DecorOrderStatus = 'Devis' | 'Confirmé' | 'En cours' | 'Terminé' | 'Livré' | 'Annulé' | 'Payé';

export interface DecorServiceArticle {
    articleId: string;
    quantity: number;
}

export interface DecorService extends Archivable {
    id: string;
    name: string;
    price: number;
    description: string;
    articles: DecorServiceArticle[];
}

export interface DecorServiceOrderItem {
    serviceId: string;
    quantity: number;
}

export interface DecorOrder extends Archivable {
    id: string;
    description: string;
    customDetails?: string;
    clientId: string;
    orderDate: string; // ISO date string
    deliveryDate: string; // ISO date string
    items: DecorServiceOrderItem[];
    subTotal: number;
    discount: number;
    totalAmount: number;
    amountPaid: number;
    status: DecorOrderStatus;
    devisRef?: string;
    proformaRef?: string;
    factureRef?: string;
    bonRef?: string;
    receipts?: { amount: number; date: string; ref: string }[];
}

// SHOP
export type ShopOrderStatus = 'Devis' | 'Confirmé' | 'Payé' | 'Livré' | 'Annulé';
export interface ShopOrderItem {
    articleId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface ShopOrder extends Archivable {
    id: string;
    orderDate: string; // ISO date string
    clientId?: string; // Optional for comptoir sales
    items: ShopOrderItem[];
    subTotal: number;
    totalAmount: number;
    amountPaid: number;
    status: ShopOrderStatus;
    stockDeducted: boolean;
    devisRef?: string;
    proformaRef?: string;
    factureRef?: string;
    bonLivraisonRef?: string;
    receipts?: { amount: number; date: string; ref: string }[];
}


// WIFIZONE
export interface WifizonePlan extends Archivable {
    id: string;
    name: string;
    duration: number; // in hours
    price: number;
}

export interface WifizoneSale extends Archivable {
    id: string;
    planId: string;
    clientId?: string;
    saleDate: string; // ISO date string
    voucherCode: string;
    totalAmount: number;
    receiptRef: string;
}

export interface WifizoneSettings {
    monthlyCost: number;
}


// SECURITE
export interface Camera extends Materiel {
    ipAddress: string;
    location: string;
}

export interface IncidentLog extends Archivable {
    id: string;
    dateTime: string; // ISO date string
    cameraIds: string[];
    description: string;
    severity: 'Faible' | 'Moyenne' | 'Élevée';
    status: 'Ouvert' | 'En cours de révision' | 'Résolu';
    reportedById: string; // User ID
}


// INVENTAIRE
export interface ItemCategory extends Archivable {
    id: string;
    name: string;
}

export interface ArticleSpecification {
    key: string;
    value: string;
}

export interface Article extends Archivable {
    id: string;
    name: string;
    categoryId: string;
    supplierId?: string;
    stock: number;
    alertThreshold: number;
    purchasePrice: number;
    
    isSellable: boolean;
    sellingPrice?: number;
    
    isConsumable: boolean;
    consumptionUnit?: string;

    imageUrl?: string;
    specifications?: ArticleSpecification[];
    datePeremption?: string; // YYYY-MM-DD
}

export interface Materiel extends Archivable {
    id: string;
    name: string;
    serialNumber?: string;
    categoryId: string;
    status: 'En service' | 'En maintenance' | 'Hors service' | 'Stocké';
    purchaseDate: string;
    purchasePrice: number;
    assignedTo?: string; // Employee ID
}

export interface StockMovement {
    id: string;
    date: string;
    itemId: string;
    itemType: 'article' | 'materiel';
    type: 'IN' | 'OUT';
    quantity: number;
    reason: string;
}


// ACHATS
export interface Supplier extends Archivable {
    id: string;
    name: string;
    contact: string;
    email: string;
    address: string;
}
export interface PurchaseOrderItem {
    articleId: string;
    quantity: number;
    purchasePrice: number;
}
export interface PurchaseOrder extends Archivable {
    id: string;
    supplierId: string;
    orderDate: string;
    receptionDate?: string;
    items: PurchaseOrderItem[];
    totalAmount: number;
    status: 'Brouillon' | 'Commandé' | 'Reçu' | 'Annulé';
}


// FINANCES
export type ExpenseCategory = 'Salaires' | 'Loyer' | 'Fournitures' | 'Marketing' | 'Services Publics' | 'Achats Matières Premières' | 'Honoraires' | 'Autre';
export type Department = 'Général' | 'Académie' | 'Studio' | 'Décor' | 'Shop' | 'Wifizone' | 'Sécurité' | 'Achats';

export interface Transaction extends Archivable {
    id: string;
    date: string;
    department: Department;
    description: string;
    amount: number;
    type: 'Revenu' | 'Dépense';
    category?: ExpenseCategory;
}

export interface Budget extends Archivable {
    id: string;
    year: number;
    month: number; // 1-12
    scope: 'department' | 'category';
    scopeId: Department | ExpenseCategory;
    amount: number;
}

export interface FormateurPayment extends Archivable {
    id: string;
    formateurId: string;
    periodDescription: string;
    amount: number;
    paymentDate: string;
    scheduleEntryIds: string[];
    transactionId: string;
    statementRef: string;
}

// PERSONNEL
export interface Employee extends Archivable {
    id: string;
    name: string;
    role: string;
    department: 'Admin' | 'Studio' | 'Académie' | 'Décor' | 'Shop' | 'Finances' | 'Achats';
    salary: number;
    avatarUrl?: string;
    hireDate: string;
    iban: string;
    phone: string;
}

export interface Payroll extends Archivable {
    id: string;
    employeeId: string;
    period: string; // e.g., "octobre 2023"
    grossSalary: number;
    deductions: number;
    netSalary: number;
    paymentDate: string;
    status: 'En attente' | 'Payé';
}

// GENERAL
export interface ActivityLog {
    id: string;
    date: string;
    userId: string;
    action: string;
    details: string;
    entityType?: string;
    entityId?: string;
}

export interface ClientNote {
    id: string;
    clientId: string;
    userId: string;
    date: string;
    note: string;
}

export interface Notification {
    id: string;
    date: string;
    message: string;
    type: 'alert' | 'info';
    read: boolean;
}


// SETTINGS
export interface CompanyProfile {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    logoUrl: string;
    nif: string;
    rccm: string;
}

export interface BillingSettings {
    quotePrefix: string;
    quoteNextNumber: number;
    proformaPrefix: string;
    proformaNextNumber: number;
    invoicePrefix: string;
    invoiceNextNumber: number;
    receiptPrefix: string;
    receiptNextNumber: number;
    contratPrefix: string;
    contratNextNumber: number;
    deliveryNotePrefix: string;
    deliveryNoteNextNumber: number;
    statementPrefix: string;
    statementNextNumber: number;
    defaultFooter: string;
}

// A base interface for items that can be archived
export interface Archivable {
    isArchived?: boolean;
}