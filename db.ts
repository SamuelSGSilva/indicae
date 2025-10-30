import { MOCK_USERS, MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES } from './src/constants'; // Caminho atualizado
import { User, ConnectionRequest, Message, ChatThread } from './src/types'; // Caminho atualizado

const DB_KEY = 'indicai_db';

interface AppDB {
    users: User[];
    connections: ConnectionRequest[];
    chats: ChatThread[];
    currentUserId: string | null; // Alterado para string | null
}

// In-memory cache to act as a single source of truth after initialization.
let _cachedDB: AppDB | null = null;

const createInitialDB = (): AppDB => ({
    users: [...MOCK_USERS], // Keep mock users for search/connections for now
    connections: [...MOCK_CONNECTIONS],
    chats: [
        {
            id: "chat-1", // ID de chat mockado como string
            contact: MOCK_USERS.find(u => u.id === "10")!, // ID do usuário mockado como string
            messages: [...MOCK_CHAT_MESSAGES],
        },
    ],
    currentUserId: null, // Supabase will manage this
});

const writeDB = (db: AppDB) => {
    _cachedDB = db; // Keep cache in sync
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
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.connections) && Array.isArray(parsed.chats)) {
            // currentUserId is now managed by Supabase, so we can ignore it here or reset it
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

    // These methods are no longer used for Supabase Auth
    getUserByEmail: (email: string): User | undefined => {
        const state = readDB();
        return state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // login and register are now handled by Supabase Auth in App.tsx
    // updateUser is now handled by Supabase in App.tsx
    
    // Keep these for now as they interact with local mock data
    handleConnection: (connectionId: string, action: 'accept' | 'reject') => { // connectionId como string
        const state = readDB();
        const connection = state.connections.find(c => c.id === connectionId);

        if (action === 'accept' && connection) {
             const chatExists = state.chats.some(c => c.contact.id === connection.user.id);
             if (!chatExists) {
                 state.chats.push({
                     id: Date.now().toString(), // ID de chat como string
                     contact: connection.user,
                     messages: []
                 });
             }
        }
        
        state.connections = state.connections.filter(c => c.id !== connectionId);
        writeDB(state);
    },

    addMessage: (chatPartnerId: string, message: Message) => { // chatPartnerId como string
        const state = readDB();
        const chat = state.chats.find(c => c.contact.id === chatPartnerId);

        if (chat) {
            chat.messages.push(message);
        } else {
             const partner = state.users.find(u => u.id === chatPartnerId);
             if (partner) {
                 state.chats.push({
                     id: Date.now().toString(), // ID de chat como string
                     contact: partner,
                     messages: [message],
                 });
             }
        }
        writeDB(state);
    },
};