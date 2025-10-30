import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { icons, calculateAge } from '../constants';

interface SkillSearchScreenProps {
  allUsers: User[];
  onUserClick: (user: User) => void;
  onBack: () => void;
}

const UserCard: React.FC<{ user: User, onClick: () => void }> = ({ user, onClick }) => (
    <div onClick={onClick} className="bg-[#0d1b2a] rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105">
        <img className="w-20 h-20 rounded-full object-cover mb-2" src={user.avatar} alt={user.name} />
        <p className="font-bold text-white">{user.name}</p>
        <p className="text-sm text-gray-400">{calculateAge(user.dob)}</p>
        <p className="text-xs text-gray-400">{user.city}</p>
    </div>
);

const SkillSearchScreen: React.FC<SkillSearchScreenProps> = ({ allUsers, onUserClick, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return allUsers;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allUsers.filter(user =>
      user.hardSkills?.some(skill => skill.toLowerCase().includes(lowerCaseSearchTerm)) ||
      user.softSkills?.some(skill => skill.toLowerCase().includes(lowerCaseSearchTerm)) ||
      user.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [allUsers, searchTerm]);

  return (
    <div className="w-full min-h-full bg-[#0B1526]">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Buscar por Habilidades</h1>
        <div className="w-6 h-6"></div> {/* Spacer */}
      </header>
      
      <div className="px-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por skill ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-6 h-6')}
          </div>
        </div>
      </div>
      
      <main className="bg-white rounded-t-[2.5rem] p-4 flex-grow overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map(user => (
                <UserCard key={user.id} user={user} onClick={() => onUserClick(user)}/>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado com essas habilidades.</p>
        )}
      </main>
    </div>
  );
};

export default SkillSearchScreen;