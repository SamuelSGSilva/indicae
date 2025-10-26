import React, { useState, useEffect } from 'react';
import { Screen, User, ConnectionRequest, Message, ChatThread } from './types';
import { db } from './db';
import BottomNav from './components/BottomNav';
import UserProfileScreen from './components/UserProfileScreen';
import SearchScreen from './components/SearchScreen';
import ConnectionsScreen from './components/ConnectionsScreen';
import MessagesScreen from './components/MessagesScreen';
import ChatScreen from './components/ChatScreen';
import CreateProfileScreen from './components/CreateProfileScreen';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [history, setHistory] = useState<Screen[]>([Screen.Search]);
  const activeScreen = history[history.length - 1];
  const [chattingWith, setChattingWith] = useState<User | null>(null);

  // App-wide state from our DB
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Initialize DB and check auth state
  useEffect(() => {
    const data = db.initialize();
    setUsers(data.users);
    const userFromDb = data.users.find(u => u.id === data.currentUserId) || null;
    if (userFromDb) {
      setCurrentUser(userFromDb);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setConnections(data.connections);
    setChats(data.chats);
  }, []);

  const handleNavigate = (screen: Screen) => {
    setChattingWith(null);
    setHistory(prev => [...prev, screen]);
  };

  const handleStartChat = (user: User) => {
    setChattingWith(user);
    handleNavigate(Screen.Chat);
  };
  
  const handleCreateProfile = () => {
    handleNavigate(Screen.CreateProfile);
  }
  
  const handleBack = () => {
    setChattingWith(null);
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  }
  
  // Data modification handlers
  const handleSaveProfile = (updatedUser: User) => {
      db.updateUser(updatedUser);
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setCurrentUser(updatedUser);
      handleBack();
  };

  const handleConnectionAction = (connectionId: number, action: 'accept' | 'reject') => {
      db.handleConnection(connectionId, action);
      if (action === 'accept') {
        const conn = connections.find(c => c.id === connectionId);
        if (conn && !chats.some(c => c.contact.id === conn.user.id)) {
          setChats(prev => [...prev, { id: Date.now(), contact: conn.user, messages: [] }]);
        }
      }
      setConnections(prev => prev.filter(c => c.id !== connectionId));
  };
  
  const handleSendMessage = (chatPartnerId: number, text: string) => {
      if (!currentUser) return;

      const newId = Date.now();
      const newMessage: Message = {
          id: newId,
          text,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          senderId: currentUser.id,
          avatar: currentUser.avatar
      };
      
      db.addMessage(chatPartnerId, newMessage);
      
      setChats(prevChats => {
          const newChats = [...prevChats];
          const chatIndex = newChats.findIndex(c => c.contact.id === chatPartnerId);
          if (chatIndex > -1) {
              newChats[chatIndex].messages = [...newChats[chatIndex].messages, newMessage];
          } else {
              const partner = users.find(u => u.id === chatPartnerId);
              if (partner) {
                newChats.push({ id: newId, contact: partner, messages: [newMessage] });
              }
          }
          return newChats;
      });
  };

  // Auth Handlers
  const handleLogin = (email: string, password?: string) => {
    const userExists = db.getUserByEmail(email);

    if (!userExists) {
      alert('Email não encontrado. Por favor, verifique o email ou cadastre-se.');
      return;
    }

    const loggedInUser = db.login(email, password);

    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta. Por favor, tente novamente.');
    }
  };


  // FIX: Updated the type of userData to make the 'avatar' property optional, aligning it with the registration logic.
  const handleRegister = (userData: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => {
    const newUser = db.register(userData);
    if (newUser) {
      setUsers(prev => [...prev, newUser]);
      alert('Cadastro realizado com sucesso! Faça o login para continuar.');
      setAuthScreen('login');
    } else {
      alert('Este email já está em uso.');
    }
  };

  const handleLogout = () => {
    db.setCurrentUserId(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setHistory([Screen.Search]); // Reset navigation
  };


  const renderScreen = () => {
    if (chattingWith && activeScreen === Screen.Chat && currentUser) {
      const chat = chats.find(c => c.contact.id === chattingWith.id);
      return <ChatScreen 
                user={chattingWith} 
                messages={chat?.messages || []} 
                onBack={handleBack} 
                onSendMessage={(text) => handleSendMessage(chattingWith.id, text)} 
                currentUserId={currentUser.id}
             />;
    }
    
    switch (activeScreen) {
      case Screen.Search:
        return <SearchScreen users={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleStartChat} onBack={handleBack} />;
      case Screen.Connections:
        return <ConnectionsScreen connections={connections} onConnectionAction={handleConnectionAction} onUserClick={handleStartChat} onBack={handleBack} />;
      case Screen.Messages:
          return <MessagesScreen chats={chats} onChatClick={handleStartChat} onBack={handleBack} />;
      case Screen.Profile:
        return currentUser ? <UserProfileScreen user={currentUser} onEdit={handleCreateProfile} onLogout={handleLogout} /> : <div className="p-4 text-center">Carregando perfil...</div>;
      case Screen.CreateProfile:
        return currentUser ? <CreateProfileScreen user={currentUser} onBack={handleBack} onSave={handleSaveProfile}/> : <div className="p-4 text-center">Carregando...</div>;
      default:
        return <SearchScreen users={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleStartChat} onBack={handleBack} />;
    }
  };
  
  const renderContent = () => {
      if (isAuthenticated === null) {
          return <div className="flex-1 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;
      }

      if (!isAuthenticated) {
          if (authScreen === 'login') {
              return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setAuthScreen('register')} />;
          }
          return <RegistrationScreen onRegister={handleRegister} onNavigateToLogin={() => setAuthScreen('login')} />;
      }

      const isNavVisible = ![Screen.Chat].includes(activeScreen);

      return (
          <>
            <div className={`flex-1 overflow-y-auto ${!isNavVisible ? '' : 'pb-20'}`}>
              {renderScreen()}
            </div>
            {isNavVisible && <BottomNav activeScreen={activeScreen} onNavigate={(s) => setHistory([s])} />}
          </>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen font-sans bg-gray-900">
      <div className="relative w-full max-w-sm h-[850px] bg-[#0B1526] text-white shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;