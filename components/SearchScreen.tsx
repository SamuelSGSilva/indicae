import React, { useState } from 'react';
import { User, Screen } from '../types';
import { icons, calculateAge } from '../constants';

interface SearchScreenProps {
  users: User[];
  onUserClick: (user: User) => void;
  onBack: () => void;
  onNavigate: (screen: Screen) => void; // Adicionado onNavigate prop
}

const UserCard: React.FC<{ user: User, onClick: () => void }> = ({ user, onClick }) => (
    <div onClick={onClick} className="bg-[#0d1b2a] rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105">
        <img className="w-20 h-20 rounded-full object-cover mb-2" src={user.avatar} alt={user.name} />
        <p className="font-bold text-white">{user.name}</p>
        <p className="text-sm text-gray-400">{calculateAge(user.dob)}</p>
        <p className="text-xs text-gray-400">{user.city}-{user.state}</p>
    </div>
)

const SearchScreen: React.FC<SearchScreenProps> = ({ users, onUserClick, onBack, onNavigate }) => {
  const [query, setQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.city.toLowerCase().includes(query.toLowerCase()) ||
    user.hardSkills?.some(skill => skill.toLowerCase().includes(query.toLowerCase())) ||
    user.softSkills?.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
  );
  
  return (
    <div className="w-full bg-[#0B1526]">
      <header className="p-4 flex justify-between items-center">
        <div className="w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Indicae</h1>
        <button className="flex flex-col items-center text-white">
          {icons.search('w-6 h-6')}
          <span className="text-xs">Indicae</span>
        </button>
      </header>
      
      <div className="px-4">
        <div className="relative mb-4"> {/* Adicionado mb-4 para espaçamento */}
          <input 
            type="text" 
            placeholder="Pesquise por nome ou cidade..." // Alterado placeholder
            className="w-full bg-white text-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-6 h-6')}
          </div>
        </div>
        {/* Novo botão para navegar para SkillSearchScreen */}
        <button 
          onClick={() => onNavigate(Screen.SkillSearch)} 
          className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors mb-4"
        >
          Buscar por Skill
        </button>
        <div className="flex justify-between items-center mt-4 text-sm">
            <p>Local: Foz do Iguaçu</p>
            <p>Idade: 18-30</p>
        </div>
      </div>
      
      <main className="bg-white rounded-t-[2.5rem] p-4 mt-4">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map(user => (
                <UserCard key={user.id} user={user} onClick={() => onUserClick(user)}/>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</p>
        )}
      </main>
    </div>
  );
};

export default SearchScreen;