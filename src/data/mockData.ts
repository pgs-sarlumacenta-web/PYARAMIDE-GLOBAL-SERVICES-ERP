import {
    User, RoleProfile, Permission, Client, Student, Paiement, Formation, Formateur, ScheduleEntry,
    StudioProject, StudioService, DecorOrder, DecorService, Article, ShopOrder,
    ItemCategory, Supplier, PurchaseOrder, Transaction, StockMovement, ActivityLog, CompanyProfile,
    BillingSettings, Employee, Payroll, Materiel, ClientNote, Notification, DecorOrderStatus, ShopOrderStatus, ExpenseCategory, FormateurPayment,
    StudioIntervenant, StudioIntervenantPayment, Budget, WifizonePlan, WifizoneSale, WifizoneSettings,
    Camera, IncidentLog
} from '../types';

// ROLES & PERMISSIONS
export const mockRoles: RoleProfile[] = [
  { id: 'R001', name: 'Admin', permissions: Object.values(Permission), isEditable: false },
  { id: 'R002', name: 'Manager', permissions: [Permission.VIEW_DASHBOARD_FINANCES, Permission.VIEW_CLIENTS, Permission.MANAGE_CLIENTS, Permission.VIEW_FINANCES, Permission.MANAGE_FINANCES, Permission.MANAGE_BUDGETS, Permission.VIEW_PERSONNEL, Permission.MANAGE_PERSONNEL, Permission.GENERATE_PAYROLL, Permission.VIEW_ACHATS, Permission.MANAGE_PURCHASE_ORDERS, Permission.MANAGE_SUPPLIERS, Permission.VIEW_ACADEMIE, Permission.MANAGE_ACADEMIE, Permission.VIEW_STUDIO, Permission.MANAGE_STUDIO, Permission.VIEW_DECOR, Permission.MANAGE_DECOR, Permission.VIEW_SHOP, Permission.MANAGE_SHOP_ORDERS, Permission.VIEW_WIFIZONE, Permission.MANAGE_WIFIZONE, Permission.VIEW_SECURITE, Permission.MANAGE_SECURITE, Permission.VIEW_INVENTAIRE, Permission.MANAGE_INVENTAIRE, Permission.VIEW_ACTIVITY_LOG, Permission.MANAGE_USERS_ROLES, Permission.MANAGE_SETTINGS], isEditable: true },
  { id: 'R003', name: 'Employé', permissions: [Permission.VIEW_CLIENTS, Permission.VIEW_ACADEMIE, Permission.VIEW_STUDIO, Permission.VIEW_DECOR, Permission.VIEW_SHOP, Permission.VIEW_WIFIZONE, Permission.VIEW_SECURITE, Permission.VIEW_INVENTAIRE], isEditable: true },
];

// USERS
export const mockUsers: User[] = [
  { id: 'U001', name: 'Don Paolo', email: 'donpaolo84@gmail.com', password: 'AdminPGS', roleId: 'R001', avatarUrl: 'https://robohash.org/U001.png', department: 'Admin' },
  { id: 'U002', name: 'Alice Manager', email: 'manager@pgs.com', password: 'password', roleId: 'R002', avatarUrl: 'https://robohash.org/U002.png', department: 'Admin' },
  { id: 'U003', name: 'Bob Employé', email: 'employee@pgs.com', password: 'password', roleId: 'R003', avatarUrl: 'https://robohash.org/U003.png', department: 'Studio', isArchived: true },
];

// CLIENTS
export const mockClients: Client[] = [
    { id: 'C001', name: 'Client A', email: 'clienta@email.com', phone: '111-222-3333', address: '123 Rue Principale' },
    { id: 'C002', name: 'Client B', email: 'clientb@email.com', phone: '444-555-6666', address: '456 Avenue Centrale', isArchived: true }
];

// ACADEMIE
export const mockFormations: Formation[] = [
    { id: 'F001', name: 'MAO - Production Musicale', filiere: 'Musique', coutEleve: 5000000, coutPro: 7500000, fraisInscription: 500000, duree: 6, statut: 'Actif' },
    { id: 'F002', name: 'Design Graphique', filiere: 'Design', coutEleve: 4000000, coutPro: 6000000, fraisInscription: 400000, duree: 4, statut: 'Actif' }
];

