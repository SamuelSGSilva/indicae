import { MOCK_USERS, MOCK_CONNECTIONS, MOCK_CHAT_MESSAGES } from './constants'; // Caminho atualizado
import { User, ConnectionRequest, Message, ChatThread } from './types'; // Caminho atualizado

const DB_KEY = 'indicai_db';

interface AppDB {
    users: User[];
    connections: ConnectionRequest[];
    chats: ChatThread[]; // Keep for structure, but will be populated from Supabase
    currentUserId: string | null; // Alterado para string | null
}

// In-memory cache to act as a single source of truth after initialization.
let _cachedDB: AppDB | null = null;

const createInitialDB = (): AppDB => ({
    users: [...MOCK_USERS], // Keep mock users for search/connections for now
    connections: [...MOCK_CONNECTIONS],
    chats: [], // Chats will now be populated from Supabase
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
             // Chat creation is now handled by App.tsx after Supabase connection acceptance
        }
        
        state.connections = state.connections.filter(c => c.id !== connectionId);
        writeDB(state);
    },

    // addMessage is now handled by Supabase in App.tsx
    addMessage: (chatPartnerId: string, message: Message) => {
        // This function is no longer used for real messages, as they are sent to Supabase.
        // The real-time subscription will update the UI.
        console.warn('db.addMessage called, but real messages are handled by Supabase.');
    },
};