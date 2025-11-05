import React from 'react';
import { Screen } from '../types'; // Caminho atualizado
import { icons } from '../constants'; // Caminho atualizado

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NavItem: React.FC<{
  screen: Screen;
  label: string;
  icon: (className: string) => React.ReactNode;
  isActive: boolean;
  onClick: (screen: Screen) => void;
}> = ({ screen, label, icon, isActive, onClick }) => {
  const activeColor = 'text-white';
  const inactiveColor = 'text-gray-400';
  const color = isActive ? activeColor : inactiveColor;

  return (
    <button
      onClick={() => onClick(screen)}
      className={`flex flex-col items-center justify-center w-1/4 transition-colors duration-200 ${color}`}
    >
      {icon(`w-6 h-6 mb-1`)}
      <span className="text-xs">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.Home, label: 'Início', icon: icons.home },
    { screen: Screen.Search, label: 'Buscar', icon: icons.search },
    { screen: Screen.Connections, label: 'Conexões', icon: icons.connections },
    { screen: Screen.Messages, label: 'Mensagens', icon: icons.messages },
    { screen: Screen.Profile, label: 'Perfil', icon: icons.profile },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-20 bg-[#0d1b2a] border-t border-gray-700 flex justify-around items-center">
      {navItems.map((item) => (
        <NavItem
          key={item.screen}
          screen={item.screen}
          label={item.label}
          icon={item.icon}
          isActive={activeScreen === item.screen}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
};

export default BottomNav;