export const mockStudents: Student[] = [
    { id: 'S001', name: 'Etudiant Un', email: 'etudiant1@email.com', phone: '123-456-7890', address: '789 Rue des Etudiants', formationId: 'F001', registrationDate: '2023-09-01', statut: 'Terminé', avatarUrl: 'https://robohash.org/S001.png', tarif: 'eleve' },
    { id: 'S002', name: 'Etudiante Deux', email: 'etudiante2@email.com', phone: '098-765-4321', address: '101 Boulevard des Apprenants', formationId: 'F002', registrationDate: '2023-10-15', statut: 'Actif', avatarUrl: 'https://robohash.org/S002.png', tarif: 'professionnel' }
];

export const mockPaiements: Paiement[] = [
    { id: 'P001', studentId: 'S001', amount: 500000, date: '2023-09-01', objet: 'Inscription', receiptRef: 'REC-ACA-1001' },
    { id: 'P002', studentId: 'S001', amount: 2500000, date: '2023-09-15', objet: 'Tranche 1', receiptRef: 'REC-ACA-1002' }
];

export const mockFormateurs: Formateur[] = [
    { id: 'T001', name: 'Professeur Musique', speciality: 'MAO', phone: '111-111-1111', email: 'prof.music@email.com', address: 'Addr 1', iban: 'GN...T001', tarifHoraire: 250000, avatarUrl: 'https://robohash.org/T001.png' },
    { id: 'T002', name: 'Professeur Design', speciality: 'Suite Adobe', phone: '222-222-2222', email: 'prof.design@email.com', address: 'Addr 2', iban: 'GN...T002', tarifHoraire: 200000, avatarUrl: 'https://robohash.org/T002.png' }
];

export const mockScheduleEntries: ScheduleEntry[] = [
    { id: 'SE001', title: 'Cours de Beatmaking', dayOfWeek: 'Lundi', startTime: '10:00', endTime: '12:00', salle: 'Studio A', formationId: 'F001', formateurId: 'T001' }
];

// STUDIO
export const mockStudioServices: StudioService[] = [
    { id: 'SS001', name: 'Enregistrement Voix', type: 'Audio', tarif: 500000, statut: 'Actif' },
    { id: 'SS002', name: 'Mixage & Mastering', type: 'Audio', tarif: 1500000, statut: 'Actif' }
];

export const mockStudioIntervenants: StudioIntervenant[] = [
    { id: 'SI001', name: 'IngéSon Pro', speciality: 'Mixage/Mastering', phone: '333-333-3333', email: 'ingeson@email.com', iban: 'GN...SI001', avatarUrl: 'https://robohash.org/SI001.png' },
    { id: 'SI002', name: 'Beatmaker X', speciality: 'Composition', phone: '444-444-4444', email: 'beatmaker@email.com', iban: 'GN...SI002', avatarUrl: 'https://robohash.org/SI002.png' }
];

export const mockStudioProjects: StudioProject[] = [
    { 
        id: 'SP001', 
        projectName: 'Single Artiste X', 
        projectType: 'Single', 
        status: 'En cours', 
        startDate: '2023-11-01', 
        endDate: '2023-11-30', 
        serviceIds: ['SS001', 'SS002'], 
        discount: 0, 
        amountPaid: 2000000, 
        clientId: 'C001',
        technicianId: 'U003',
        devisRef: 'DEV-STU-101', 
        factureRef: 'FAC-STU-101', 
        contratRef: 'CON-STU-101',
        intervenants: [
            { intervenantId: 'SI001', description: 'Mixage du titre', remuneration: { type: 'forfait', amount: 500000 }, status: 'En attente' },
            { intervenantId: 'SI002', description: 'Composition instrumentale', remuneration: { type: 'pourcentage', value: 15 }, status: 'En attente' }
        ]
    },
    { 
        id: 'SP002', 
        projectName: 'EP Artiste Y', 
        projectType: 'EP', 
        status: 'Planifié', 
        startDate: '2024-01-10', 
        endDate: '2024-03-10', 
        serviceIds: ['SS002'], 
        discount: 100000, 
        amountPaid: 700000, 
        clientId: 'C002',
        technicianId: 'U003',
        isArchived: true,
        intervenants: [
            { intervenantId: 'SI001', description: 'Mastering de l\'EP', remuneration: { type: 'pourcentage', value: 20 }, status: 'En attente' }
        ]
    }
];

export const mockStudioIntervenantPayments: StudioIntervenantPayment[] = [];


// DECOR
export const mockDecorServices: DecorService[] = [
    { id: 'DS001', name: 'Décoration Scénique', price: 2000000, description: 'Décoration pour concert', articles: [{ articleId: 'CON001', quantity: 10 }] },
];

export const mockDecorOrders: DecorOrder[] = [
    { id: 'DO001', description: 'Décor Concert Y', clientId: 'C002', orderDate: '2023-11-05', deliveryDate: '2023-12-01', items: [{ serviceId: 'DS001', quantity: 1 }], subTotal: 2000000, discount: 0, totalAmount: 2000000, amountPaid: 1000000, status: 'Confirmé', devisRef: 'DEV-DEC-201', proformaRef: 'PRO-DEC-201', factureRef: 'FAC-DEC-201' }
];

// WIFIZONE
export const mockWifizonePlans: WifizonePlan[] = [
    { id: 'WZP-001', name: 'Pass 1 Heure', duration: 1, price: 5000 },
    { id: 'WZP-002', name: 'Pass Journée', duration: 24, price: 25000 },
    { id: 'WZP-003', name: 'Pass Semaine', duration: 168, price: 100000 },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

const getDateForMonth = (monthOffset: number, day: number = 15) => {
    return new Date(currentYear, currentMonth - monthOffset, day).toISOString().split('T')[0];
};

export const mockWifizoneSales: WifizoneSale[] = [
    { id: 'WZS-001', planId: 'WZP-002', saleDate: getDateForMonth(0, 5), voucherCode: 'WZ-8A9B-2C', totalAmount: 25000, receiptRef: 'REC-WIFI-001', clientId: 'C001' },
    { id: 'WZS-002', planId: 'WZP-001', saleDate: getDateForMonth(0, 6), voucherCode: 'WZ-1D2E-3F', totalAmount: 5000, receiptRef: 'REC-WIFI-002' },
    { id: 'WZS-003', planId: 'WZP-003', saleDate: getDateForMonth(1, 12), voucherCode: 'WZ-4G5H-6I', totalAmount: 100000, receiptRef: 'REC-WIFI-003' },
];

export const mockWifizoneSettings: WifizoneSettings = {
    monthlyCost: 650000, // Example cost for Starlink
};

// SECURITE
export const mockCameras: Camera[] = [
    { id: 'CAM001', name: 'Entrée Principale', serialNumber: 'SN-CAM-001', categoryId: 'CAT006', purchaseDate: '2024-01-01', purchasePrice: 2500000, ipAddress: '192.168.1.10', location: 'Façade', status: 'En service' },
    { id: 'CAM002', name: 'Couloir Studio', serialNumber: 'SN-CAM-002', categoryId: 'CAT006', purchaseDate: '2024-01-01', purchasePrice: 2500000, ipAddress: '192.168.1.11', location: 'Intérieur - Studio', status: 'Hors service' },
];

export const mockIncidents: IncidentLog[] = [
    { id: 'INC001', dateTime: new Date().toISOString(), cameraIds: ['CAM002'], description: "La caméra est hors ligne depuis 1 heure.", severity: 'Moyenne', status: 'Ouvert', reportedById: 'U001' }
];

// INVENTAIRE
export const mockItemCategories: ItemCategory[] = [
    { id: 'CAT001', name: 'Instruments' },
    { id: 'CAT002', name: 'Matériel Studio' },
    { id: 'CAT003', name: 'Textiles & Tissus' },
    { id: 'CAT004', name: 'Lumières & Éclairage' },
    { id: 'CAT005', name: 'Alimentaire' },
    { id: 'CAT006', name: 'Surveillance' },
];

export const mockSuppliers: Supplier[] = [
    { id: 'SUP001', name: 'Fournisseur Matos', contact: 'M. Dupont', email: 'contact@fournisseur.com', address: 'Zone Industrielle' }
];

const oneMonthFromNow = new Date();
oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 15);

export const mockArticles: Article[] = [
  { 
    id: 'PROD001', name: 'Microphone Pro', categoryId: 'CAT002', sellingPrice: 2500000, purchasePrice: 1800000, stock: 10, alertThreshold: 2, supplierId: 'SUP001', imageUrl: 'https://via.placeholder.com/150/10b981/FFFFFF?text=MIC', specifications: [{key: 'Type', value: 'Condensateur'}],
    isSellable: true,
    isConsumable: false,
  },
  {
    id: 'CON001', name: 'Tissu Scénique (m)', supplierId: 'SUP001', stock: 100, purchasePrice: 50000, alertThreshold: 10, categoryId: 'CAT003',
    isSellable: false,
    isConsumable: true,
    consumptionUnit: 'm',
  },
  {
    id: 'BOTH001', name: 'Guirlande LED (m)', categoryId: 'CAT004', supplierId: 'SUP001', stock: 200, purchasePrice: 20000, alertThreshold: 20,
    isSellable: true,
    sellingPrice: 45000,
    isConsumable: true,
    consumptionUnit: 'm',
    imageUrl: 'https://via.placeholder.com/150/FBBF24/FFFFFF?text=LED',
  },
  {
    id: 'FOOD001', name: 'Barre Énergétique', categoryId: 'CAT005', supplierId: 'SUP001', stock: 50, purchasePrice: 10000, alertThreshold: 10,
    isSellable: true,
    sellingPrice: 20000,
    isConsumable: true,
    datePeremption: oneMonthFromNow.toISOString().split('T')[0], // Expires soon
  },
  {
    id: 'FOOD002', name: 'Bouteille d\'eau', categoryId: 'CAT005', supplierId: 'SUP001', stock: 100, purchasePrice: 2000, alertThreshold: 20,
    isSellable: true,
    sellingPrice: 5000,
    isConsumable: true,
    datePeremption: '2023-12-31', // Expired
  }
];

