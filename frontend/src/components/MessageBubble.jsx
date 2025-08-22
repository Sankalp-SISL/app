import React from 'react';
import { Card } from './ui/card';
import { Paperclip } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-2xl ${isUser ? 'max-w-md' : 'max-w-full'}`}>
        {/* User messages - right aligned, smaller width */}
        {isUser ? (
          <Card className="bg-blue-600 text-white border-blue-500 p-4">
            <div className="space-y-2">
              {message.hasAttachment && (
                <div className="flex items-center space-x-2 text-blue-100 text-sm">
                  <Paperclip size={14} />
                  <span>{message.attachmentName}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs text-blue-200 text-right">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </Card>
        ) : (
          /* Bot messages - full width, left aligned */
          <div className="w-full">
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-100 leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;