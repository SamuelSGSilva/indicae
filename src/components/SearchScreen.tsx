import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { icons, calculateAge, ALL_CITIES } from '../constants';
import CityModal from './CityModal'; // Importar o CityModal

interface SearchScreenProps {
  users: User[];
  onUserClick: (user: User) => void;
  onBack: () => void;
  onNavigate: (screen: any) => void; // Adicionado para compatibilidade com o App.tsx
}

const UserCard: React.FC<{ user: User, onClick: () => void }> = ({ user, onClick }) => (
    <div onClick={onClick} className="bg-[#0d1b2a] rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105">
        <img className="w-20 h-20 rounded-full object-cover mb-2" src={user.avatar} alt={user.name} />
        <p className="font-bold text-white">{user.name}</p>
        <p className="text-sm text-gray-400">{calculateAge(user.dob)} anos</p>
        <p className="text-xs text-gray-400">{user.city}</p>
    </div>
)

const SearchScreen: React.FC<SearchScreenProps> = ({ users, onUserClick, onBack }) => {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMinAge, setSelectedMinAge] = useState<number | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    let currentFilteredUsers = users;

    // Filter by text query (name, skills, city)
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      currentFilteredUsers = currentFilteredUsers.filter(user => 
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.city.toLowerCase().includes(lowerCaseQuery) ||
        user.hardSkills?.some(skill => skill.toLowerCase().includes(lowerCaseQuery)) ||
        user.softSkills?.some(skill => skill.toLowerCase().includes(lowerCaseQuery))
      );
    }

    // Filter by selected city
    if (selectedCity) {
      currentFilteredUsers = currentFilteredUsers.filter(user => 
        user.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Filter by minimum age
    if (selectedMinAge !== null && selectedMinAge > 0) {
      currentFilteredUsers = currentFilteredUsers.filter(user => {
        const age = calculateAge(user.dob);
        return age >= selectedMinAge;
      });
    }

    return currentFilteredUsers;
  }, [users, query, selectedCity, selectedMinAge]);
  
  return (
    <>
      <div className="w-full min-h-full bg-[#0B1526] flex flex-col">
        <header className="p-4 flex justify-between items-center flex-shrink-0">
          <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
          <h1 className="text-xl font-bold text-white">Buscar Conexões</h1>
          <div className="w-6 h-6"></div> {/* Spacer */}
        </header>
        
        <div className="px-4 flex-shrink-0">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Pesquise por nome, skill ou cidade..." 
              className="w-full bg-white text-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icons.search('w-6 h-6')}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 text-sm text-gray-300 mb-4">
              <button 
                onClick={() => setIsCityModalOpen(true)} 
                className="flex items-center bg-[#0d1b2a] rounded-full px-4 py-2 hover:bg-teal-600 transition-colors"
              >
                {icons.location('w-4 h-4 mr-2')}
                Local: {selectedCity || 'Todos'}
              </button>
              <div className="flex items-center bg-[#0d1b2a] rounded-full px-4 py-2">
                <label htmlFor="minAge" className="mr-2">Idade Mínima:</label>
                <input
                  id="minAge"
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={selectedMinAge || ''}
                  onChange={(e) => setSelectedMinAge(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-transparent w-12 text-white focus:outline-none text-right"
                />
              </div>
          </div>
        </div>
        
        <main className="bg-white rounded-t-[2.5rem] p-4 mt-4 flex-grow overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredUsers.map(user => (
                  <UserCard key={user.id} user={user} onClick={() => onUserClick(user)}/>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado com esses filtros.</p>
          )}
        </main>
      </div>

      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setIsCityModalOpen(false);
        }}
        availableCities={ALL_CITIES}
        title="Filtrar por Cidade"
      />
    </>
  );
};

export default SearchScreen;