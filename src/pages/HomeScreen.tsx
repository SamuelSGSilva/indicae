import React from 'react';
import { User, Screen } from '../../types';
import { icons } from '../../constants';

interface HomeScreenProps {
  currentUser: User;
  onNavigate: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ currentUser, onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <div className="w-6 h-6"></div> {/* Placeholder para alinhamento */}
        <h1 className="text-xl font-bold text-white">Início</h1>
        <button onClick={() => onNavigate(Screen.Search)} className="flex flex-col items-center text-white">
          {icons.search('w-6 h-6')}
          <span className="text-xs">Indicae</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col bg-white rounded-t-[2.5rem] p-6 mt-4 text-gray-800 overflow-y-auto">
        {/* Seção de Saudação */}
        <div className="flex items-center mb-8">
          <img 
            src={currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/200/200`} 
            alt={currentUser.name} 
            className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-teal-600"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Olá, {currentUser.name.split(' ')[0]}!</h2>
            <p className="text-gray-600">Pronto para impulsionar carreiras?</p>
          </div>
        </div>

        {/* Cartão: Promova Talentos */}
        <div className="bg-[#0d1b2a] rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center mb-3">
            {icons.bell('w-8 h-8 text-teal-400')} {/* Usando ícone de sino como megafone */}
            <h3 className="text-xl font-bold text-white ml-3">Promova Talentos</h3>
          </div>
          <p className="text-gray-300 text-sm">Sua indicação pode ser o primeiro passo na carreira de alguém.</p>
        </div>

        {/* Cartão: Novas Conexões */}
        <div className="bg-[#0d1b2a] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center mb-4">
            {icons.connections('w-8 h-8 text-blue-400')}
            <h3 className="text-xl font-bold text-white ml-3">Novas Conexões</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate(Screen.Search)} // Pode ser uma tela específica para indicar talento
              className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors"
            >
              {icons.plus('w-5 h-5 mr-2')} Indicar novo Talento
            </button>
            <button
              onClick={() => onNavigate(Screen.Connections)}
              className="w-full flex items-center justify-center bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {icons.connections('w-5 h-5 mr-2')} Explorar minha Rede
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;