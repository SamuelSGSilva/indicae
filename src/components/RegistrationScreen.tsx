import React, { useState } from 'react';
import { User } from '../types'; // Caminho atualizado
import CityModal from './CityModal';
import { ALL_CITIES } from '../constants'; // Caminho atualizado

interface RegistrationScreenProps {
  onRegister: (userData: Omit<User, 'id' | 'avatar'> & { avatar?: string }) => void;
  onNavigateToLogin: () => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);


  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password && dob && city) {
        onRegister({ name, email, password, dob, city });
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0B1526]">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Crie sua Conta</h1>
          <p className="text-gray-400 mb-8">É rápido e fácil.</p>

          <form onSubmit={handleRegisterClick} className="space-y-4">
            <input
              type="text"
              placeholder="Nome Completo"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            <div className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus-within:ring-2 focus-within:ring-teal-500 flex items-center">
                <input
                    type="date"
                    value={dob}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
                    className="bg-transparent w-full focus:outline-none"
                    required
                />
            </div>
            <button
              type="button"
              onClick={() => setIsCityModalOpen(true)}
              className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none ring-teal-500 focus:ring-2 text-left"
            >
              {city || <span className="text-gray-400">Cidade</span>}
            </button>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full bg-[#0d1b2a] border border-gray-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Cadastrar
            </button>
          </form>

          <div className="mt-8">
            <button
              onClick={onNavigateToLogin}
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Já tem uma conta? <span className="font-bold">Faça login</span>
            </button>
          </div>
        </div>
      </div>
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={(selectedCity: string) => {
            setCity(selectedCity);
            setIsCityModalOpen(false);
        }}
        availableCities={ALL_CITIES}
        title="Selecione sua Cidade"
      />
    </>
  );
};

export default RegistrationScreen;