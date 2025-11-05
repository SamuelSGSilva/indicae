import React from 'react';
import { User } from '../types'; // Caminho atualizado
import { icons, calculateAge, getColorForSkill } from '../constants'; // Caminho atualizado

interface UserProfileScreenProps {
  user: User;
  onEdit: () => void;
  onLogout: () => void;
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

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ user, onEdit, onLogout }) => {
  const hasSoftSkills = user.softSkills && user.softSkills.length > 0;
  const hasHardSkills = user.hardSkills && user.hardSkills.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526] text-white">
      <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
        <div className="w-8"></div> {/* Spacer */}
        <h1 className="text-xl font-bold">Perfil</h1>

      </header>
      
      <main className="flex-1 flex flex-col -mt-16 overflow-y-auto">
        <div className="relative pt-16 flex-1">
          {/* Avatar Area */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
              <div className="relative w-28 h-28 bg-gray-200 rounded-full flex flex-col items-center justify-center overflow-hidden border-4 border-[#0B1526] shadow-lg">
                  {user.avatar ? 
                    <img src={user.avatar} alt="profile" className="w-full h-full object-cover"/> : 
                    <span className="text-5xl font-bold text-gray-400">{user.name.charAt(0)}</span>
                  }
              </div>
          </div>
          
          {/* White Content Card */}
          <div className="relative bg-white rounded-t-[2.5rem] pt-20 pb-6 px-6 text-gray-800 h-full">
            <button onClick={onEdit} className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100" aria-label="Editar Perfil">
              {icons.edit('w-6 h-6')}
            </button>
            <div className="text-center">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfileScreen;