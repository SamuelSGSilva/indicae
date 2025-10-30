export enum Screen {
  Search = 'Buscar',
  Connections = 'Conexões',
  Messages = 'Mensagens',
  Profile = 'Perfil',
  Chat = 'Chat',
  CreateProfile = 'CreateProfile',
}

export interface User {
  id: number;
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
  id: number;
  user: User;
  interest: string;
}

export interface Message {
  id: number;
  text: string;
  time: string;
  senderId: number;
  avatar: string;
}

export interface ChatThread {
    id: number;
    contact: User;
    messages: Message[];
}