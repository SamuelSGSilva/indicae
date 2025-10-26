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
import ToastProvider from './components/ToastProvider'; // Import ToastProvider
import { supabase } from './integrations/supabase/client'; // Import Supabase client
import toast from 'react-hot-toast'; // Import toast for notifications

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [history, setHistory] = useState<Screen[]>([Screen.Search]);
  const activeScreen = history[history.length - 1];
  const [chattingWith, setChattingWith] = useState<User | null>(null);

  // App-wide state from our DB (will be partially migrated to Supabase)
  const [users, setUsers] = useState<User[]>([]); // Still used for mock users/connections
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Initialize DB and check auth state
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // User is authenticated via Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Erro ao carregar perfil.');
          setIsAuthenticated(false);
          setCurrentUser(null);
          return;
        }

        if (profile) {
          // Map Supabase profile to your User type
          const user: User = {
            id: profile.id, // Supabase user ID
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            dob: profile.dob || '',
            city: profile.city || '',
            avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200/200`,
            education: profile.education || '',
            softSkills: profile.soft_skills || [],
            hardSkills: profile.hard_skills || [],
            email: session.user.email || '',
          };
          setCurrentUser(user);
          setIsAuthenticated(true);
          toast.success(`Bem-vindo(a), ${user.name}!`);
        } else {
          // Profile not found, but user is authenticated. This might happen if the trigger failed.
          console.warn('Supabase user authenticated but no profile found.');
          setIsAuthenticated(true); // Still authenticated, but profile data is missing
          setCurrentUser({ // Create a basic user object from session
            id: session.user.id,
            name: session.user.email || 'Usuário',
            dob: '', city: '', avatar: '', email: session.user.email || ''
          });
          toast.warn('Seu perfil está incompleto. Por favor, edite-o.');
        }
      } else {
        // User is not authenticated
        setIsAuthenticated(false);
        setCurrentUser(null);
        toast.dismiss(); // Dismiss any lingering toasts
      }
    });

    // Load mock data for connections and chats (these are not yet in Supabase)
    const data = db.initialize();
    setUsers(data.users); // Keep mock users for search/connections for now
    setConnections(data.connections);
    setChats(data.chats);

    return () => {
      authListener.subscription.unsubscribe();
    };
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
  const handleSaveProfile = async (updatedUser: User) => {
      if (!currentUser) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updatedUser.name.split(' ')[0],
          last_name: updatedUser.name.split(' ').slice(1).join(' '),
          avatar_url: updatedUser.avatar,
          education: updatedUser.education,
          city: updatedUser.city,
          soft_skills: updatedUser.softSkills,
          hard_skills: updatedUser.hardSkills,
          dob: updatedUser.dob,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Erro ao salvar perfil.');
      } else {
        setCurrentUser(updatedUser); // Update local state
        toast.success('Perfil salvo com sucesso!');
        handleBack();
      }
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
  const handleLogin = async (email: string, password?: string) => {
    if (!password) {
      toast.error('Por favor, insira a senha.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      // Auth state change listener will handle setting isAuthenticated and currentUser
      toast.success('Login realizado com sucesso!');
    }
  };

  const handleRegister = async (userData: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => {
    const { name, email, password, dob, city } = userData;
    if (!password) {
      toast.error('Por favor, insira a senha.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          dob: dob,
          city: city,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      toast.success('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.');
      setAuthScreen('login');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao fazer logout.');
    } else {
      toast.success('Logout realizado com sucesso!');
      // Auth state change listener will handle setting isAuthenticated and currentUser
      setHistory([Screen.Search]); // Reset navigation
    }
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
        <ToastProvider /> {/* Add ToastProvider here */}
        {renderContent()}
      </div>
    </div>
  );
};

export default App;