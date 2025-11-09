import React from 'react';

interface ProfileMenuProps {
  onEditProfile: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onEditProfile, onLogout, onToggleTheme, theme, onClose }) => {
  return (
    <div className="absolute top-14 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-48 text-gray-800 dark:text-white z-20">
      <ul>
        <li className="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={onEditProfile}>
          Editar Perfil
        </li>
        <li className="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer" onClick={onLogout}>
          Sair
        </li>
        <li className="py-2 px-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Modo Escuro</span>
            <input type="checkbox" className="sr-only peer" checked={theme === 'dark'} onChange={onToggleTheme} />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </li>
      </ul>
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white">
        &times;
      </button>
    </div>
  );
};

export default ProfileMenu;
