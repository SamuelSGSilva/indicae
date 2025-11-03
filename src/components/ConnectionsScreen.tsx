import React, { useState, useEffect } from 'react';
import { ConnectionRequest, User } from '../types';
import { icons } from '../constants';

interface ConnectionsScreenProps {
  connections: ConnectionRequest[]; // Incoming pending requests
  acceptedConnections: ConnectionRequest[]; // Accepted connections
  onConnectionAction: (connectionId: string, action: 'accept' | 'reject') => void;
  onUserClick: (user: User) => void; // Used for starting chat with accepted connections
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
        <p className="text-sm text-gray-300 mb-4">"{request.interest_message}"</p>
        <div className="flex justify-end gap-2">
            <button onClick={onAccept} className="bg-green-600 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">Aceitar</button>
            <button onClick={onReject} className="bg-red-600 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">Recusar</button>
        </div>
    </div>
);

const ConnectedUserCard: React.FC<{ user: User, onChatClick: (user: User) => void }> = ({ user, onChatClick }) => (
  <div className="bg-[#0d1b2a] rounded-2xl p-4 mb-4 flex items-center justify-between">
    <div className="flex items-center cursor-pointer" onClick={() => onChatClick(user)}>
      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover mr-3"/>
      <div>
        <p className="font-bold text-white">{user.name}</p>
        <p className="text-xs text-gray-400">{user.city}</p>
      </div>
    </div>
    <button onClick={() => onChatClick(user)} className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition-colors">
      {icons.messages('w-5 h-5')}
    </button>
  </div>
);

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ connections, acceptedConnections, onConnectionAction, onUserClick, onBack }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'connected'>('requests');

  useEffect(() => {
    console.log("ConnectionsScreen: Prop 'connections' (solicitações pendentes) recebida:", connections);
    console.log("ConnectionsScreen: Prop 'acceptedConnections' (conexões aceitas) recebida:", acceptedConnections);
  }, [connections, acceptedConnections]);

  const filteredRequests = connections.filter(c => c.user.name.toLowerCase().includes(query.toLowerCase()));
  const filteredConnectedUsers = acceptedConnections.filter(c => c.user.name.toLowerCase().includes(query.toLowerCase()));
  
  console.log("ConnectionsScreen: Usuários conectados filtrados:", filteredConnectedUsers);

  return (
    <div className="w-full min-h-full bg-[#0B1526] flex flex-col">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <div className="w-6 h-6" />
        <h1 className="text-xl font-bold text-white">Conexões</h1>
        <div className="w-6 h-6" />
      </header>

      <main className="bg-white rounded-t-[2.5rem] p-4 mt-4 flex-grow overflow-y-auto">
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

        <div className="flex justify-around border-b border-gray-200 mb-4">
          <button 
            onClick={() => setActiveTab('requests')} 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'requests' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Solicitações ({connections.length})
          </button>
          <button 
            onClick={() => setActiveTab('connected')} 
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'connected' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Conexões ({acceptedConnections.length})
          </button>
        </div>
        
        {activeTab === 'requests' ? (
          filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map(req => (
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
            <p className="text-center text-gray-500 py-8">Nenhuma solicitação de conexão pendente.</p>
          )
        ) : (
          filteredConnectedUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredConnectedUsers.map(conn => (
                  <ConnectedUserCard 
                    key={conn.id} 
                    user={conn.user} 
                    onChatClick={onUserClick} // onUserClick agora inicia o chat
                  />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhuma conexão aceita ainda.</p>
          )
        )}
      </main>
    </div>
  );
};

export default ConnectionsScreen;