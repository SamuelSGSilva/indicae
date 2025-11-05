import { User, ConnectionRequest, ChatThread } from './types'; // Caminho atualizado

const DB_KEY = 'indicae_db';

interface AppDB {
    users: User[];
    connections: ConnectionRequest[];
    chats: ChatThread[];
    currentUserId: string | null;
}

// In-memory cache to act as a single source of truth after initialization.
let _cachedDB: AppDB | null = null;

const createInitialDB = (): AppDB => ({
    users: [],
    connections: [],
    chats: [],
    currentUserId: null,
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
        console.log('No DB found. Creating new DB.');
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
    // Funções de mock foram removidas pois o estado agora é gerenciado pelo Supabase em App.tsx
};