import React, { useState } from 'react';
import { User } from '../types';
import { icons, calculateAge, getColorForSkill } from '../constants';

interface OtherUserProfileModalProps {
  user: User;
  onClose: () => void;
  onSendConnectionRequest: (receiverId: string, interestMessage: string) => void;
  isConnectionPending: boolean;
  isConnected: boolean;
}

const SkillTag: React.FC<{ skill: string, color: string }> = ({ skill, color }) => (
  <span className={`text-white text-sm font-semibold px-4 py-2 rounded-full ${color}`}>
    {skill}
  </span>
);

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | undefined; }> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="text-gray-500 flex-shrink-0">{icon}</div>
    <div className="ml-4">
      <p className="font-semibold text-gray-400 text-xs tracking-wide uppercase">{label}</p>
      <p className="text-gray-800 text-base">{value || 'Não informado'}</p>
    </div>
  </div>
);

const OtherUserProfileModal: React.FC<OtherUserProfileModalProps> = ({ 
  user, 
  onClose, 
  onSendConnectionRequest,
  isConnectionPending,
  isConnected,
}) => {
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');

  const handleSendRequest = () => {
    if (interestMessage.trim()) {
      onSendConnectionRequest(user.id, interestMessage.trim());
      setShowInterestModal(false);
      setInterestMessage('');
    } else {
      alert('Por favor, escreva uma mensagem de interesse.');
    }
  };

  const hasSoftSkills = user.softSkills && user.softSkills.length > 0;
  const hasHardSkills = user.hardSkills && user.hardSkills.length > 0;

  return (
    <>
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#0B1526] rounded-2xl p-6 w-11/12 max-w-sm flex flex-col max-h-[90vh] overflow-y-auto text-white"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
          <button onClick={onClose} className="text-white">{icons.back('w-6 h-6')}</button>
          <h2 className="text-xl font-bold">Perfil de {user.name.split(' ')[0]}</h2>
          <div className="w-6 h-6"></div>
        </header>
        
        <main className="flex-1 flex flex-col items-center text-center">
          <img 
            src={user.avatar || `https://picsum.photos/seed/${user.id}/200/200`} 
            alt={user.name} 
            className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-teal-600"
          />
          <h2 className="text-3xl font-bold">{user.name}</h2>
          <p className="text-gray-400">{calculateAge(user.dob)} Anos</p>
          <p className="text-gray-400">{user.city}</p>

          <div className="space-y-5 my-8 border-t border-b border-gray-700 py-6 w-full">
                <InfoItem 
                    icon={icons.education('w-6 h-6')}
                    label="Formação"
                    value={user.education}
                />
                <InfoItem 
                    icon={icons.location('w-6 h-6')}
                    label="Localização"
                    value={user.city}
                />
            </div>

            <div className="space-y-4 pb-6 w-full">
                <div className="bg-[#0d1b2a] rounded-xl p-4 text-gray-300">
                    <div className="flex items-center mb-3">
                        {icons.softSkills('w-6 h-6 text-white')}
                        <h3 className="text-lg font-bold ml-2 text-white">Soft Skills</h3>
                    </div>
                    {hasSoftSkills ? (
                        <div className="flex flex-wrap gap-2">
                            {user.softSkills?.map((skill, index) => <SkillTag key={index} skill={skill} color={getColorForSkill(skill)}/>)}
                        </div>
                    ) : <p className="text-gray-400 text-sm">Nenhuma skill adicionada.</p>}
                </div>

                <div className="bg-[#0d1b2a] rounded-xl p-4 text-gray-300">
                    <div className="flex items-center mb-3">
                        {icons.hardSkills('w-6 h-6 text-white')}
                        <h3 className="text-lg font-bold ml-2 text-white">Hard Skills</h3>
                    </div>
                    {hasHardSkills ? (
                        <div className="flex flex-wrap gap-2">
                            {user.hardSkills?.map((skill, index) => <SkillTag key={index} skill={skill} color={getColorForSkill(skill)}/>)}
                        </div>
                    ) : <p className="text-gray-400 text-sm">Nenhuma skill adicionada.</p>}
                </div>
            </div>

          <div className="mt-6 text-center w-full">
            {isConnected ? (
              <button className="bg-green-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto transition-colors shadow-lg cursor-not-allowed opacity-80">
                Conectado
              </button>
            ) : isConnectionPending ? (
              <button className="bg-yellow-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto transition-colors shadow-lg cursor-not-allowed opacity-80">
                Solicitação Pendente
              </button>
            ) : (
              <button 
                onClick={() => setShowInterestModal(true)} 
                className="bg-teal-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto hover:bg-teal-700 transition-colors shadow-lg"
              >
                Conectar
              </button>
            )}
          </div>
        </main>
      </div>
    </div>

    {showInterestModal && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
        onClick={() => setShowInterestModal(false)}
      >
        <div 
          className="bg-[#0d1b2a] rounded-2xl p-6 w-11/12 max-w-sm flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white text-center mb-4">Conectar com {user.name.split(' ')[0]}</h2>
          <textarea
            value={interestMessage}
            onChange={(e) => setInterestMessage(e.target.value)}
            placeholder="Escreva uma mensagem de interesse..."
            rows={5}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          <button
            onClick={handleSendRequest}
            className="w-full bg-teal-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Enviar Solicitação
          </button>
          <button
            onClick={() => setShowInterestModal(false)}
            className="w-full mt-2 bg-gray-700 text-white font-bold py-3 px-12 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default OtherUserProfileModal;