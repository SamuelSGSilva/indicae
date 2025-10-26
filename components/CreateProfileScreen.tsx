import React, { useState, useRef } from 'react';
import { icons, ALL_HARD_SKILLS, ALL_SOFT_SKILLS, ALL_CITIES, ALL_EDUCATION_COURSES, getColorForSkill } from '../constants';
import { User } from '../types';
import SkillModal from './SkillModal';
import CityModal from './CityModal';
import EducationModal from './EducationModal'; // Importar o novo modal

interface CreateProfileScreenProps {
  user: User;
  onBack: () => void;
  onSave: (user: User) => void;
}

const SkillTag: React.FC<{ skill: string, color: string, onRemove: () => void }> = ({ skill, color, onRemove }) => (
  <div className={`flex items-center text-white text-sm font-semibold px-3 py-1.5 rounded-full ${color}`}>
    <span>{skill}</span>
    <button onClick={onRemove} className="ml-2 -mr-1 text-white/70 hover:text-white">
        {icons.remove('w-4 h-4')}
    </button>
  </div>
);

const SkillSection: React.FC<{ 
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    skills: string[]; 
    onAddSkill: () => void;
    onRemoveSkill: (skill: string) => void;
}> = ({ title, subtitle, icon, skills, onAddSkill, onRemoveSkill }) => {
    return (
        <div className="bg-[#0d1b2a] rounded-2xl p-4 text-gray-300 relative">
            <div className="flex items-start justify-between">
                <div className="flex items-center">
                    {icon}
                    <div className="ml-3">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <p className="text-xs text-gray-400">{subtitle}</p>
                    </div>
                </div>
                <button onClick={onAddSkill} className="bg-gray-700/80 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600/80 transition flex-shrink-0">
                    {icons.plus('w-6 h-6 text-white')}
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                {skills.map((skill, index) => <SkillTag key={index} skill={skill} color={getColorForSkill(skill)} onRemove={() => onRemoveSkill(skill)} />)}
            </div>
        </div>
    );
}

