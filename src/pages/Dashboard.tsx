
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useData } from '../context/DataContext.tsx';
import { BanknotesIcon, BellAlertIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BriefcaseIcon, ClockIcon, AcademicCapIcon, UserPlusIcon, ExclamationTriangleIcon, ShoppingCartIcon, SwatchIcon, CubeTransparentIcon, ListBulletIcon, WifiIcon } from '@heroicons/react/24/outline';
import { ComposedChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart } from 'recharts';
import Modal from '../components/Modal.tsx';
import { Transaction, StudioProject, DecorOrder, ShopOrder, Paiement, Formation } from '../types.ts';

// --- ACTION CENTER (Formerly MyWorkspace) ---

// Define a type for the generated action items
type ActionItem = {
    id: string;
    icon: React.ElementType;
    iconColor: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    link: string;
    state?: { selectedId: string; type?: string; };
};

const ActionCenter: React.FC = () => {
    const { user } = useAuth();
    const { studioProjects, articles, students, paiements, formations, purchaseOrders, decorOrders, shopOrders } = useData();
    const navigate = useNavigate();

    // The new "Task Engine" logic resides here. It's purely read-only.
    const actionItems = useMemo((): ActionItem[] => {
        if (!user) return [];
        const items: ActionItem[] = [];
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 1. Low stock alerts
        articles.forEach(article => {
            if (!article.isArchived && article.stock <= article.alertThreshold) {
                items.push({
                    id: `stock-${article.id}`,
                    icon: ExclamationTriangleIcon,
                    iconColor: 'text-red-500',
                    title: 'Stock Faible',
                    description: `${article.name} (reste ${article.stock})`,
                    priority: 'high',
                    link: '/inventaire',
                    state: { selectedId: article.id }
                });
            }
        });

        // 2. Expiration alerts
        articles.forEach(article => {
            if (!article.isArchived && article.datePeremption) {
                const expirationDate = new Date(article.datePeremption);
                if (expirationDate <= thirtyDaysFromNow) {
                     items.push({
                        id: `peremption-${article.id}`,
                        icon: ClockIcon,
                        iconColor: 'text-orange-500',
                        title: 'Péremption Proche',
                        description: `${article.name} (expire le ${expirationDate.toLocaleDateString()})`,
                        priority: 'high',
                        link: '/inventaire',
                        state: { selectedId: article.id }
                    });
                }
            }
        });

        // 3. Studio projects due soon
        studioProjects.forEach(p => {
            const endDate = new Date(p.endDate);
            if (!p.isArchived && endDate <= oneWeekFromNow && endDate >= now && !['Livré', 'Terminé'].includes(p.status)) {
                items.push({
                    id: `studio-due-${p.id}`,
                    icon: BriefcaseIcon,
                    iconColor: 'text-studio-red',
                    title: 'Projet Studio à Terminer',
                    description: `${p.projectName} (échéance le ${endDate.toLocaleDateString()})`,
                    priority: 'medium',
                    link: '/studio',
                    state: { selectedId: p.id, type: 'project' }
                });
            }
        });

        // 4. Students with overdue payments
        students.forEach(s => {
            const formation = formations.find(f => f.id === s.formationId);
            if(formation && !s.isArchived) {
                const totalPaid = paiements.filter(p => p.studentId === s.id && !p.isArchived).reduce((sum, p) => sum + p.amount, 0);
                const cost = s.tarif === 'eleve' ? formation.coutEleve : formation.coutPro;
                const totalCost = cost + formation.fraisInscription;
                if (totalPaid < totalCost) {
                    items.push({
                        id: `academie-due-${s.id}`,
                        icon: AcademicCapIcon,
                        iconColor: 'text-academie-blue',
                        title: 'Paiement Apprenant Requis',
                        description: `${s.name} (solde de ${(totalCost - totalPaid).toLocaleString()} GNF)`,
                        priority: 'medium',
                        link: '/academie',
                        state: { selectedId: s.id, type: 'student' }
                    });
                }
            }
        });
        
        // 5. Purchase Orders awaiting reception
        purchaseOrders.forEach(po => {
            if (!po.isArchived && po.status === 'Commandé') {
                items.push({
                    id: `po-reception-${po.id}`,
                    icon: CubeTransparentIcon,
                    iconColor: 'text-achats-purple',
                    title: 'Commande Achat à Réceptionner',
                    description: `Commande #${po.id}`,
                    priority: 'low',
                    link: '/achats',
                    state: { selectedId: po.id, type: 'order' }
                });
            }
        });

        return items.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }).slice(0, 10); // Limit to 10 for display

    }, [user, articles, studioProjects, students, formations, paiements, purchaseOrders]);

    if(actionItems.length === 0) {
         return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                    <ListBulletIcon className="h-6 w-6 text-pgs-blue" />
                    <h3 className="text-xl font-semibold">Centre d'Actions</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">Aucune action prioritaire pour le moment.</p>
                    <p className="text-sm text-gray-400">Votre espace de travail est à jour !</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
                <ListBulletIcon className="h-6 w-6 text-pgs-blue" />
                <h3 className="text-xl font-semibold">Centre d'Actions</h3>
                <span className="bg-pgs-blue text-white text-xs font-bold px-2 py-1 rounded-full">{actionItems.length}</span>
            </div>
            <div className="space-y-0 max-h-96 overflow-y-auto pr-2">
                {actionItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => navigate(item.link, { state: item.state })}
                        className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 p-3 transition-colors duration-200 border-b dark:border-gray-700 last:border-b-0"
                    >
                        <div className={`p-2 rounded-full ${item.iconColor.replace('text-', 'bg-')}/10 mr-4`}>
                            <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                        }`}>
                            {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Important' : 'Info'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AnimatedStatCard: React.FC<{ title: string; value: string; icon: React.ElementType, color: string, onClick?: () => void }> = ({ title, value, icon: Icon, color, onClick }) => (
    <div
        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md flex items-center transition-transform transform hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className={`p-4 rounded-full ${color.replace('text-', 'bg-')}/10 ${color} mr-4`}>
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        transactions, studioProjects, decorOrders, shopOrders, articles,
        purchaseOrders, clients, studioServices, wifizoneSales
    } = useData();

    const [transactionModalData, setTransactionModalData] = useState<{ title: string, data: Transaction[] } | null>(null);
    const [statusModalData, setStatusModalData] = useState<{ title: string, items: any[] } | null>(null);

    // --- KPI CALCULATIONS ---
    const stats = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTransactions = transactions.filter(t => new Date(t.date) >= firstDayOfMonth);
        const revenueThisMonth = monthlyTransactions.filter(t => t.type === 'Revenu').reduce((sum, t) => sum + t.amount, 0);

        const clientInteractions: (StudioProject | DecorOrder | ShopOrder)[] = [...studioProjects, ...decorOrders, ...shopOrders];
        let totalBilled = 0;
        let totalPaid = 0;

        clientInteractions.forEach(item => {
            let itemTotal = 0;
            if ('totalAmount' in item) {
                itemTotal = item.totalAmount;
            } else if ('serviceIds' in item) { // StudioProject
                itemTotal = item.serviceIds.reduce((s, id) => s + (studioServices.find(serv=>serv.id===id)?.tarif || 0), 0) - item.discount;
            }
            totalBilled += itemTotal;
            totalPaid += item.amountPaid;
        });
        
        const clientReceivables = totalBilled - totalPaid;

        const supplierPayables = purchaseOrders.filter(o => o.status === 'Commandé').reduce((sum, o) => sum + o.totalAmount, 0);
        
        const lowStockCount = articles.filter(a => !a.isArchived && a.stock <= a.alertThreshold).length;

        // Commercial Pipeline KPIs
        const newQuotesThisMonth = clientInteractions.filter(item => {
            const date = 'startDate' in item ? item.startDate : item.orderDate;
            return new Date(date) >= firstDayOfMonth && (item.status === 'Devis' || item.status === 'Planifié');
        }).length;
        
        const confirmedThisMonth = clientInteractions.filter(item => {
            const date = 'startDate' in item ? item.startDate : item.orderDate;
            return new Date(date) >= firstDayOfMonth && item.status === 'Confirmé';
        }).length;

        const conversionRate = newQuotesThisMonth > 0 ? (confirmedThisMonth / newQuotesThisMonth) * 100 : 0;
        
        const pipelineValue = clientReceivables;
        
        const wifizoneRevenue = wifizoneSales.reduce((sum, sale) => sum + sale.totalAmount, 0);


        return { revenueThisMonth, clientReceivables, supplierPayables, lowStockCount, newQuotesThisMonth, confirmedThisMonth, conversionRate, pipelineValue, wifizoneRevenue };
    }, [transactions, studioProjects, decorOrders, shopOrders, articles, purchaseOrders, clients, studioServices, wifizoneSales]);

    // --- CHART DATA CALCULATIONS ---
    const financialTrendData = useMemo(() => {
        const data: { [key: string]: { Revenus: number; Dépenses: number } } = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        transactions.filter(t => new Date(t.date) >= sixMonthsAgo).forEach(t => {
            const month = new Date(t.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
            if (!data[month]) data[month] = { Revenus: 0, Dépenses: 0 };
            if (t.type === 'Revenu') data[month].Revenus += t.amount;
            else data[month].Dépenses += Math.abs(t.amount);
        });
        
        return Object.entries(data).map(([name, values]) => ({ name, ...values }));
    }, [transactions]);

    const performanceByDeptData = useMemo(() => {
        const data: { [key: string]: number } = {};
        transactions.filter(t => t.type === 'Revenu').forEach(t => {
            data[t.department] = (data[t.department] || 0) + t.amount;
        });
        return Object.entries(data).map(([name, Revenus]) => ({ name, Revenus }));
    }, [transactions]);
    
    const projectStatusDistributionData = useMemo(() => {
        const data: { [key: string]: number } = {};
        [...studioProjects, ...decorOrders, ...shopOrders].forEach(item => {
            data[item.status] = (data[item.status] || 0) + 1;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [studioProjects, decorOrders, shopOrders]);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const monthYear = data.activePayload[0].payload.name;
            const [monthStr, yearStr] = monthYear.split(' ');
            const monthIndex = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'].indexOf(monthStr);
            const year = parseInt(`20${yearStr}`);

            const monthTransactions = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getFullYear() === year && date.getMonth() === monthIndex;
            });

            setTransactionModalData({ title: `Transactions de ${monthYear}`, data: monthTransactions });
        }
    };
    
    const handleDeptBarClick = (data: any) => {
        if (!data || !data.name) return;
        const deptMap: { [key: string]: string } = {
            'Académie': '/academie', 'Studio': '/studio', 'Décor': '/decor', 'Shop': '/shop', 'Wifizone': '/wifizone'
        };
        const path = deptMap[data.name];
        if (path) navigate(path);
    };

    const handlePieClick = (data: any) => {
        if (!data || !data.name) return;
        const status = data.name;

        const filteredItems = [
            ...studioProjects.filter(p => p.status === status).map(p => ({ id: p.id, name: p.projectName, client: clients.find(c => c.id === p.clientId)?.name || 'N/A', module: 'Studio' })),
            ...decorOrders.filter(o => o.status === status).map(o => ({ id: o.id, name: o.description, client: clients.find(c => c.id === o.clientId)?.name || 'N/A', module: 'Décor' })),
            ...shopOrders.filter(o => o.status === status).map(o => ({ id: o.id, name: `Vente #${o.id}`, client: clients.find(c => c.id === o.clientId)?.name || 'Comptoir', module: 'Shop' }))
        ];

        setStatusModalData({
            title: `Projets & Ventes avec le statut "${status}"`,
            items: filteredItems
        });
    };

    const DEPT_COLORS: {[key: string]: string} = { 'Académie': '#3B82F6', 'Studio': '#E53E3E', 'Décor': '#FBBF24', 'Shop': '#10B981', 'Wifizone': '#F97316', 'Général': '#64748B' };
    const STATUS_COLORS = ['#3B82F6', '#F97316', '#10B981', '#6366F1', '#EF4444', '#64748B'];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tableau de Bord Général</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Bonjour, {user?.name} ! Voici une vision globale de la santé de l'entreprise.</p>
                </div>
                <button onClick={() => navigate(-1)} className="btn-secondary">Fermer</button>
            </div>

            <ActionCenter />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <AnimatedStatCard title="Revenus (ce mois)" value={`${stats.revenueThisMonth.toLocaleString()} GNF`} icon={ArrowTrendingUpIcon} color="text-green-500" />
                <AnimatedStatCard title="Créances Clients" value={`${stats.clientReceivables.toLocaleString()} GNF`} icon={BanknotesIcon} color="text-yellow-500" onClick={() => navigate('/clients?filter=overdue')} />
                <AnimatedStatCard title="Dettes Fournisseurs" value={`${stats.supplierPayables.toLocaleString()} GNF`} icon={ArrowTrendingDownIcon} color="text-red-500" onClick={() => navigate('/achats?filter=payables')} />
                <AnimatedStatCard title="Alertes de Stock" value={stats.lowStockCount.toString()} icon={BellAlertIcon} color="text-orange-500" onClick={() => navigate('/inventaire')} />
                <AnimatedStatCard title="Revenus Wifizone" value={`${stats.wifizoneRevenue.toLocaleString()} GNF`} icon={WifiIcon} color="text-wifizone-orange" onClick={() => navigate('/wifizone')} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Pipeline Commercial (ce mois)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Devis Envoyés</p>
                        <p className="text-2xl font-bold">{stats.newQuotesThisMonth}</p>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Commandes Confirmées</p>
                        <p className="text-2xl font-bold">{stats.confirmedThisMonth}</p>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Taux de Conversion</p>
                        <p className="text-2xl font-bold text-green-500">{stats.conversionRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Valeur du Pipeline</p>
                        <p className="text-2xl font-bold text-blue-500">{stats.pipelineValue.toLocaleString()} GNF</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Flux Financier (6 derniers mois)</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={financialTrendData} onClick={handleChartClick} className="cursor-pointer">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)"/>
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem', color: '#fff' }} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                        <Legend />
                        <Bar dataKey="Revenus" fill="#22C55E" name="Revenus" barSize={30} />
                        <Bar dataKey="Dépenses" fill="#EF4444" name="Dépenses" barSize={30} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Performance par Département</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceByDeptData} onClick={(e) => handleDeptBarClick(e?.activePayload?.[0].payload)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)"/>
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }} formatter={(value: number) => `${value.toLocaleString()} GNF`} />
                            <Bar dataKey="Revenus" name="Revenus" >
                                {performanceByDeptData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[entry.name] || '#A8A29E'} cursor="pointer" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Statuts des Projets & Ventes</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <PieChart>
                           <Pie data={projectStatusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} onClick={handlePieClick}>
                               {projectStatusDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} cursor="pointer" />)}
                           </Pie>
                           <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {transactionModalData && (
                <Modal isOpen={!!transactionModalData} onClose={() => setTransactionModalData(null)} title={transactionModalData.title}>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800">
                                <tr className="border-b">
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Description</th>
                                    <th className="p-2 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionModalData.data.map(t => (
                                    <tr key={t.id} className="border-b">
                                        <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-2">{t.description}</td>
                                        <td className={`p-2 text-right font-semibold ${t.type === 'Revenu' ? 'text-green-500' : 'text-red-500'}`}>{t.amount.toLocaleString()} GNF</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}

            {statusModalData && (
                <Modal isOpen={!!statusModalData} onClose={() => setStatusModalData(null)} title={statusModalData.title}>
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="space-y-2">
                            {statusModalData.items.map(item => (
                                <li key={`${item.module}-${item.id}`} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.client} - <span className="font-mono text-xs">{item.module}</span></p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;
