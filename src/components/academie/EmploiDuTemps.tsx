import React from 'react';
import { ScheduleEntry, Formation, Formateur, CompanyProfile } from '../../types.ts';

interface EmploiDuTempsProps {
  schedule: ScheduleEntry[];
  formation: Formation;
  formateurs: Formateur[];
  companyProfile: CompanyProfile;
}

const days: ScheduleEntry['dayOfWeek'][] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const getDurationInHours = (start: string, end: string): number => {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.max(1, Math.round(duration));
};

const EmploiDuTemps: React.FC<EmploiDuTempsProps> = ({ schedule, formation, formateurs, companyProfile }) => {
    const renderedCells = new Set<string>();

    return (
        <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-8 border border-gray-300 shadow-lg">
            <header className="text-center mb-8">
                <img src={companyProfile.logoUrl} alt="Logo" className="h-16 mx-auto mb-2" />
                <h1 className="text-2xl font-bold text-pgs-red">{companyProfile.nom}</h1>
                <h2 className="text-xl font-semibold text-academie-blue">Emploi du Temps - PS-ACADÉMIE</h2>
                <p className="text-lg font-medium mt-2">Programme de Formation : <span className="font-bold">{formation.name}</span></p>
            </header>
            
             <table className="w-full border-collapse text-center table-fixed text-xs">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="w-20 border p-1 font-semibold">Heure</th>
                        {days.map(day => (
                            <th key={day} className="border p-1 font-semibold">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(time => {
                        return (
                            <tr key={time}>
                                <td className="border p-1 font-mono">{time}</td>
                                {days.map(day => {
                                    if (renderedCells.has(`${day}-${time}`)) return null;

                                    const entry = schedule.find(e => e.dayOfWeek === day && e.startTime === time);
                                    if (entry) {
                                        const duration = getDurationInHours(entry.startTime, entry.endTime);
                                        const formateur = formateurs.find(f => f.id === entry.formateurId);
                                        
                                        for (let i = 1; i < duration; i++) {
                                            const nextTime = `${(parseInt(time.split(':')[0]) + i).toString().padStart(2, '0')}:00`;
                                            renderedCells.add(`${day}-${nextTime}`);
                                        }

                                        return (
                                            <td key={day} rowSpan={duration} className="border p-0 align-top bg-blue-50">
                                                <div className="p-1.5 text-left h-full flex flex-col text-xs">
                                                    <p className="font-bold text-blue-900">{entry.title}</p>
                                                    <p className="text-gray-800">Salle: {entry.salle}</p>
                                                    {formateur && <p className="text-gray-700 mt-auto pt-1">{formateur.name}</p>}
                                                </div>
                                            </td>
                                        );
                                    }
                                    return <td key={day} className="border h-16"></td>;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <footer className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
                <p>Ce document est généré par le système de gestion de PGS-SARLU.</p>
            </footer>
        </div>
    );
};

export default EmploiDuTemps;