import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => void;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0B1526]">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Indicai</h1>
        <p className="text-gray-400 mb-10">Conectando talentos.</p>

        <form onSubmit={handleLoginClick} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Entrar
          </button>
        </form>

        <div className="mt-8">
          <button
            onClick={onNavigateToRegister}
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Não tem uma conta? <span className="font-bold">Cadastre-se</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
