import { MOCK_USERS, MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES } from './constants';
import { User, ConnectionRequest, Message, ChatThread } from './types';

const DB_KEY = 'indicai_db';

interface AppDB {
    users: User[];
    // connections: ConnectionRequest[]; // Removido: Conexões serão gerenciadas pelo Supabase
    chats: ChatThread[];
    currentUserId: string | null;
}

// In-memory cache to act as a single source of truth after initialization.
let _cachedDB: AppDB | null = null;

const createInitialDB = (): AppDB => ({
    users: [...MOCK_USERS],
    // connections: [...MOCK_CONNECTIONS], // Removido
    chats: [
        {
            id: 'chat-1',
            contact: MOCK_USERS.find(u => u.id === '10')!,
            messages: [...MOCK_CHAT_MESSAGES],
        },
    ],
    currentUserId: null,
});

const writeDB = (db: AppDB) => {
    _cachedDB = db;
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error('Error writing DB to localStorage', e);
    }
};

const readDB = (): AppDB => {
    // 1. Return from cache if available
    if (_cachedDB) {
        return _cachedDB;
    }

    const raw = localStorage.getItem(DB_KEY);

    // 2. If no storage, create initial DB for the very first time
    if (!raw) {
        console.log('No DB found. Creating new DB with mock data.');
        const initialDB = createInitialDB();
        writeDB(initialDB);
        return initialDB;
    }

    // 3. Parse stored data
    try {
        const parsed = JSON.parse(raw) as AppDB;

        // Minimal validation to ensure the structure is not completely broken
        // if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.connections) && Array.isArray(parsed.chats)) { // Removido parsed.connections
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.chats)) {
            parsed.currentUserId = null; 
            _cachedDB = parsed;
            return _cachedDB;
        }
    } catch (e) {
        console.error('DB is corrupted. It will be recreated.', e);
    }

    // 4. Fallback: recreate DB only if data is invalid/corrupt
    console.warn('Invalid DB structure found. Recreating with default data.');
    const fallbackDB = createInitialDB();
    writeDB(fallbackDB);
    return fallbackDB;
};


export const db = {
    initialize: (): AppDB => {
        return readDB();
    },

    getUserByEmail: (email: string): User | undefined => {
        const state = readDB();
        return state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // handleConnection will be removed or modified in App.tsx to use Supabase
    // For now, keeping it here but it won't be called for Supabase connections
    handleConnection: (connectionId: string, action: 'accept' | 'reject') => {
        const state = readDB();
        // This logic will be replaced by Supabase interaction in App.tsx
        // For now, it will only affect mock data if still used.
        // const connection = state.connections.find(c => c.id === connectionId);

        // if (action === 'accept' && connection) {
        //      const chatExists = state.chats.some(c => c.contact.id === connection.user.id);
        //      if (!chatExists) {
        //          state.chats.push({
        //              id: Date.now().toString(),
        //              contact: connection.user,
        //              messages: []
        //          });
        //      }
        // }
        
        // state.connections = state.connections.filter(c => c.id !== connectionId);
        writeDB(state);
    },

    addMessage: (chatPartnerId: string, message: Message) => {
        const state = readDB();
        const chat = state.chats.find(c => c.contact.id === chatPartnerId);

        if (chat) {
            chat.messages.push(message);
        } else {
             const partner = state.users.find(u => u.id === chatPartnerId);
             if (partner) {
                 state.chats.push({
                     id: Date.now().toString(),
                     contact: partner,
                     messages: [message],
                 });
             }
        }
        writeDB(state);
    },
};