const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({ user, onBack, onSave }) => {
    const [formData, setFormData] = useState<User>(user);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [skillTypeToEdit, setSkillTypeToEdit] = useState<'softSkills' | 'hardSkills' | null>(null);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false); // Novo estado para o modal de formação

    const openSkillModal = (type: 'softSkills' | 'hardSkills') => {
        setSkillTypeToEdit(type);
        setIsSkillModalOpen(true);
    };

    const handleSelectSkill = (skill: string) => {
        if (skillTypeToEdit) {
            setFormData(prev => ({
                ...prev,
                [skillTypeToEdit]: [...(prev[skillTypeToEdit] || []), skill]
            }));
        }
        setIsSkillModalOpen(false);
    };

    const handleRemoveSkill = (type: 'softSkills' | 'hardSkills', skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type]?.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectEducation = (education: string) => {
        setFormData(prev => ({ ...prev, education }));
        setIsEducationModalOpen(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({...prev, avatar: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };


  return (
    <>
    <div className="w-full flex flex-col bg-[#0B1526] overflow-y-auto">
       <header className="p-4 flex justify-between items-center flex-shrink-0">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Indicai</h1>
        <div className="w-6 h-6"></div> {/* Placeholder para manter o espaçamento */}
      </header>

      <main className="flex-1 flex flex-col relative"> {/* Adicionado relative aqui */}
        {/* Avatar Area - posicionado relativo ao main */}
        <div onClick={handleAvatarClick} className="absolute cursor-pointer top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"> {/* Ajustado top */}
            <div className="relative w-28 h-28 bg-gray-200 rounded-full flex flex-col items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                {formData.avatar ? 
                  <img src={formData.avatar} alt="profile" className="w-full h-full object-cover"/> : 
                  <div className="text-center">
                    {icons.camera('w-8 h-8 text-gray-500')}
                  </div>
                }
            </div>
            <p className="mt-2 text-xs text-white font-semibold">Adicionar Foto</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/*"
            />
        </div>
        
        {/* White Content Card */}
        <div className="relative bg-white rounded-t-[2.5rem] mt-24 pb-6 px-6 text-gray-800 h-full"> {/* Ajustado pt-24 para mt-24 */}
          <form className="space-y-4 pt-16"> {/* Adicionado pt-16 para empurrar o conteúdo para baixo do avatar */}
              <input type="text" placeholder="Nome Completo" name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"/>
              <div className="w-full bg-white border border-gray-200 rounded-lg p-3 focus-within:ring-2 focus-within:ring-teal-500 shadow-sm">
                  <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full bg-transparent focus:outline-none text-gray-800"
                      required
                  />
              </div>
              {/* Botão para abrir o modal de formação */}
              <button
                  type="button"
                  onClick={() => setIsEducationModalOpen(true)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:outline-none text-left shadow-sm focus:ring-2 focus:ring-teal-500"
              >
                  {formData.education ? <span className="text-gray-800">{formData.education}</span> : <span className="text-gray-500">Formação</span>}
              </button>
              <button
                  type="button"
                  onClick={() => setIsCityModalOpen(true)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:outline-none text-left shadow-sm focus:ring-2 focus:ring-teal-500"
              >
                  {formData.city ? <span className="text-gray-800">{formData.city}</span> : <span className="text-gray-500">Cidade</span>}
              </button>
          </form>
          <div className="mt-6 space-y-4">
              <SkillSection 
                  title="Soft Skills"
                  subtitle="Ex: Liderança, Comunicação"
                  icon={icons.softSkills('w-6 h-6 text-white')}
                  skills={formData.softSkills || []}
                  onAddSkill={() => openSkillModal('softSkills')}
                  onRemoveSkill={(skill) => handleRemoveSkill('softSkills', skill)}
              />
              <SkillSection 
                  title="Hard Skills"
                  subtitle="Ex: DevOps, Big Data"
                  icon={icons.hardSkills('w-6 h-6 text-white')}
                  skills={formData.hardSkills || []}
                  onAddSkill={() => openSkillModal('hardSkills')}
                  onRemoveSkill={(skill) => handleRemoveSkill('hardSkills', skill)}
              />
          </div>

          <div className="mt-8 text-center">
              <button onClick={() => onSave(formData)} className="bg-[#0d1b2a] text-white font-bold py-3 px-12 rounded-full w-full max-w-xs mx-auto hover:bg-[#1a2c41] transition-colors shadow-lg">
                  Salvar Perfil
              </button>
          </div>
        </div>
      </main>
    </div>
    {isSkillModalOpen && skillTypeToEdit && (
        <SkillModal
            isOpen={isSkillModalOpen}
            onClose={() => setIsSkillModalOpen(false)}
            onSelectSkill={handleSelectSkill}
            availableSkills={skillTypeToEdit === 'softSkills' ? ALL_SOFT_SKILLS : ALL_HARD_SKILLS}
            currentSkills={formData[skillTypeToEdit] || []}
            title={`Adicionar ${skillTypeToEdit === 'softSkills' ? 'Soft Skill' : 'Hard Skill'}`}
        />
    )}
    {isCityModalOpen && (
        <CityModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            onSelectCity={(selectedCity) => {
                setFormData(prev => ({...prev, city: selectedCity}));
                setIsCityModalOpen(false);
            }}
            availableCities={ALL_CITIES}
            title="Selecione sua Cidade"
        />
    )}
    {isEducationModalOpen && ( // Renderizar o EducationModal
        <EducationModal
            isOpen={isEducationModalOpen}
            onClose={() => setIsEducationModalOpen(false)}
            onSelectEducation={handleSelectEducation}
            availableEducations={ALL_EDUCATION_COURSES}
            title="Selecione sua Formação"
        />
    )}
    </>
  );
};
export default CreateProfileScreen;