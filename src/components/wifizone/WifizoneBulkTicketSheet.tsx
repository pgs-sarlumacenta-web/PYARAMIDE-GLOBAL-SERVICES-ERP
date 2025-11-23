
import React from 'react';
import { WifizoneSale, WifizonePlan, CompanyProfile } from '../../types.ts';
import { ScissorsIcon } from '@heroicons/react/24/outline';

interface WifizoneBulkTicketSheetProps {
  sales: WifizoneSale[];
  plan: WifizonePlan;
  companyProfile: CompanyProfile;
  agentName?: string;
}

const WifizoneBulkTicketSheet: React.FC<WifizoneBulkTicketSheetProps> = ({ sales, plan, companyProfile, agentName }) => {
  return (
    <div className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto">
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold text-pgs-red uppercase">{companyProfile.nom} - WIFIZONE</h1>
        <div className="flex justify-between items-end mt-2">
            <div className="text-left">
                <p className="text-sm font-bold">LOT DE TICKETS</p>
                <p className="text-xs text-gray-600">Agent : {agentName || 'Stock'}</p>
            </div>
            <div className="text-right">
                <p className="text-sm">Forfait : <strong>{plan.name}</strong></p>
                <p className="text-xs text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 border-t border-l border-gray-400">
        {sales.map((sale) => (
          <div key={sale.id} className="relative border-r border-b border-gray-400 p-2 flex flex-col items-center justify-center text-center h-32 page-break-inside-avoid">
            {/* Cut Marks */}
            <div className="absolute -bottom-1 -right-1 text-gray-300">
                <ScissorsIcon className="h-3 w-3" />
            </div>

            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{companyProfile.nom}</p>
            
            <div className="bg-black text-white px-3 py-0.5 rounded-full text-xs font-bold mb-1.5 shadow-sm">
              {plan.duration}H
            </div>
            
            <p className="text-lg font-mono font-black tracking-widest my-1 border border-dashed border-gray-300 px-2 py-1 rounded bg-gray-50">
                {sale.voucherCode}
            </p>
            
            <div className="flex justify-between w-full px-2 mt-1 items-end">
                 <p className="text-[8px] text-gray-400">Valide dès connexion</p>
                 <p className="text-[10px] font-bold text-gray-700">{plan.price.toLocaleString()} GNF</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Document généré par le système de gestion PGS-SARLU - {sales.length} tickets</p>
      </div>
      
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default WifizoneBulkTicketSheet;
