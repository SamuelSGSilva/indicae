import React from 'react';

interface InitialScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0B1526] text-white">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Indicai</h1>
        <p className="text-gray-400 mb-10">Conectando talentos.</p>

        <div className="space-y-4">
          <button
            onClick={onNavigateToLogin}
            className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={onNavigateToRegister}
            className="w-full bg-gray-700 text-white font-bold py-3 px-12 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialScreen;