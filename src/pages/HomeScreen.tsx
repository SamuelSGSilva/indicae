import React from 'react';
import { User, Screen } from '../types'; // Caminho atualizado
import { icons } from '../constants'; // Caminho atualizado

interface HomeScreenProps {
  currentUser: User;
  onNavigate: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <div className="w-6 h-6"></div> {/* Spacer */}
        <h1 className="text-xl font-bold text-white">Bem-vindo(a), {currentUser.name.split(' ')[0]}!</h1>
        <button className="text-white">{icons.bell('w-6 h-6')}</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <img
            src={currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/200/200`}
            alt={currentUser.name}
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-teal-600"
          />
          <h2 className="text-3xl font-bold">{currentUser.name}</h2>
          <p className="text-gray-400">{currentUser.city}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <button
            onClick={() => onNavigate(Screen.Search)}
            className="flex flex-col items-center justify-center bg-[#0d1b2a] p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors"
          >
            {icons.search('w-10 h-10 text-white mb-2')}
            <span className="text-sm font-semibold">Buscar Pessoas</span>
          </button>
          <button
            onClick={() => onNavigate(Screen.SkillSearch)}
            className="flex flex-col items-center justify-center bg-[#0d1b2a] p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors"
          >
            {icons.code('w-10 h-10 text-white mb-2')}
            <span className="text-sm font-semibold">Buscar por Skills</span>
          </button>
          <button
            onClick={() => onNavigate(Screen.Connections)}
            className="flex flex-col items-center justify-center bg-[#0d1b2a] p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors"
          >
            {icons.connections('w-10 h-10 text-white mb-2')}
            <span className="text-sm font-semibold">Minhas Conexões</span>
          </button>
          <button
            onClick={() => onNavigate(Screen.Messages)}
            className="flex flex-col items-center justify-center bg-[#0d1b2a] p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors"
          >
            {icons.messages('w-10 h-10 text-white mb-2')}
            <span className="text-sm font-semibold">Mensagens</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;