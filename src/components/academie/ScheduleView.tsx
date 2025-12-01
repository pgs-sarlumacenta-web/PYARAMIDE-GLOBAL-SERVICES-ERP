import React from 'react';
import { ScheduleEntry, Formation, Formateur } from '../../types.ts';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ScheduleViewProps {
  schedule: ScheduleEntry[];
  formations: Formation[];
  formateurs: Formateur[];
  onEdit: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  hasPermission: boolean;
}

const days: ScheduleEntry['dayOfWeek'][] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const getDurationInHours = (start: string, end: string): number => {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    // Ensure duration is at least 1
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.max(1, Math.round(duration));
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, formations, formateurs, onEdit, onDelete, hasPermission }) => {
    const renderedCells = new Set<string>();

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center table-fixed">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="w-24 border p-2 font-semibold">Heure</th>
                        {days.map(day => (
                            <th key={day} className="border p-2 font-semibold">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {timeSlots.map(time => {
                        return (
                            <tr key={time}>
                                <td className="border p-2 font-mono text-sm">{time}</td>
                                {days.map(day => {
                                    if (renderedCells.has(`${day}-${time}`)) {
                                        return null; // This cell is spanned by a previous entry
                                    }

                                    const entry = schedule.find(e => e.dayOfWeek === day && e.startTime === time);

                                    if (entry) {
                                        const duration = getDurationInHours(entry.startTime, entry.endTime);
                                        const formation = formations.find(f => f.id === entry.formationId);
                                        const formateur = formateurs.find(f => f.id === entry.formateurId);

                                        // Mark cells that will be covered by rowspan
                                        for (let i = 1; i < duration; i++) {
                                            const nextTime = `${(parseInt(time.split(':')[0]) + i).toString().padStart(2, '0')}:00`;
                                            renderedCells.add(`${day}-${nextTime}`);
                                        }

                                        return (
                                            <td key={day} rowSpan={duration} className="border p-0 align-top bg-blue-50 dark:bg-blue-900/30 relative group">
                                                <div className="p-1.5 text-left text-xs h-full flex flex-col">
                                                    <p className="font-bold text-blue-800 dark:text-blue-200">{entry.title}</p>
                                                    <p className="text-gray-600 dark:text-gray-400">Salle: {entry.salle}</p>
                                                    {formation && <p className="font-semibold text-academie-blue">{formation.name}</p>}
                                                    {formateur && <p className="text-gray-500 dark:text-gray-300 mt-auto pt-1">{formateur.name}</p>}
                                                </div>
                                                {hasPermission && (
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                        <button onClick={() => onEdit(entry)} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-yellow-100 dark:hover:bg-yellow-700"><PencilIcon className="h-4 w-4 text-yellow-600"/></button>
                                                        <button onClick={() => onDelete(entry)} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-red-100 dark:hover:bg-red-700"><TrashIcon className="h-4 w-4 text-red-600"/></button>
                                                    </div>
                                                )}
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
        </div>
    );
};

export default ScheduleView;