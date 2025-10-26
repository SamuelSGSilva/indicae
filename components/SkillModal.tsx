import React, { useState, useMemo } from 'react';
import { icons } from '../constants';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: string) => void;
  availableSkills: string[];
  currentSkills: string[];
  title: string;
}

const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onSelectSkill,
  availableSkills,
  currentSkills,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSkills = useMemo(() => {
    return availableSkills
      .filter(skill => !currentSkills.includes(skill))
      .filter(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [availableSkills, currentSkills, searchTerm]);

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
            placeholder="Pesquisar skill..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-5 h-5')}
          </div>
        </div>
        
        <ul className="flex-grow overflow-y-auto space-y-2 pr-2">
          {filteredSkills.length > 0 ? filteredSkills.map(skill => (
            <li key={skill}>
              <button
                onClick={() => onSelectSkill(skill)}
                className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-teal-600/50 transition-colors"
              >
                {skill}
              </button>
            </li>
          )) : (
            <li className="text-center text-gray-400 p-4">Nenhuma skill encontrada.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SkillModal;