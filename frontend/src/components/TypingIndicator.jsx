import React from 'react';
import { Card } from './ui/card';
import { Brain, Zap, MessageCircle } from 'lucide-react';

const TypingIndicator = ({ state }) => {
  const getIcon = () => {
    switch (state) {
      case 'Understanding':
        return <Brain className="animate-pulse text-orange-400" size={18} />;
      case 'Structuring':
        return <Zap className="animate-bounce text-red-400" size={18} />;
      case 'Typing':
        return <MessageCircle className="animate-spin text-orange-500" size={18} />;
      default:
        return <MessageCircle className="animate-pulse text-orange-400" size={18} />;
    }
  };

  const getDots = () => (
    <div className="flex space-x-1 ml-3">
      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  const getStateColor = () => {
    switch (state) {
      case 'Understanding':
        return 'from-orange-500/20 to-red-600/10';
      case 'Structuring':
        return 'from-red-500/20 to-orange-600/10';
      case 'Typing':
        return 'from-orange-600/20 to-red-500/20';
      default:
        return 'from-orange-500/20 to-red-600/10';
    }
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-full">
        <div className={`bg-gradient-to-r ${getStateColor()} backdrop-blur-xl p-5 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105`}>
          <div className="flex items-center text-gray-100">
            <div className="mr-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              {getIcon()}
            </div>
            <span className="text-sm font-semibold mr-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {state}
            </span>
            {getDots()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;