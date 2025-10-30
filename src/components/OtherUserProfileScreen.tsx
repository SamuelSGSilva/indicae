import React, { useState } from 'react';
import { User } from '../types';
import { icons, calculateAge, getColorForSkill } from '../constants';

interface OtherUserProfileScreenProps {
  user: User;
  onBack: () => void;
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

const OtherUserProfileScreen: React.FC<OtherUserProfileScreenProps> = ({ 
  user, 
  onBack, 
  onSendConnectionRequest,
  isConnectionPending,
  isConnected
}) => {
  const [interestMessage, setInterestMessage] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSend = () => {
    if (interestMessage.trim()) {
      onSendConnectionRequest(user.id, interestMessage.trim());
      setInterestMessage('');
      setShowInput(false);
    }
  };

  const hasSoftSkills = user.softSkills && user.softSkills.length > 0;
  const hasHardSkills = user.hardSkills && user.hardSkills.length > 0;

  return (
    <div className="w-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Perfil</h1>
        <div className="w-8"></div> {/* Spacer */}
      </header>
      
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className="relative w-28 h-28 bg-gray-200 rounded-full flex flex-col items-center justify-center overflow-hidden border-4 border-[#0B1526] shadow-lg">
                {user.avatar ? 
                  <img src={user.avatar} alt="profile" className="w-full h-full object-cover"/> : 
                  <span className="text-5xl font-bold text-gray-400">{user.name.charAt(0)}</span>
                }
            </div>
        </div>
        
        <div className="relative bg-white rounded-t-[2.5rem] mt-24 pb-6 px-6 text-gray-800 h-full">
          <div className="text-center pt-16">
              <h2 className="text-3xl font-bold">{user.name}</h2>
              <p className="text-gray-500 mt-1">{calculateAge(user.dob)} Anos</p>
          </div>
          
          <div className="space-y-5 my-8 border-t border-b border-gray-200 py-6">
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

          <div className="space-y-4 pb-6">
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

          <div className="mt-8 text-center">
            {isConnected ? (
                <button className="bg-gray-500 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto cursor-not-allowed" disabled>
                    Conectado
                </button>
            ) : isConnectionPending ? (
                <button className="bg-yellow-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto cursor-not-allowed" disabled>
                    Solicitação Pendente
                </button>
            ) : (
                <>
                    {!showInput ? (
                        <button 
                            onClick={() => setShowInput(true)} 
                            className="bg-teal-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto hover:bg-teal-700 transition-colors shadow-lg"
                        >
                            Conectar
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <textarea
                                value={interestMessage}
                                onChange={(e) => setInterestMessage(e.target.value)}
                                placeholder="Diga por que você quer se conectar..."
                                className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none resize-none text-gray-800"
                                rows={3}
                            />
                            <button 
                                onClick={handleSend} 
                                className="bg-teal-600 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto hover:bg-teal-700 transition-colors shadow-lg"
                            >
                                Enviar Solicitação
                            </button>
                            <button 
                                onClick={() => setShowInput(false)} 
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OtherUserProfileScreen;