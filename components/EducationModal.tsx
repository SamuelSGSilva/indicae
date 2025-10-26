import React, { useState, useMemo } from 'react';
import { icons } from '../constants';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEducation: (education: string) => void;
  availableEducations: string[];
  title: string;
}

const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  onSelectEducation,
  availableEducations,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEducations = useMemo(() => {
    if (!searchTerm) {
      return availableEducations;
    }
    return availableEducations.filter(education => 
      education.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableEducations, searchTerm]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#0d1b2a] rounded-2xl p-6 w-11/12 max-w-sm flex flex-col max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white text-center mb-4">{title}</h2>
        
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Pesquisar formação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-5 h-5')}
          </div>
        </div>
        
        <ul className="flex-grow overflow-y-auto space-y-2 pr-2">
          {filteredEducations.length > 0 ? filteredEducations.map(education => (
            <li key={education}>
              <button
                onClick={() => onSelectEducation(education)}
                className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-teal-600/50 transition-colors"
              >
                {education}
              </button>
            </li>
          )) : (
            <li className="text-center text-gray-400 p-4">Nenhuma formação encontrada.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EducationModal;