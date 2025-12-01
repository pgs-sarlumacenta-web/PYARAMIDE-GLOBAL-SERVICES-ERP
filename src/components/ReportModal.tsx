import React, { useState } from 'react';
import Modal from './Modal.tsx';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string) => void;
  title: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onGenerate, title }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = () => {
    onGenerate(startDate, endDate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p>Veuillez sélectionner la plage de dates pour votre rapport.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">Date de début</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-style w-full mt-1"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium">Date de fin</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-style w-full mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary mr-2">Annuler</button>
          <button type="button" onClick={handleGenerate} className="btn-primary bg-pgs-blue hover:bg-blue-700">
            Générer le rapport
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportModal;
