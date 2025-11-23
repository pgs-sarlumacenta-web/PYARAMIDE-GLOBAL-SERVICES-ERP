import React from 'react';
import { Employee, Payroll, CompanyProfile } from '../../types.ts';
import ReportLayout from '../ReportLayout.tsx';

interface PersonnelReportProps {
  employees: Employee[];
  newHires: Employee[];
  payrolls: Payroll[];
  period: string;
  companyProfile: CompanyProfile;
}

const PersonnelReport: React.FC<PersonnelReportProps> = ({ employees, newHires, payrolls, period, companyProfile }) => {
  const totalPayrollCost = payrolls.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <ReportLayout title="Rapport du Personnel" period={period} companyProfile={companyProfile}>
      <div className="space-y-6">
        <section className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Nouveaux Employés</h3>
            <p className="text-2xl font-bold">{newHires.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500">Paies Emises</h3>
            <p className="text-2xl font-bold">{payrolls.length}</p>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <h3 className="text-sm font-semibold text-red-700">Masse Salariale Nette</h3>
            <p className="text-2xl font-bold text-red-800">{totalPayrollCost.toLocaleString()} GNF</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Nouveaux Employés Recrutés</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Nom</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Département</th>
                <th className="p-2">Date d'embauche</th>
              </tr>
            </thead>
            <tbody>
              {newHires.map(employee => (
                  <tr key={employee.id} className="border-b">
                    <td className="p-2">{employee.name}</td>
                    <td className="p-2">{employee.role}</td>
                    <td className="p-2">{employee.department}</td>
                    <td className="p-2">{new Date(employee.hireDate).toLocaleDateString()}</td>
                  </tr>
              ))}
               {newHires.length === 0 && (
                <tr><td colSpan={4} className="text-center p-4 text-gray-500">Aucun nouvel employé pour cette période.</td></tr>
               )}
            </tbody>
          </table>
        </section>
        
        <section>
          <h3 className="text-lg font-bold mb-2 border-b pb-1">Détail des Paies Emises</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Employé</th>
                <th className="p-2">Période</th>
                <th className="p-2 text-right">Salaire Net</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map(payroll => {
                const employee = employees.find(e => e.id === payroll.employeeId);
                return (
                  <tr key={payroll.id} className="border-b">
                    <td className="p-2">{employee?.name || 'N/A'}</td>
                    <td className="p-2">{payroll.period}</td>
                    <td className="p-2 text-right">{payroll.netSalary.toLocaleString()} GNF</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </ReportLayout>
  );
};

export default PersonnelReport;