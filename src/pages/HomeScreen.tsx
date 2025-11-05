import React from 'react';
import { User, Screen } from '../types';

interface HomeScreenProps {
  currentUser: User;
  onNavigate: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      {/* Header */}
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-bold">Início</h1>
        <span className="text-xl font-bold text-teal-400">Indicai</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white text-gray-800 rounded-t-[2.5rem] p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Olá, {currentUser.name.split(' ')[0]}!</h2>
          <p className="text-gray-500">Pronto para impulsionar carreiras?</p>
        </div>

        {/* Promote Talents Card */}
        <div className="bg-[#0d1b2a] text-white rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-bold mb-2">Promova Talentos</h3>
          <p className="text-sm text-gray-300">Sua indicação pode ser o primeiro passo na carreira de alguém.</p>
        </div>

        {/* New Connections Card */}
        <div className="bg-[#0d1b2a] text-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Novas Conexões</h3>
          <div className="space-y-4">
            <button
              onClick={() => console.log('Indicar novo talento - a ser implementado')}
              disabled
              className="w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Indicar novo Talento
            </button>
            <button
              onClick={() => onNavigate(Screen.Search)}
              className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
            >
              Explorar minha Rede
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
