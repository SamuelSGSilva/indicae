import React from 'react';
import { ChatThread, User } from '../types';
import { icons } from '../constants';

interface MessagesScreenProps {
  chats: ChatThread[];
  onChatClick: (user: User) => void;
  onBack: () => void;
}

const ChatListItem: React.FC<{ chat: ChatThread, onClick: () => void }> = ({ chat, onClick }) => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    return (
        <div onClick={onClick} className="flex items-center p-3 hover:bg-gray-200/50 rounded-lg cursor-pointer transition-colors">
            <img src={chat.contact.avatar} alt={chat.contact.name} className="w-14 h-14 rounded-full object-cover mr-4" />
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800">{chat.contact.name}</p>
                    <p className="text-xs text-gray-500">{lastMessage?.time}</p>
                </div>
                <p className="text-sm text-gray-600 truncate">{lastMessage?.text || 'Nenhuma mensagem ainda.'}</p>
            </div>
        </div>
    )
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ chats, onChatClick, onBack }) => {
  return (
    <div className="w-full min-h-full bg-[#0B1526]">
      <header className="p-4 flex justify-between items-center">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Mensagens</h1>
        <div className="w-6 h-6" />
      </header>

      <main className="bg-white rounded-t-[2.5rem] p-4 mt-4 h-full">
        {chats.length > 0 ? (
          <div>
            {chats.map((chat: ChatThread) => (
                <ChatListItem key={chat.id} chat={chat} onClick={() => onChatClick(chat.contact)} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma conversa ativa.</p>
        )}
      </main>
    </div>
  );
};

export default MessagesScreen;