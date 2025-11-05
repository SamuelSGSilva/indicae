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
// Importação da nova modal
import OtherUserProfileModal from './components/OtherUserProfileModal';
import ProfileMenu from './components/ProfileMenu'; // Import the new menu

import ToastProvider from './components/ToastProvider';
import { supabase } from './integrations/supabase/client';
import toast from 'react-hot-toast';

console.log("App.tsx: Componente App carregado no arquivo.");

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  console.log("App component rendering...");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authFlowScreen, setAuthFlowScreen] = useState<'initial' | 'login' | 'register'>('initial');
  const [history, setHistory] = useState<Screen[]>([Screen.Initial]);
  const activeScreen = history[history.length - 1];
  const [viewingOtherUser, setViewingOtherUser] = useState<User | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  // App-wide state from our DB (will be partially migrated to Supabase)
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [sentConnectionRequests, setSentConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRequest[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Function to fetch all user profiles from Supabase
  const fetchAllUsers = useCallback(async () => {
    console.log("fetchAllUsers: Iniciando busca de todos os perfis de usuário.");
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills');

    if (error) {
      console.error('fetchAllUsers: Erro ao buscar todos os perfis de usuário:', error);
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
    console.log("fetchAllUsers: Perfis de usuário carregados:", fetchedUsers);
    return fetchedUsers;
  }, []);

  // Function to fetch connection requests from Supabase
  const fetchConnections = useCallback(async (userId: string) => {
    console.log("fetchConnections: Iniciando busca de conexões para userId:", userId);

    // 1. Fetch all raw connection requests in parallel
    const [
      { data: rawIncomingRequests, error: incomingError },
      { data: rawSentRequests, error: sentError },
      { data: rawAcceptedConns, error: acceptedError },
    ] = await Promise.all([
      supabase
        .from('connection_requests')
        .select(`id, sender_id, receiver_id, status, interest_message, created_at`)
        .eq('receiver_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('connection_requests')
        .select(`id, sender_id, receiver_id, status, interest_message, created_at`)
        .eq('sender_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('connection_requests')
        .select(`id, sender_id, receiver_id, status, interest_message, created_at`)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    ]);

    if (incomingError) {
      console.error('fetchConnections: Erro ao buscar solicitações de conexão recebidas:', incomingError);
      toast.error('Erro ao carregar solicitações de conexão recebidas.');
    }
    if (sentError) {
      console.error('fetchConnections: Erro ao buscar solicitações de conexão enviadas:', sentError);
      toast.error('Erro ao carregar solicitações de conexão enviadas.');
    }
    if (acceptedError) {
      console.error('fetchConnections: Erro ao buscar conexões aceitas:', acceptedError);
      toast.error('Erro ao carregar conexões aceitas.');
    }

    // 2. Collect all unique user IDs involved in these requests
    const allRelatedUserIds = new Set<string>();
    rawIncomingRequests?.forEach(req => allRelatedUserIds.add(req.sender_id));
    rawSentRequests?.forEach(req => allRelatedUserIds.add(req.receiver_id));
    rawAcceptedConns?.forEach(req => {
      allRelatedUserIds.add(req.sender_id);
      allRelatedUserIds.add(req.receiver_id);
    });
    allRelatedUserIds.delete(userId); // Remove current user's ID as their profile is already known

    const uniqueProfileIds = Array.from(allRelatedUserIds);
    console.log("fetchConnections: IDs de perfis únicos a serem buscados:", uniqueProfileIds);

    // 3. Fetch all unique profiles in a single query
    let profilesMap = new Map<string, User>();
    if (uniqueProfileIds.length > 0) {
      const { data: fetchedProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills')
        .in('id', uniqueProfileIds);

      if (profilesError) {
        console.error('fetchConnections: Erro ao buscar perfis em lote:', profilesError);
        toast.error('Erro ao carregar perfis de usuários relacionados.');
      } else {
        fetchedProfiles?.forEach((profile: any) => {
          profilesMap.set(profile.id, {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            dob: profile.dob || '',
            city: profile.city || '',
            avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/200/200`,
            education: profile.education || '',
            softSkills: profile.soft_skills || [],
            hardSkills: profile.hard_skills || [],
            email: '', // Email is not in profiles table, will be empty
          });
        });
        console.log("fetchConnections: Perfis em lote carregados e mapeados:", profilesMap);
      }
    }

    // Helper to map raw request to ConnectionRequest with user profile
    const mapRequestToConnection = (req: any, isSender: boolean): ConnectionRequest => {
      const otherUserId = isSender ? req.receiver_id : req.sender_id;
      const userProfile = profilesMap.get(otherUserId) || {
        id: otherUserId,
        name: 'Usuário Desconhecido',
        avatar: '', dob: '', city: '', email: ''
      };
      return {
        id: req.id,
        sender_id: req.sender_id,
        receiver_id: req.receiver_id,
        status: req.status,
        interest_message: req.interest_message,
        created_at: req.created_at,
        user: userProfile,
      };
    };

    // 4. Map raw requests to state variables using the profilesMap
    const mappedIncomingRequests: ConnectionRequest[] = rawIncomingRequests?.map(req => mapRequestToConnection(req, false)) || [];
    setConnections(mappedIncomingRequests);
    console.log("fetchConnections: Solicitações pendentes mapeadas e definidas no estado 'connections':", mappedIncomingRequests);

    const mappedSentRequests: ConnectionRequest[] = rawSentRequests?.map(req => mapRequestToConnection(req, true)) || [];
    setSentConnectionRequests(mappedSentRequests);
    console.log("fetchConnections: Solicitações enviadas mapeadas e definidas no estado 'sentConnectionRequests':", mappedSentRequests);

    const mappedAcceptedConns: ConnectionRequest[] = rawAcceptedConns?.map(req => mapRequestToConnection(req, req.sender_id === userId)) || [];
    setAcceptedConnections(mappedAcceptedConns);
    console.log("fetchConnections: Conexões aceitas mapeadas e definidas no estado 'acceptedConnections':", mappedAcceptedConns);
  }, []);

  // Function to fetch messages for a specific chat partner
  const fetchMessages = useCallback(async (currentUserId: string, chatPartnerId: string) => {
    console.log(`fetchMessages: Buscando mensagens entre ${currentUserId} e ${chatPartnerId}`);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${chatPartnerId}),and(sender_id.eq.${chatPartnerId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('fetchMessages: Erro ao buscar mensagens:', error);
      return [];
    }
    console.log(`fetchMessages: Mensagens brutas encontradas do Supabase:`, data);

    const mappedMessages: Message[] = data.map((msg: any) => ({
      id: msg.id,
      text: msg.content,
      time: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      senderId: msg.sender_id,
      avatar: users.find(u => u.id === msg.sender_id)?.avatar || '', // Get sender's avatar from users state
    }));
    console.log(`fetchMessages: Mensagens mapeadas para o estado:`, mappedMessages);
    return mappedMessages;
  }, [users]);

  // Initialize DB and check auth state
  useEffect(() => {
    console.log("App useEffect: Inicializando listener de autenticação e buscas de dados.");
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("onAuthStateChange: Evento:", event, "Sessão:", session);
      if (session) {
        console.log('onAuthStateChange: Session existe, buscando perfil para user.id:', session.user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, dob, city, education, soft_skills, hard_skills')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('onAuthStateChange: Erro ao buscar perfil:', error);
          toast.error('Erro ao carregar perfil.');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setAuthFlowScreen('initial');
          setHistory([Screen.Initial]);
          console.log('onAuthStateChange: Erro na busca do perfil, isAuthenticated setado para false.');
          return;
        }

        if (profile) {
          console.log('onAuthStateChange: Perfil encontrado:', profile);
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
          await Promise.all([
            fetchConnections(user.id),
            fetchAllUsers()
          ]);
          console.log('onAuthStateChange: Usuário autenticado e perfil carregado com sucesso.');
        } else {
          console.warn('onAuthStateChange: Usuário Supabase autenticado, mas nenhum perfil encontrado no banco de dados.');
          setIsAuthenticated(true);
          setCurrentUser({
            id: session.user.id,
            name: session.user.email || 'Usuário',
            dob: '', city: '', avatar: '', email: session.user.email || ''
          });
          setHistory([Screen.Home]);
          toast.warn('Seu perfil está incompleto. Por favor, edite-o.');
          await Promise.all([
            fetchConnections(session.user.id),
            fetchAllUsers()
          ]);
          console.log('onAuthStateChange: Usuário autenticado, perfil genérico carregado.');
        }
      } else {
        console.log("onAuthStateChange: Usuário desautenticado.");
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthFlowScreen('initial');
        setHistory([Screen.Initial]);
        toast.dismiss();
        setConnections([]);
        setUsers([]);
        setSentConnectionRequests([]);
        setAcceptedConnections([]);
        setChats([]);
        console.log('onAuthStateChange: Usuário deslogado.');
      }
    });

    const data = db.initialize();

    return () => {
      console.log('Realtime: Desinscrevendo-se do canal de mensagens.');
      authListener.subscription.unsubscribe();
    };
  }, [fetchConnections, fetchAllUsers]);

  // Effect to load real messages for accepted connections
  useEffect(() => {
    if (currentUser && acceptedConnections.length > 0 && users.length > 0) {
      console.log("useEffect (loadAllChats): Iniciando carregamento de chats para conexões aceitas.");
      const loadAllChats = async () => {
        const chatThreads: ChatThread[] = [];
        for (const conn of acceptedConnections) {
          const chatPartner = conn.user;
          const messages = await fetchMessages(currentUser.id, chatPartner.id);
          chatThreads.push({
            id: conn.id, // Using connection ID as chat thread ID for simplicity
            contact: chatPartner,
            messages: messages,
          });
        }
        setChats(chatThreads);
        console.log("useEffect (loadAllChats): Chats carregados do Supabase:", chatThreads);
      };
      loadAllChats();
    } else if (currentUser && acceptedConnections.length === 0) {
      console.log("useEffect (loadAllChats): Nenhuma conexão aceita, limpando chats.");
      setChats([]); // No accepted connections, no chats
    }
  }, [currentUser, acceptedConnections, users, fetchMessages]);


  // Real-time subscription for new messages
  useEffect(() => {
    if (!currentUser) {
      console.log("Realtime: currentUser não disponível, pulando inscrição de mensagens.");
      return;
    }

    console.log(`Realtime: Inscrevendo-se em mensagens para o usuário: ${currentUser.id}`);
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUser.id}.or.receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Realtime: Nova mensagem recebida!', payload);
          const newMessageData = payload.new as any;
          const sender = users.find(u => u.id === newMessageData.sender_id);
          const receiver = users.find(u => u.id === newMessageData.receiver_id);

          if (!sender || !receiver) {
            console.warn('Realtime: Perfil do remetente ou destinatário não encontrado para nova mensagem:', newMessageData);
            return;
          }

          const chatPartnerId = newMessageData.sender_id === currentUser.id ? newMessageData.receiver_id : newMessageData.sender_id;
          const chatPartner = chatPartnerId === sender.id ? sender : receiver;

          const realMessage: Message = {
            id: newMessageData.id,
            text: newMessageData.content,
            time: new Date(newMessageData.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            senderId: newMessageData.sender_id,
            avatar: (newMessageData.sender_id === currentUser.id ? currentUser.avatar : chatPartner.avatar) || '',
          };
          console.log("Realtime: Mensagem real construída:", realMessage);

          setChats(prevChats => {
            const newChats = [...prevChats];
            const chatIndex = newChats.findIndex(c => c.contact.id === chatPartnerId);

            if (chatIndex > -1) {
              let messagesInThread = newChats[chatIndex].messages;

              // 1. Filter out any optimistic message that matches the content and sender of the real message
              // This is a heuristic to remove the temporary message that corresponds to the real one
              messagesInThread = messagesInThread.filter(msg =>
                !(msg.id.startsWith('temp-') && msg.senderId === realMessage.senderId && msg.text === realMessage.text)
              );

              // 2. Add the real message if it's not already present (by its actual Supabase ID)
              if (!messagesInThread.some(msg => msg.id === realMessage.id)) {
                newChats[chatIndex].messages = [...messagesInThread, realMessage];
                console.log("Realtime: Nova mensagem adicionada ao chat existente (após remover otimista):", realMessage);
              } else {
                console.log("Realtime: Mensagem já existe no chat (real), ignorando duplicação.");
              }
            } else {
              // Create a new chat if it doesn't exist (e.g., first message from a new contact)
              newChats.push({
                id: chatPartnerId,
                contact: chatPartner,
                messages: [realMessage],
              });
              console.log("Realtime: Novo chat criado com a mensagem:", realMessage);
            }
            return newChats;
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Realtime: Desinscrevendo-se do canal de mensagens.');
      supabase.removeChannel(channel);
    };
  }, [currentUser, users]);

  // Real-time subscription for connection updates
  useEffect(() => {
    if (!currentUser) {
      console.log("Realtime: currentUser não disponível, pulando inscrição de conexões.");
      return;
    }

    console.log(`Realtime: Inscrevendo-se em atualizações de conexões para o usuário: ${currentUser.id}`);
    const connectionsChannel = supabase
      .channel('connection_requests_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connection_requests',
          filter: `sender_id=eq.${currentUser.id}`, // Ouve atualizações em solicitações que ENVIEI
        },
        async (payload) => {
          console.log('Realtime: Atualização de status de conexão recebida!', payload);
          const updatedRequest = payload.new as any;

          if (updatedRequest.status === 'accepted' && updatedRequest.sender_id === currentUser.id) {
            const acceptor = users.find(u => u.id === updatedRequest.receiver_id);
            const acceptorName = acceptor ? acceptor.name : 'Alguém';
            toast.success(`${acceptorName} aceitou sua solicitação de conexão!`);

            // Refetch all connection data to ensure UI is up-to-date
            await fetchConnections(currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Realtime: Desinscrevendo-se do canal de atualizações de conexões.');
      supabase.removeChannel(connectionsChannel);
    };
  }, [currentUser, users, fetchConnections]);

  const handleNavigate = (screen: Screen) => {
    console.log("handleNavigate: Navegando para a tela:", screen);
    setViewingOtherUser(null);
    // Só limpa chattingWith se NÃO estivermos navegando para a tela de chat
    if (screen !== Screen.Chat) {
      setChattingWith(null);
    }
    setHistory(prev => [...prev, screen]);
  };

  const handleViewOtherUser = useCallback((user: User) => {
    console.log("handleViewOtherUser: Visualizando perfil do usuário:", user.name);
    setViewingOtherUser(user);
  }, []);

  const handleStartChat = (user: User) => {
    console.log("handleStartChat: Iniciando chat com:", user.name);
    setChattingWith(user);
    handleNavigate(Screen.Chat);
  };
  
  const handleCreateProfile = () => {
    console.log("handleCreateProfile: Navegando para a tela de criação de perfil.");
    handleNavigate(Screen.CreateProfile);
  }
  
  const handleBack = () => {
    console.log("handleBack: Voltando na navegação.");
    if (viewingOtherUser) {
      setViewingOtherUser(null);
      console.log("handleBack: Limpando viewingOtherUser.");
    } else if (history.length > 1) {
      setChattingWith(null); 
      setHistory(prev => prev.slice(0, -1));
      console.log("handleBack: Voltando para a tela anterior, histórico atual:", history.slice(0, -1));
    } else {
      console.log("handleBack: Não há mais telas para voltar.");
    }
  }
  
  const handleSaveProfile = async (updatedUser: User) => {
      if (!currentUser) {
        toast.error('Usuário atual não encontrado para salvar o perfil.');
        return;
      }
      console.log("handleSaveProfile: Tentando salvar perfil para:", updatedUser.name);

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
          console.error('handleSaveProfile: Erro do Supabase ao atualizar perfil:', error);
          toast.error(`Erro ao salvar perfil: ${error.message}`);
        } else {
          console.log('handleSaveProfile: Perfil salvo com sucesso no Supabase.');
          setCurrentUser(updatedUser);
          toast.success('Perfil salvo com sucesso!');
          handleBack();
          fetchAllUsers();
        }
      } catch (e: any) {
        console.error('handleSaveProfile: Erro inesperado ao salvar perfil:', e);
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

    console.log('handleSendConnectionRequest: Tentando enviar solicitação de conexão com:', {
      sender_id: currentUser.id,
      receiver_id: receiverId,
      interest_message: interestMessage,
      status: 'pending',
    });

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
        console.error('handleSendConnectionRequest: Erro ao enviar solicitação de conexão:', error);
        toast.error(`Erro ao enviar solicitação de conexão: ${error.message}`);
      } else {
        console.log('handleSendConnectionRequest: Solicitação de conexão enviada com sucesso:', data);
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
        setViewingOtherUser(null);
        fetchConnections(currentUser.id);
      }
    } catch (e: any) {
      console.error('handleSendConnectionRequest: Erro inesperado ao enviar solicitação de conexão:', e);
      toast.error(`Erro inesperado ao enviar solicitação: ${e.message || 'Verifique o console.'}`);
    }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
      if (!currentUser) {
        console.error('handleConnectionAction: currentUser não definido.');
        toast.error('Usuário não autenticado.');
        return;
      }

      try {
        console.log(`handleConnectionAction: Tentando ${action} conexão ${connectionId} para receiver_id ${currentUser.id}`);
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        const { data, error } = await supabase
          .from('connection_requests')
          .update({ status: newStatus })
          .eq('id', connectionId)
          .eq('receiver_id', currentUser.id)
          .select();

        if (error) {
          console.error(`handleConnectionAction: Erro ao ${action} conexão:`, error);
          if (error.details) console.error('Supabase Error Details:', error.details);
          if (error.hint) console.error('Supabase Error Hint:', error.hint);
          toast.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} conexão: ${error.message}`);
        } else {
          if (!data || data.length === 0) {
            console.warn(`handleConnectionAction: Nenhuma conexão encontrada ou atualizada para id ${connectionId} e receiver_id ${currentUser.id}.`);
            toast.error('Não foi possível encontrar ou atualizar a solicitação de conexão. Verifique se você é o destinatário.');
            return;
          }

          console.log(`handleConnectionAction: Conexão ${action} com sucesso. Dados atualizados do Supabase:`, data);
          toast.success(`Conexão ${action === 'accept' ? 'aceita' : 'recusada'} com sucesso!`);
          await fetchConnections(currentUser.id);

          if (action === 'accept') {
            const acceptedConnection = connections.find(c => c.id === connectionId);
            if (acceptedConnection && !chats.some(c => c.contact.id === acceptedConnection.user.id)) {
              const messages = await fetchMessages(currentUser.id, acceptedConnection.user.id);
              setChats(prev => [...prev, { id: acceptedConnection.id, contact: acceptedConnection.user, messages: messages }]);
              console.log("handleConnectionAction: Novo chat adicionado após aceitar conexão:", acceptedConnection.user.name);
            }
          }
        }
      } catch (e: any) {
        console.error('handleConnectionAction: Erro inesperado durante a ação de conexão:', e);
        toast.error(`Erro inesperado ao processar conexão: ${e.message || 'Verifique o console.'}`);
      }
  };
  
  const handleSendMessage = async (chatPartnerId: string, text: string) => {
      if (!currentUser) {
        toast.error('Você precisa estar logado para enviar mensagens.');
        return;
      }
      console.log(`handleSendMessage: Tentando enviar mensagem para ${chatPartnerId}: "${text}"`);

      const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const optimisticMessage: Message = {
          id: tempMessageId,
          text: text,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          senderId: currentUser.id,
          avatar: currentUser.avatar,
      };

      // Optimistic update
      setChats(prevChats => {
          const newChats = [...prevChats];
          const chatIndex = newChats.findIndex(c => c.contact.id === chatPartnerId);
          if (chatIndex > -1) {
              newChats[chatIndex].messages = [...newChats[chatIndex].messages, optimisticMessage];
          } else {
              // This case should ideally not happen if chat threads are pre-loaded for accepted connections
              const partner = users.find(u => u.id === chatPartnerId);
              if (partner) {
                newChats.push({ id: chatPartnerId, contact: partner, messages: [optimisticMessage] });
              }
          }
          return newChats;
      });

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUser.id,
            receiver_id: chatPartnerId,
            content: text,
          })
          .select()
          .single();

        if (error) {
          console.error('handleSendMessage: Erro ao enviar mensagem:', error);
          toast.error(`Erro ao enviar mensagem: ${error.message}`);
          // Rollback optimistic update on error
          setChats(prevChats => {
              const newChats = [...prevChats];
              const chatIndex = newChats.findIndex(c => c.contact.id === chatPartnerId);
              if (chatIndex > -1) {
                  newChats[chatIndex].messages = newChats[chatIndex].messages.filter(msg => msg.id !== tempMessageId);
              }
              return newChats;
          });
        } else {
          console.log('handleSendMessage: Mensagem enviada com sucesso para Supabase:', data);
          // The real-time listener will handle replacing the optimistic message
          // or adding it if it's a new chat.
        }
      } catch (e: any) {
        console.error('handleSendMessage: Erro inesperado ao enviar mensagem:', e);
        toast.error(`Erro inesperado ao enviar mensagem: ${e.message || 'Verifique o console.'}`);
        // Rollback optimistic update on unexpected error
        setChats(prevChats => {
            const newChats = [...prevChats];
            const chatIndex = newChats.findIndex(c => c.contact.id === chatPartnerId);
            if (chatIndex > -1) {
                newChats[chatIndex].messages = newChats[chatIndex].messages.filter(msg => msg.id !== tempMessageId);
            }
            return newChats;
        });
      }
  };

  const handleLogin = async (email: string, password?: string) => {
    if (!password) {
      toast.error('Por favor, insira a senha.');
      return;
    }
    console.log("handleLogin: Tentando login para:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("handleLogin: Erro de login:", error.message);
      toast.error(error.message);
    } else {
      console.log("handleLogin: Login realizado com sucesso.");
      toast.success('Login realizado com sucesso!');
    }
  };

  const handleRegister = async (userData: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => {
    const { name, email, password, dob, city } = userData;
    if (!password) {
      toast.error('Por favor, insira a senha.');
      return;
    }
    console.log("handleRegister: Tentando registrar usuário:", email);

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
      console.error("handleRegister: Erro de registro:", error.message);
      toast.error(error.message);
    } else if (data.user) {
      console.log("handleRegister: Registro realizado com sucesso, usuário:", data.user);
      toast.success('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.');
      setAuthFlowScreen('login');
    }
  };

  const handleLogout = async () => {
    console.log("handleLogout: Tentando fazer logout.");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("handleLogout: Erro ao fazer logout:", error.message);
      toast.error('Erro ao fazer logout.');
    } else {
      console.log("handleLogout: Logout realizado com sucesso.");
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
        const connectedUserIds = new Set(acceptedConnections.map(c => c.user.id));
        const searchableUsers = users.filter(u => u.id !== currentUser?.id && !connectedUserIds.has(u.id));
        return <SearchScreen users={searchableUsers} onUserClick={handleViewOtherUser} onBack={handleBack} onNavigate={handleNavigate} />;
      case Screen.Connections:
        return <ConnectionsScreen 
                  connections={connections} 
                  acceptedConnections={acceptedConnections}
                  onConnectionAction={handleConnectionAction} 
                  onUserClick={handleStartChat}
                  onBack={handleBack} 
               />;
      case Screen.Messages:
          return <MessagesScreen chats={chats} onChatClick={handleStartChat} onBack={handleBack} />;
      case Screen.Profile:
        return currentUser ? <UserProfileScreen user={currentUser} onEdit={() => setProfileMenuOpen(true)} onLogout={handleLogout} /> : <div className="p-4 text-center">Carregando perfil...</div>;
      case Screen.CreateProfile:
        return currentUser ? <CreateProfileScreen user={currentUser} onBack={handleBack} onSave={handleSaveProfile}/> : <div className="p-4 text-center">Carregando...</div>;
      case Screen.SkillSearch:
        return <SkillSearchScreen allUsers={users.filter(u => u.id !== currentUser?.id)} onUserClick={handleViewOtherUser} onBack={handleBack} />;
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
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-white">Carregando tela...</p></div>}>
                {renderScreen()}
              </Suspense>
            </div>
            {isNavVisible && <BottomNav activeScreen={activeScreen} onNavigate={(s) => setHistory([s])} />}

            {/* Renderiza a modal de perfil de outro usuário se viewingOtherUser estiver definido */}
            {viewingOtherUser && currentUser && (
              <OtherUserProfileModal
                user={viewingOtherUser}
                onClose={() => setViewingOtherUser(null)}
                onSendConnectionRequest={handleSendConnectionRequest}
                isConnectionPending={sentConnectionRequests.some(req => req.receiver_id === viewingOtherUser.id && req.status === 'pending')}
                isConnected={acceptedConnections.some(conn => 
                    (conn.sender_id === currentUser.id && conn.receiver_id === viewingOtherUser.id) ||
                    (conn.receiver_id === currentUser.id && conn.sender_id === viewingOtherUser.id)
                )}
              />
            )}
          </>
      );
  }

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`flex items-center justify-center min-h-screen font-sans ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`}>
      <div className={`relative w-full max-w-sm h-[850px] ${theme === 'dark' ? 'bg-[#0B1526] text-white' : 'bg-white text-gray-800'} shadow-2xl rounded-lg overflow-hidden flex flex-col`}>
        <ToastProvider />
        {renderContent()}
        {isProfileMenuOpen && (
          <ProfileMenu
            onEditProfile={() => {
              handleCreateProfile();
              setProfileMenuOpen(false);
            }}
            onLogout={() => {
              handleLogout();
              setProfileMenuOpen(false);
            }}
            onToggleTheme={toggleTheme}
            theme={theme}
            onClose={() => setProfileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;