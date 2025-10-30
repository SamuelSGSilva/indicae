import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Screen, User, ConnectionRequest, Message, ChatThread } from './types';
import { db } from './db';
import BottomNav from './components/BottomNav';
// Importações lazy para os componentes de tela
const UserProfileScreen = lazy(() => import('./components/UserProfileScreen'));
const SearchScreen = lazy(() => import('./components/SearchScreen'));
const ConnectionsScreen = lazy(() => import('./components/ConnectionsScreen'));
const MessagesScreen = lazy(() => import('./components/MessagesScreen'));
const ChatScreen = lazy(() => import('./components/ChatScreen'));
const CreateProfileScreen = lazy(() => import('./components/CreateProfileScreen'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const RegistrationScreen = lazy(() => import('./components/RegistrationScreen'));
const SkillSearchScreen = lazy(() => import('./components/SkillSearchScreen'));
const InitialScreen = lazy(() => import('./pages/InitialScreen'));
const HomeScreen = lazy(() => import('./pages/HomeScreen'));
const OtherUserProfileScreen = lazy(() => import('./components/OtherUserProfileScreen'));

import ToastProvider from './components/ToastProvider';
import { supabase } from './integrations/supabase/client';
import toast from 'react-hot-toast';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authFlowScreen, setAuthFlowScreen] = useState<'initial' | 'login' | 'register'>('initial');
  const [history, setHistory] = useState<Screen[]>([Screen.Initial]);
  const activeScreen = history[history.length - 1];
  const [viewingOtherUser, setViewingOtherUser] = useState<User | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);

  // App-wide state from our DB (will be partially migrated to Supabase)
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [sentConnectionRequests, setSentConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRequest[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Function to fetch all user profiles from Supabase
  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills');

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
      email: '',
    }));
    setUsers(fetchedUsers);
    return fetchedUsers;
  }, []);

  // Function to fetch connection requests from Supabase
  const fetchConnections = useCallback(async (userId: string) => {
    // Fetch incoming pending requests
    const { data: incomingRequests, error: incomingError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        interest_message,
        created_at,
        sender_profile:profiles!sender_id( // Usando o nome da coluna como referência para o join
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

    if (incomingError) {
      console.error('Error fetching incoming connection requests:', incomingError);
      toast.error('Erro ao carregar solicitações de conexão recebidas.');
      return;
    }

    const mappedIncomingRequests: ConnectionRequest[] = incomingRequests.map((req: any) => {
      const senderProfile = req.sender_profile;
      return {
        id: req.id,
        sender_id: req.sender_id,
        receiver_id: req.receiver_id,
        status: req.status,
        interest_message: req.interest_message,
        created_at: req.created_at,
        user: {
          id: senderProfile.id,
          name: `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim(),
          avatar: senderProfile.avatar_url || `https://picsum.photos/seed/${senderProfile.id}/200/200`,
          dob: senderProfile.dob || '',
          city: senderProfile.city || '',
          education: senderProfile.education || '',
          softSkills: senderProfile.soft_skills || [],
          hardSkills: senderProfile.hard_skills || [],
          email: '',
        },
      };
    });
    setConnections(mappedIncomingRequests);

    // Fetch sent pending requests
    const { data: sentRequests, error: sentError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        interest_message,
        created_at,
        receiver_profile:profiles!receiver_id( // Usando o nome da coluna como referência para o join
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
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) {
      console.error('Error fetching sent connection requests:', sentError);
      toast.error('Erro ao carregar solicitações de conexão enviadas.');
      return;
    }
    const mappedSentRequests: ConnectionRequest[] = sentRequests.map((req: any) => {
        const receiverProfile = req.receiver_profile;
        return {
            id: req.id,
            sender_id: req.sender_id,
            receiver_id: req.receiver_id,
            status: req.status,
            interest_message: req.interest_message,
            created_at: req.created_at,
            user: {
                id: receiverProfile.id,
                name: `${receiverProfile.first_name || ''} ${receiverProfile.last_name || ''}`.trim(),
                avatar: receiverProfile.avatar_url || `https://picsum.photos/seed/${receiverProfile.id}/200/200`,
                dob: receiverProfile.dob || '',
                city: receiverProfile.city || '',
                education: receiverProfile.education || '',
                softSkills: receiverProfile.soft_skills || [],
                hardSkills: receiverProfile.hard_skills || [],
                email: '',
            },
        };
    });
    setSentConnectionRequests(mappedSentRequests);

    // Fetch accepted connections (where current user is sender or receiver)
    const { data: acceptedConns, error: acceptedError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        interest_message,
        created_at,
        sender_profile:profiles!sender_id(
          id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills
        ),
        receiver_profile:profiles!receiver_id(
          id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills
        )
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (acceptedError) {
      console.error('Error fetching accepted connections:', acceptedError);
      toast.error('Erro ao carregar conexões aceitas.');
      return;
    }

    const mappedAcceptedConns: ConnectionRequest[] = acceptedConns.map((req: any) => {
        const otherProfile = req.sender_id === userId ? req.receiver_profile : req.sender_profile;
        return {
            id: req.id,
            sender_id: req.sender_id,
            receiver_id: req.receiver_id,
            status: req.status,
            interest_message: req.interest_message,
            created_at: req.created_at,
            user: {
                id: otherProfile.id,
                name: `${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`.trim(),
                avatar: otherProfile.avatar_url || `https://picsum.photos/seed/${otherProfile.id}/200/200`,
                dob: otherProfile.dob || '',
                city: otherProfile.city || '',
                education: otherProfile.education || '',
                softSkills: otherProfile.soft_skills || [],
                hardSkills: otherProfile.hard_skills || [],
                email: '',
            },
        };
    });
    setAcceptedConnections(mappedAcceptedConns);

  }, []);

  // Initialize DB and check auth state
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills')
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
          fetchConnections(user.id);
          fetchAllUsers();
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
          fetchConnections(session.user.id);
          fetchAllUsers();
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthFlowScreen('initial');
        setHistory([Screen.Initial]);
        toast.dismiss();
        setConnections([]);
        setUsers([]);
        setSentConnectionRequests([]);
        setAcceptedConnections([]);
      }
    });

    const data = db.initialize();
    setChats(data.chats);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchConnections, fetchAllUsers]);

  const handleNavigate = (screen: Screen) => {
    setViewingOtherUser(null);
    setChattingWith(null);
    setHistory(prev => [...prev, screen]);
  };

  const handleViewOtherUser = (user: User) => {
    setViewingOtherUser(user);
    handleNavigate(Screen.OtherUserProfile);
  };

  const handleStartChat = (user: User) => {
    setChattingWith(user);
    handleNavigate(Screen.Chat);
  };
  
  const handleCreateProfile = () => {
    handleNavigate(Screen.CreateProfile);
  }
  
  const handleBack = () => {
    setViewingOtherUser(null);
    setChattingWith(null);
    if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  }
  
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
          fetchAllUsers();
        }
      } catch (e: any) {
        console.error('Unexpected error during profile update:', e);
        toast.error(`Erro inesperado ao salvar perfil: ${e.message || 'Verifique o console.'}`);
      }
  };

  const handleSendConnectionRequest = async (receiverId: string, interestMessage: string) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para enviar solicitações de conexão.');
      return;
    }

    if (currentUser.id === receiverId) {
      toast.error('Você não pode enviar uma solicitação de conexão para si mesmo.');
      return;
    }

    const existingRequest = sentConnectionRequests.find(req => req.receiver_id === receiverId && req.status === 'pending');
    if (existingRequest) {
        toast.warn('Você já enviou uma solicitação de conexão para este usuário.');
        return;
    }

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          interest_message: interestMessage,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending connection request:', error);
        toast.error(`Erro ao enviar solicitação de conexão: ${error.message}`);
      } else {
        toast.success('Solicitação de conexão enviada com sucesso!');
        if (data) {
            const receiverUser = users.find(u => u.id === receiverId);
            if (receiverUser) {
                setSentConnectionRequests(prev => [...prev, {
                    ...data,
                    user: receiverUser
                }]);
            }
        }
        handleBack();
      }
    } catch (e: any) {
      console.error('Unexpected error during sending connection request:', e);
      toast.error(`Erro inesperado ao enviar solicitação: ${e.message || 'Verifique o console.'}`);
    }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
      if (!currentUser) return;

      try {
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: action })
          .eq('id', connectionId)
          .eq('receiver_id', currentUser.id);

        if (error) {
          console.error(`Error ${action}ing connection:`, error);
          toast.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} conexão.`);
        } else {
          toast.success(`Conexão ${action === 'accept' ? 'aceita' : 'recusada'} com sucesso!`);
          fetchConnections(currentUser.id);

          if (action === 'accept') {
            const acceptedConnection = connections.find(c => c.id === connectionId);
            if (acceptedConnection && !chats.some(c => c.contact.id === acceptedConnection.user.id)) {
              setChats(prev => [...prev, { id: Date.now().toString(), contact: acceptedConnection.user, messages: [] }]);
            }
          }
        }
      } catch (e: any) {
        console.error('Unexpected error during connection action:', e);
        toast.error(`Erro inesperado ao processar conexão: ${e.message || 'Verifique o console.'}`);
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
        return <SearchScreen users={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleViewOtherUser} onBack={handleBack} onNavigate={handleNavigate} />;
      case Screen.Connections:
        return <ConnectionsScreen connections={connections} onConnectionAction={handleConnectionAction} onUserClick={handleStartChat} onBack={handleBack} />;
      case Screen.Messages:
          return <MessagesScreen chats={chats} onChatClick={handleStartChat} onBack={handleBack} />;
      case Screen.Profile:
        return currentUser ? <UserProfileScreen user={currentUser} onEdit={handleCreateProfile} onLogout={handleLogout} /> : <div className="p-4 text-center">Carregando perfil...</div>;
      case Screen.CreateProfile:
        return currentUser ? <CreateProfileScreen user={currentUser} onBack={handleBack} onSave={handleSaveProfile}/> : <div className="p-4 text-center">Carregando...</div>;
      case Screen.SkillSearch:
        return <SkillSearchScreen allUsers={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleViewOtherUser} onBack={handleBack} />;
      case Screen.OtherUserProfile:
        if (!viewingOtherUser || !currentUser) return <div className="p-4 text-center">Carregando perfil...</div>;
        const isPending = sentConnectionRequests.some(req => req.receiver_id === viewingOtherUser.id && req.status === 'pending');
        const isConnected = acceptedConnections.some(conn => 
            (conn.sender_id === currentUser.id && conn.receiver_id === viewingOtherUser.id) ||
            (conn.receiver_id === currentUser.id && conn.sender_id === viewingOtherUser.id)
        );
        return <OtherUserProfileScreen 
                  user={viewingOtherUser} 
                  onBack={handleBack} 
                  onSendConnectionRequest={handleSendConnectionRequest}
                  isConnectionPending={isPending}
                  isConnected={isConnected}
               />;
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

      const isNavVisible = ![Screen.Chat, Screen.SkillSearch, Screen.Initial, Screen.OtherUserProfile].includes(activeScreen);

      return (
          <>
            <div className={`flex-1 overflow-y-auto ${!isNavVisible ? '' : 'pb-20'}`}>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-white">Carregando tela...</p></div>}>
                {renderScreen()}
              </Suspense>
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