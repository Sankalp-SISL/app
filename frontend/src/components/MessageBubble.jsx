import React from 'react';
import { Card } from './ui/card';
import { Paperclip } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-2xl ${isUser ? 'max-w-md' : 'max-w-full'} transition-all duration-300`}>
        {/* User messages - right aligned, smaller width */}
        {isUser ? (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
            <div className="space-y-3">
              {message.hasAttachment && (
                <div className="flex items-center space-x-2 text-orange-100 text-sm bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                  <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                    <Paperclip size={12} />
                  </div>
                  <span className="font-medium">{message.attachmentName}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
              <div className="text-xs text-orange-100/80 text-right font-medium">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Bot messages - full width, left aligned */
          <div className="w-full">
            <div className="bg-gradient-to-r from-gray-900/80 to-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-100 leading-relaxed text-lg">
                  {message.content}
                </div>
                <div className="text-xs text-orange-400 mt-6 font-semibold">
                  AI Assistant • {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;