export const mockShopOrders: ShopOrder[] = [
    { id: 'SHO001', orderDate: '2023-11-10', clientId: 'C001', items: [{ articleId: 'PROD001', quantity: 1, unitPrice: 2500000 }], subTotal: 2500000, totalAmount: 2500000, amountPaid: 2500000, status: 'Payé', stockDeducted: true, devisRef: 'DEV-SHO-301', proformaRef: 'PRO-SHO-301', factureRef: 'FAC-SHO-301', bonLivraisonRef: 'BL-SHO-301' }
];

// ACHATS
export const mockPurchaseOrders: PurchaseOrder[] = [
    { id: 'PO001', supplierId: 'SUP001', orderDate: '2023-10-20', items: [{ articleId: 'PROD001', quantity: 5, purchasePrice: 1800000 }], totalAmount: 9000000, status: 'Reçu' }
];

// FINANCES
export const mockTransactions: Transaction[] = [
    { id: 'T001', date: '2023-09-01', department: 'Académie', description: 'Inscription Etudiant Un', amount: 500000, type: 'Revenu' },
    { id: 'T002', date: '2023-11-10', department: 'Général', description: 'Loyer Novembre', amount: -2000000, type: 'Dépense', category: 'Loyer' },
    
    // Recent data for forecasting and trends
    // 6 months ago
    { id: 'T2406a', date: getDateForMonth(6, 8), department: 'Académie', description: 'Inscriptions formations', amount: 8500000, type: 'Revenu' },
    { id: 'T2406b', date: getDateForMonth(6, 25), department: 'Achats', description: 'Achat matériel Décor', amount: -4500000, type: 'Dépense', category: 'Achats Matières Premières' },
    // 5 months ago
    { id: 'T2405a', date: getDateForMonth(5, 12), department: 'Studio', description: 'Paiement final projet EP', amount: 10000000, type: 'Revenu' },
    { id: 'T2405b', date: getDateForMonth(5, 28), department: 'Général', description: 'Salaires et honoraires', amount: -4000000, type: 'Dépense', category: 'Salaires' },
    // 4 months ago
    { id: 'T2404a', date: getDateForMonth(4, 18), department: 'Shop', description: 'Ventes du mois', amount: 6000000, type: 'Revenu' },
    { id: 'T2404b', date: getDateForMonth(4, 22), department: 'Général', description: 'Campagne Marketing', amount: -5000000, type: 'Dépense', category: 'Marketing' },
    // 3 months ago
    { id: 'T2403a', date: getDateForMonth(3, 5), department: 'Académie', description: 'Paiements scolarité', amount: 9000000, type: 'Revenu' },
    { id: 'T2403b', date: getDateForMonth(3, 25), department: 'Général', description: 'Loyer et charges', amount: -3500000, type: 'Dépense', category: 'Loyer' },
    // 2 months ago
    { id: 'T2402a', date: getDateForMonth(2, 10), department: 'Décor', description: 'Acompte Décor Concert', amount: 7000000, type: 'Revenu' },
    { id: 'T2402b', date: getDateForMonth(2, 20), department: 'Achats', description: 'Achat éclairage', amount: -4000000, type: 'Dépense', category: 'Achats Matières Premières' },
    // Last month
    { id: 'T2401a', date: getDateForMonth(1, 15), department: 'Studio', description: 'Paiement projet Artiste Z', amount: 8000000, type: 'Revenu' },
    { id: 'T2401b', date: getDateForMonth(1, 25), department: 'Général', description: 'Salaires', amount: -3000000, type: 'Dépense', category: 'Salaires' },
    { id: 'T2401c', date: getDateForMonth(1, 12), department: 'Wifizone', description: 'Ventes Pass Semaine', amount: 100000, type: 'Revenu' },

    // Current month
    { id: 'T2407a', date: getDateForMonth(0, 5), department: 'Shop', description: 'Premières ventes du mois', amount: 2500000, type: 'Revenu' },
    { id: 'T2407b', date: getDateForMonth(0, 10), department: 'Général', description: 'Facture électricité', amount: -1000000, type: 'Dépense', category: 'Services Publics' },
    // Wifizone Revenue for current month to show in Dashboard
    { id: 'T2407c', date: getDateForMonth(0, 5), department: 'Wifizone', description: 'Vente forfait: Pass Journée', amount: 25000, type: 'Revenu' },
    { id: 'T2407d', date: getDateForMonth(0, 6), department: 'Wifizone', description: 'Vente forfait: Pass 1 Heure', amount: 5000, type: 'Revenu' },
];


