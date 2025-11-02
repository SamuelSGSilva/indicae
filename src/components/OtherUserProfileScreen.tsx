import React, { useState } from 'react';
import { User } from '../types';
import { icons, calculateAge, getColorForSkill } from '../constants';

interface OtherUserProfileScreenProps {
  user: User;
  onBack: () => void;
  onSendConnectionRequest: (receiverId: string, interestMessage: string) => void;
  isConnectionPending: boolean;
  isConnected: boolean;
}

const OtherUserProfileScreen: React.FC<OtherUserProfileScreenProps> = ({ 
  user, 
  onBack, 
  onSendConnectionRequest,
  isConnectionPending,
  isConnected,
}) => {
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');

  const handleSendRequest = () => {
    if (interestMessage.trim()) {
      onSendConnectionRequest(user.id, interestMessage.trim());
      setShowInterestModal(false);
      setInterestMessage('');
    } else {
      alert('Por favor, escreva uma mensagem de interesse.');
    }
  };

  console.log("OtherUserProfileScreen received user:", user); // Log de depuração

  return (
    <>
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold">Perfil de {user.name.split(' ')[0]}</h1>
        <div className="w-8"></div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6"> {/* Main simplificado */}
        <img 
          src={user.avatar || `https://picsum.photos/seed/${user.id}/200/200`} 
          alt={user.name} 
          className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-teal-600"
        />
        <h2 className="text-3xl font-bold">{user.name}</h2>
        <p className="text-gray-400">{calculateAge(user.dob)} Anos</p>
        <p className="text-gray-400">{user.city}</p>

        <div className="mt-6 text-center">
          {isConnected ? (
            <button className="bg-green-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto transition-colors shadow-lg cursor-not-allowed opacity-80">
              Conectado
            </button>
          ) : isConnectionPending ? (
            <button className="bg-yellow-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto transition-colors shadow-lg cursor-not-allowed opacity-80">
              Solicitação Pendente
            </button>
          ) : (
            <button 
              onClick={() => setShowInterestModal(true)} 
              className="bg-teal-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto hover:bg-teal-700 transition-colors shadow-lg"
            >
              Conectar
            </button>
          )}
        </div>
      </main>
    </div>

    {showInterestModal && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
        onClick={() => setShowInterestModal(false)}
      >
        <div 
          className="bg-[#0d1b2a] rounded-2xl p-6 w-11/12 max-w-sm flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white text-center mb-4">Conectar com {user.name.split(' ')[0]}</h2>
          <textarea
            value={interestMessage}
            onChange={(e) => setInterestMessage(e.target.value)}
            placeholder="Escreva uma mensagem de interesse..."
            rows={5}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          <button
            onClick={handleSendRequest}
            className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Enviar Solicitação
          </button>
          <button
            onClick={() => setShowInterestModal(false)}
            className="w-full mt-2 bg-gray-700 text-white font-bold py-3 px-12 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default OtherUserProfileScreen;