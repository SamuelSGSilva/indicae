import React from 'react';
import { User } from '../../types';
import { icons } from '../../constants';

interface HomeScreenProps {
  currentUser: User;
  onNavigate: (screen: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <div className="w-6 h-6"></div> {/* Placeholder */}
        <h1 className="text-xl font-bold text-white">Indicae</h1>
        <button className="flex flex-col items-center text-white">
          {icons.bell('w-6 h-6')}
          <span className="text-xs">Notificações</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col bg-white rounded-t-[2.5rem] p-6 mt-4 text-gray-800 overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-4">Bem-vindo(a), {currentUser.name.split(' ')[0]}!</h2>
        <p className="text-center text-gray-600 mb-8">Explore as funcionalidades do Indicae.</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('Search')}
            className="flex flex-col items-center justify-center p-6 bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-colors"
          >
            {icons.search('w-10 h-10 mb-2')}
            <span className="font-semibold text-lg">Buscar Talentos</span>
          </button>
          <button
            onClick={() => onNavigate('Connections')}
            className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
          >
            {icons.connections('w-10 h-10 mb-2')}
            <span className="font-semibold text-lg">Minhas Conexões</span>
          </button>
          <button
            onClick={() => onNavigate('Messages')}
            className="flex flex-col items-center justify-center p-6 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-colors"
          >
            {icons.messages('w-10 h-10 mb-2')}
            <span className="font-semibold text-lg">Mensagens</span>
          </button>
          <button
            onClick={() => onNavigate('Profile')}
            className="flex flex-col items-center justify-center p-6 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition-colors"
          >
            {icons.profile('w-10 h-10 mb-2')}
            <span className="font-semibold text-lg">Meu Perfil</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;