export const mockBudgets: Budget[] = [
    { id: 'B001', year: new Date().getFullYear(), month: new Date().getMonth() + 1, scope: 'department', scopeId: 'Studio', amount: 1500000, isArchived: false },
    { id: 'B002', year: new Date().getFullYear(), month: new Date().getMonth() + 1, scope: 'department', scopeId: 'Décor', amount: 2000000, isArchived: false },
    { id: 'B003', year: new Date().getFullYear(), month: new Date().getMonth() + 1, scope: 'category', scopeId: 'Marketing', amount: 500000, isArchived: false },
    { id: 'B004', year: new Date().getFullYear(), month: new Date().getMonth(), scope: 'department', scopeId: 'Studio', amount: 1200000, isArchived: false }, // Last month for testing filters
];

export const mockFormateurPayments: FormateurPayment[] = [];

// INVENTAIRE
export const mockStockMovements: StockMovement[] = [
    { id: 'SM001', date: '2023-10-20', itemId: 'PROD001', itemType: 'article', type: 'IN', quantity: 5, reason: 'Achat #PO001' }
];

export const mockMateriels: Materiel[] = [
    { id: 'MAT001', name: 'Console de Mixage Pro', categoryId: 'CAT002', status: 'En service', purchaseDate: '2023-01-15', purchasePrice: 15000000 },
    ...mockCameras,
];


// GENERAL
export const mockActivityLog: ActivityLog[] = [
    { id: 'LOG001', date: '2023-11-10', userId: 'U002', action: 'Création', details: 'A créé la commande #SHO001' }
];

export const mockClientNotes: ClientNote[] = [
    { id: 'NOTE001', clientId: 'C001', userId: 'U002', date: '2023-11-02', note: 'Appel concernant le projet. Client satisfait.' }
];

export const mockNotifications: Notification[] = [
    { id: 'NOTIF001', date: '2023-11-11', message: 'Stock bas pour Microphone Pro', type: 'alert', read: false }
];

// PERSONNEL
export const mockEmployees: Employee[] = [
    { id: 'E001', name: 'Employé Studio', role: 'Ingénieur Son', department: 'Studio', salary: 3000000, avatarUrl: 'https://robohash.org/E001.png', hireDate: '2023-01-01', iban: 'GN...123', phone: '111-111' }
];

export const mockPayrolls: Payroll[] = [
    { id: 'PAY001', employeeId: 'E001', period: 'octobre 2023', grossSalary: 3000000, deductions: 300000, netSalary: 2700000, paymentDate: '2023-10-31', status: 'Payé' }
];

// SETTINGS
export const mockCompanyProfile: CompanyProfile = {
    nom: 'PGS-SARLU',
    adresse: 'Hamdallaye, Conakry, Guinée',
    telephone: '+224 620 00 00 00',
    email: 'contact@pgs-sarlu.com',
    logoUrl: 'https://i.imgur.com/8z21V3G.png', // Placeholder URL
    nif: '123456789',
    rccm: 'GN.CKR.2023.A.12345'
};

export const mockBillingSettings: BillingSettings = {
    quotePrefix: 'DEV-',
    quoteNextNumber: 102,
    proformaPrefix: 'PRO-',
    proformaNextNumber: 202,
    invoicePrefix: 'FAC-',
    invoiceNextNumber: 102,
    receiptPrefix: 'REC-',
    receiptNextNumber: 1003,
    contratPrefix: 'CON-',
    contratNextNumber: 102,
    deliveryNotePrefix: 'BL-',
    deliveryNoteNextNumber: 302,
    statementPrefix: 'ETAT-PREST-',
    statementNextNumber: 1,
    defaultFooter: 'Veuillez effectuer le paiement sur le compte Orange Money : +224 620 00 00 00.\nMerci de votre confiance.'
};