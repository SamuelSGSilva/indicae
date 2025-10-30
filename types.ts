export enum Screen {
  Search = 'Buscar',
  Connections = 'Conexões',
  Messages = 'Mensagens',
  Profile = 'Perfil',
  Chat = 'Chat',
  CreateProfile = 'CreateProfile',
  SkillSearch = 'SkillSearch',
  Initial = 'Initial',
  Home = 'Home', // Nova tela inicial pós-login
  OtherUserProfile = 'OtherUserProfile', // Nova tela para perfis de outros usuários
}

export interface User {
  id: string; // Alterado de number para string
  name: string;
  dob: string;
  city: string;
  state?: string;
  avatar: string;
  education?: string;
  softSkills?: string[];
  hardSkills?: string[];
  email: string;
  password?: string;
}

export interface ConnectionRequest {
  id: string; // Alterado de number para string
  sender_id: string; // ID do usuário que enviou a solicitação
  receiver_id: string; // ID do usuário que recebeu a solicitação
  user: User; // O usuário que enviou a solicitação (para a tela de conexões do receptor)
  interest_message: string; // Mensagem de interesse
  status: 'pending' | 'accepted' | 'rejected'; // Status da solicitação
  created_at: string;
}

export interface Message {
  id: string; // Alterado de number para string
  text: string;
  time: string;
  senderId: string; // Alterado de number para string
  avatar: string;
}

export interface ChatThread {
    id: string; // Alterado de number para string
    contact: User;
    messages: Message[];
}