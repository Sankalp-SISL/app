import React from 'react';
import { Card } from './ui/card';
import { Brain, Zap, MessageCircle } from 'lucide-react';

const TypingIndicator = ({ state }) => {
  const getIcon = () => {
    switch (state) {
      case 'Understanding':
        return <Brain className="animate-pulse" size={16} />;
      case 'Structuring':
        return <Zap className="animate-bounce" size={16} />;
      case 'Typing':
        return <MessageCircle className="animate-spin" size={16} />;
      default:
        return <MessageCircle className="animate-pulse" size={16} />;
    }
  };

  const getDots = () => (
    <div className="flex space-x-1 ml-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-full">
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center text-gray-400">
            <div className="text-blue-400 mr-2">
              {getIcon()}
            </div>
            <span className="text-sm font-medium mr-2">{state}</span>
            {getDots()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TypingIndicator;