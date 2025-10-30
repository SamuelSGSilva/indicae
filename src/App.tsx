import React, { useState, useEffect, useCallback } from 'react';
import { Screen, User, ConnectionRequest, Message, ChatThread } from '../types';
import { db } from '../db';
import BottomNav from '../components/BottomNav';
import UserProfileScreen from '../components/UserProfileScreen';
import SearchScreen from '../components/SearchScreen';
import ConnectionsScreen from '../components/ConnectionsScreen';
import MessagesScreen from '../components/MessagesScreen';
import ChatScreen from '../components/ChatScreen';
import CreateProfileScreen from '../components/CreateProfileScreen';
import LoginScreen from '../components/LoginScreen';
import RegistrationScreen from '../components/RegistrationScreen';
import SkillSearchScreen from './components/SkillSearchScreen';
import InitialScreen from './pages/InitialScreen';
import HomeScreen from './pages/HomeScreen';
import ToastProvider from './components/ToastProvider';
import { supabase } from './integrations/supabase/client';
import toast from 'react-hot-toast';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authFlowScreen, setAuthFlowScreen] = useState<'initial' | 'login' | 'register'>('initial');
  const [history, setHistory] = useState<Screen[]>([Screen.Initial]);
  const activeScreen = history[history.length - 1];
  const [chattingWith, setChattingWith] = useState<User | null>(null);

  // App-wide state from our DB (will be partially migrated to Supabase)
  const [users, setUsers] = useState<User[]>([]); // Now populated from Supabase
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]); // Now managed by Supabase
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Function to fetch all user profiles from Supabase
  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching all user profiles:', error);
      toast.error('Erro ao carregar usuários para busca.');
      return [];
    }

    const fetchedUsers: User[] = data.map((profile: any) => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      dob: profile.dob || '',
      city: profile.city || '',
      avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200/200`,
      education: profile.education || '',
      softSkills: profile.soft_skills || [],
      hardSkills: profile.hard_skills || [],
      email: '', // Email is not directly available from profiles table in this query
      // state is not available in Supabase profiles table, so it will be undefined
    }));
    setUsers(fetchedUsers);
    return fetchedUsers;
  }, []);

  // Function to fetch connection requests from Supabase
  const fetchConnections = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        interest_message,
        created_at,
        profiles!connection_requests_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          dob,
          city,
          education,
          soft_skills,
          hard_skills
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Erro ao carregar solicitações de conexão.');
      return [];
    }

    const fetchedConnections: ConnectionRequest[] = data.map((req: any) => {
      const senderProfile = req.profiles;
      return {
        id: req.id,
        sender_id: req.sender_id,
        receiver_id: req.receiver_id,
        status: req.status,
        interest_message: req.interest_message,
        created_at: req.created_at,
        user: { // Map sender profile to User type
          id: senderProfile.id,
          name: `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim(),
          avatar: senderProfile.avatar_url || `https://picsum.photos/seed/${senderProfile.id}/200/200`,
          dob: senderProfile.dob || '',
          city: senderProfile.city || '',
          education: senderProfile.education || '',
          softSkills: senderProfile.soft_skills || [],
          hardSkills: senderProfile.hard_skills || [],
          email: '', // Email is not directly available from profiles table in this query
        },
      };
    });
    setConnections(fetchedConnections);
    return fetchedConnections;
  }, []);

  // Initialize DB and check auth state
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
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
          setAuthFlowScreen('initial');
          setHistory([Screen.Initial]);
          return;
        }

        if (profile) {
          const user: User = {
            id: profile.id,
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
          setHistory([Screen.Home]);
          toast.success(`Bem-vindo(a), ${user.name}!`);
          fetchConnections(user.id); // Fetch connections for the current user
          fetchAllUsers(); // Fetch all users for search
        } else {
          console.warn('Supabase user authenticated but no profile found.');
          setIsAuthenticated(true);
          setCurrentUser({
            id: session.user.id,
            name: session.user.email || 'Usuário',
            dob: '', city: '', avatar: '', email: session.user.email || ''
          });
          setHistory([Screen.Home]);
          toast.warn('Seu perfil está incompleto. Por favor, edite-o.');
          fetchConnections(session.user.id); // Still try to fetch connections
          fetchAllUsers(); // Fetch all users for search
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthFlowScreen('initial');
        setHistory([Screen.Initial]);
        toast.dismiss();
        setConnections([]); // Clear connections on logout
        setUsers([]); // Clear users on logout
      }
    });

    // Load mock data for chats (these are not yet fully in Supabase)
    const data = db.initialize();
    setChats(data.chats);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchConnections, fetchAllUsers]); // Add fetchAllUsers to dependency array

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
      if (!currentUser) {
        toast.error('Usuário atual não encontrado para salvar o perfil.');
        return;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: updatedUser.name.split(' ')[0] || null,
            last_name: updatedUser.name.split(' ').slice(1).join(' ') || null,
            avatar_url: updatedUser.avatar || null,
            education: updatedUser.education || null,
            city: updatedUser.city || null,
            soft_skills: updatedUser.softSkills || [],
            hard_skills: updatedUser.hardSkills || [],
            dob: updatedUser.dob || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('Supabase Error updating profile:', error);
          toast.error(`Erro ao salvar perfil: ${error.message}`);
        } else {
          setCurrentUser(updatedUser);
          toast.success('Perfil salvo com sucesso!');
          handleBack();
          fetchAllUsers(); // Refresh all users after profile update
        }
      } catch (e: any) {
        console.error('Unexpected error during profile update:', e);
        toast.error(`Erro inesperado ao salvar perfil: ${e.message || 'Verifique o console.'}`);
      }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
      if (!currentUser) return;

      const { error } = await supabase
        .from('connection_requests')
        .update({ status: action })
        .eq('id', connectionId)
        .eq('receiver_id', currentUser.id); // Ensure only the receiver can update

      if (error) {
        console.error(`Error ${action}ing connection:`, error);
        toast.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} conexão.`);
      } else {
        toast.success(`Conexão ${action === 'accept' ? 'aceita' : 'recusada'} com sucesso!`);
        // Re-fetch connections to update the UI
        fetchConnections(currentUser.id);

        if (action === 'accept') {
          const acceptedConnection = connections.find(c => c.id === connectionId);
          if (acceptedConnection && !chats.some(c => c.contact.id === acceptedConnection.user.id)) {
            setChats(prev => [...prev, { id: Date.now().toString(), contact: acceptedConnection.user, messages: [] }]);
          }
        }
      }
  };
  
  const handleSendMessage = (chatPartnerId: string, text: string) => {
      if (!currentUser) return;

      const newId = Date.now().toString();
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
      setAuthFlowScreen('login');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao fazer logout.');
    } else {
      toast.success('Logout realizado com sucesso!');
      setHistory([Screen.Initial]);
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
      case Screen.Home:
        return currentUser ? <HomeScreen currentUser={currentUser} onNavigate={handleNavigate} /> : <div className="p-4 text-center">Carregando...</div>;
      case Screen.Search:
        return <SearchScreen users={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleStartChat} onBack={handleBack} onNavigate={handleNavigate} />;
      case Screen.Connections:
        return <ConnectionsScreen connections={connections} onConnectionAction={handleConnectionAction} onUserClick={handleStartChat} onBack={handleBack} />;
      case Screen.Messages:
          return <MessagesScreen chats={chats} onChatClick={handleStartChat} onBack={handleBack} />;
      case Screen.Profile:
        return currentUser ? <UserProfileScreen user={currentUser} onEdit={handleCreateProfile} onLogout={handleLogout} /> : <div className="p-4 text-center">Carregando perfil...</div>;
      case Screen.CreateProfile:
        return currentUser ? <CreateProfileScreen user={currentUser} onBack={handleBack} onSave={handleSaveProfile}/> : <div className="p-4 text-center">Carregando...</div>;
      case Screen.SkillSearch:
        return <SkillSearchScreen allUsers={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleStartChat} onBack={handleBack} />;
      default:
        return <HomeScreen currentUser={currentUser!} onNavigate={handleNavigate} />;
    }
  };
  
  const renderContent = () => {
      if (isAuthenticated === null) {
          return <div className="flex-1 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;
      }

      if (!isAuthenticated) {
          if (authFlowScreen === 'initial') {
              return <InitialScreen onNavigateToLogin={() => setAuthFlowScreen('login')} onNavigateToRegister={() => setAuthFlowScreen('register')} />;
          } else if (authFlowScreen === 'login') {
              return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setAuthFlowScreen('register')} />;
          }
          return <RegistrationScreen onRegister={handleRegister} onNavigateToLogin={() => setAuthFlowScreen('login')} />;
      }

      const isNavVisible = ![Screen.Chat, Screen.SkillSearch, Screen.Initial].includes(activeScreen);

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
        <ToastProvider />
        {renderContent()}
      </div>
    </div>
  );
};

export default App;