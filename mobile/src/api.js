import axios from 'axios';

// Na rede local, o Expo embute as variaveis EXPO_PUBLIC_* 
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;
