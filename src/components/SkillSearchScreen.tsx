import React, { useState, useMemo } from 'react';
import { User, Screen } from '../types';
import { icons, ALL_HARD_SKILLS, ALL_SOFT_SKILLS, calculateAge } from '../../constants'; // Caminho corrigido

interface SkillSearchScreenProps {
  allUsers: User[]; // Todos os usuários para pesquisar
  onUserClick: (user: User) => void;
  onBack: () => void;
}

const UserCard: React.FC<{ user: User, onClick: () => void }> = ({ user, onClick }) => (
    <div onClick={onClick} className="bg-[#0d1b2a] rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105">
        <img className="w-20 h-20 rounded-full object-cover mb-2" src={user.avatar} alt={user.name} />
        <p className="font-bold text-white">{user.name}</p>
        <p className="text-sm text-gray-400">{calculateAge(user.dob)}</p>
        <p className="text-xs text-gray-400">{user.city}-{user.state}</p>
    </div>
);

const SkillSearchScreen: React.FC<SkillSearchScreenProps> = ({ allUsers, onUserClick, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const allAvailableSkills = useMemo(() => {
    const combined = [...new Set([...ALL_HARD_SKILLS, ...ALL_SOFT_SKILLS])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredSkills = useMemo(() => {
    if (!searchTerm) {
      return allAvailableSkills;
    }
    return allAvailableSkills.filter(skill =>
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAvailableSkills, searchTerm]);

  const usersWithSelectedSkill = useMemo(() => {
    if (!selectedSkill) {
      return [];
    }
    return allUsers.filter(user =>
      user.hardSkills?.includes(selectedSkill) ||
      user.softSkills?.includes(selectedSkill)
    );
  }, [allUsers, selectedSkill]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Buscar por Skill</h1>
        <div className="w-6 h-6"></div> {/* Placeholder */}
      </header>

      <main className="flex-1 flex flex-col bg-white rounded-t-[2.5rem] p-4 mt-4 text-gray-800 overflow-hidden">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Pesquisar skill..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 text-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-6 h-6')}
          </div>
        </div>

        {selectedSkill ? (
          <div className="flex flex-col flex-grow">
            <h2 className="text-lg font-bold mb-3">Usuários com "{selectedSkill}"</h2>
            <button 
              onClick={() => setSelectedSkill(null)} 
              className="self-start mb-4 px-3 py-1.5 text-sm rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              {icons.back('w-4 h-4 inline-block mr-1')} Mudar Skill
            </button>
            {usersWithSelectedSkill.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2">
                {usersWithSelectedSkill.map(user => (
                  <UserCard key={user.id} user={user} onClick={() => onUserClick(user)} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado com esta skill.</p>
            )}
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto space-y-2 pr-2">
            <h2 className="text-lg font-bold mb-3">Selecione uma Skill</h2>
            {filteredSkills.length > 0 ? filteredSkills.map(skill => (
              <li key={skill} className="list-none">
                <button
                  onClick={() => setSelectedSkill(skill)}
                  className="w-full text-left p-3 bg-gray-100 rounded-lg hover:bg-teal-600/10 transition-colors text-gray-800"
                >
                  {skill}
                </button>
              </li>
            )) : (
              <li className="text-center text-gray-500 p-4 list-none">Nenhuma skill encontrada.</li>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SkillSearchScreen;