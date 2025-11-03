export enum Screen {
  Search = 'Buscar',
  Connections = 'Conexões',
  Messages = 'Mensagens',
  Profile = 'Perfil',
  Chat = 'Chat',
  CreateProfile = 'CreateProfile',
  SkillSearch = 'SkillSearch',
  Initial = 'Initial',
  Home = 'Home',
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
  sender_id: string; // Adicionado para consistência com Supabase
  receiver_id: string; // Adicionado para consistência com Supabase
  status: 'pending' | 'accepted' | 'rejected'; // Adicionado para consistência com Supabase
  interest_message?: string; // Adicionado para consistência com Supabase
  created_at?: string; // Adicionado para consistência com Supabase
  user: User;
}

export interface Message {
  id: string; // Alterado de number para string
  text: string;
  time: string;
  senderId: string; // Alterado de number para string
  avatar?: string; // Tornando o avatar opcional
}

export interface ChatThread {
    id: string; // Alterado de number para string
    contact: User;
    messages: Message[];
}