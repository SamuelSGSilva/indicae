export enum Screen {
  Search = 'Buscar',
  Connections = 'Conexões',
  Messages = 'Mensagens',
  Profile = 'Perfil',
  Chat = 'Chat',
  CreateProfile = 'CreateProfile',
  SkillSearch = 'SkillSearch',
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
  user: User;
  interest: string;
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