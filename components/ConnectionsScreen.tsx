import React, { useState } from 'react';
import { ConnectionRequest, User } from '../types';
import { icons } from '../constants';

interface ConnectionsScreenProps {
  connections: ConnectionRequest[];
  onConnectionAction: (connectionId: string, action: 'accept' | 'reject') => void; // Corrigido para string
  onUserClick: (user: User) => void;
  onBack: () => void;
}

const ConnectionRequestCard: React.FC<{ request: ConnectionRequest, onAccept: () => void, onReject: () => void, onUserClick: (user: User) => void }> = ({ request, onAccept, onReject, onUserClick }) => (
    <div className="bg-[#0d1b2a] rounded-2xl p-4 mb-4">
        <div className="flex items-center mb-3 cursor-pointer" onClick={() => onUserClick(request.user)}>
            <img src={request.user.avatar} alt={request.user.name} className="w-12 h-12 rounded-full object-cover mr-3"/>
            <div>
                <p className="font-bold text-white">{request.user.name}</p>
                <p className="text-xs text-gray-400">Solicitou uma conexão</p>
            </div>
        </div>
        <p className="text-sm text-gray-300 mb-4">"{request.interest_message}"</p> {/* Alterado para interest_message */}
        <div className="flex justify-end gap-2">
            <button onClick={onAccept} className="bg-green-600 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">Aceitar</button>
            <button onClick={onReject} className="bg-red-600 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">Recusar</button>
        </div>
    </div>
);


const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ connections, onConnectionAction, onUserClick, onBack }) => {
  const [query, setQuery] = useState('');

  const filteredConnections = connections.filter(c => c.user.name.toLowerCase().includes(query.toLowerCase()));
  
  return (
    <div className="w-full min-h-full bg-[#0B1526]">
      <header className="p-4 flex justify-between items-center">
        <div className="w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Conexões</h1>
        <button className="flex flex-col items-center text-white">
          {icons.search('w-6 h-6')}
          <span className="text-xs">Indicai</span>
        </button>
      </header>

      <main className="bg-white rounded-t-[2.5rem] p-4 mt-4">
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Pesquisar por nome..." 
            className="w-full bg-gray-100 text-gray-800 rounded-full py-3 pl-12 pr-4 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search('w-6 h-6')}
          </div>
        </div>
        
        {filteredConnections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConnections.map(req => (
                <ConnectionRequestCard 
                  key={req.id} 
                  request={req} 
                  onAccept={() => onConnectionAction(req.id, 'accept')} 
                  onReject={() => onConnectionAction(req.id, 'reject')}
                  onUserClick={onUserClick}
                />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma solicitação de conexão.</p>
        )}
      </main>
    </div>
  );
};

export default ConnectionsScreen;