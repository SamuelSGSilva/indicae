import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { icons } from '../constants';

interface ChatScreenProps {
  user: User;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text: string) => void;
  currentUserId: string; // Alterado para string
}

const ChatMessageBubble: React.FC<{ message: Message, isSender: boolean }> = ({ message, isSender }) => {
  const bubbleClasses = isSender
    ? "bg-teal-600 text-white self-end rounded-l-2xl rounded-tr-2xl"
    : "bg-gray-200 text-gray-800 self-start rounded-r-2xl rounded-tl-2xl";

  return (
    <div className={`flex items-end gap-2 mb-4 max-w-[85%] ${isSender ? 'self-end flex-row-reverse' : 'self-start'}`}>
      <img src={message.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
      <div className={`p-3 ${bubbleClasses}`}>
        <p className="text-sm break-words">{message.text}</p>
        <p className={`text-xs mt-1 ${isSender ? 'text-teal-200' : 'text-gray-500'} text-right`}>{message.time}</p>
      </div>
    </div>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ user, messages, onBack, onSendMessage, currentUserId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526]">
       <header className="p-4 flex justify-between items-center flex-shrink-0">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Chat</h1>
        <button className="flex flex-col items-center text-white">
          {icons.search('w-6 h-6')}
          <span className="text-xs">Indicai</span>
        </button>
      </header>
      
      <div className="flex-grow bg-white rounded-t-[2.5rem] flex flex-col overflow-hidden">
        <div className="text-center py-6 border-b border-gray-200">
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-2"/>
          <h2 className="font-bold text-xl text-gray-800">{user.name}</h2>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto flex flex-col">
            {messages.map(msg => (
                <ChatMessageBubble key={msg.id} message={msg} isSender={msg.senderId === currentUserId} />
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Digite sua mensagem ..." 
              className="flex-grow bg-gray-100 rounded-full py-3 px-4 focus:outline-none text-gray-800"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleSend} className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 transition-colors">
                {icons.send('w-6 h-6')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;