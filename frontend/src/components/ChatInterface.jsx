import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import { mockApiService, typingStates } from '../utils/mock';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatInterface = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingState, setTypingState] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatRooms = async () => {
    const rooms = await mockApiService.getChatRooms();
    setChatRooms(rooms);
    if (rooms.length > 0) {
      selectChatRoom(rooms[0]);
    }
  };

  const selectChatRoom = async (room) => {
    setCurrentRoom(room);
    const roomMessages = await mockApiService.getChatMessages(room.id);
    setMessages(roomMessages);
  };

  const createNewChat = async () => {
    const newRoom = await mockApiService.createChatRoom();
    setChatRooms(prev => [newRoom, ...prev]);
    setCurrentRoom(newRoom);
    setMessages([]);
  };

  const simulateTypingStates = async () => {
    const states = [typingStates.UNDERSTANDING, typingStates.STRUCTURING, typingStates.TYPING];
    
    for (const state of states) {
      setTypingState(state);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;
    
    if (!currentRoom) {
      await createNewChat();
    }

    const attachments = selectedFile ? [selectedFile] : [];
    
    setIsTyping(true);
    simulateTypingStates();
    
    try {
      await mockApiService.sendMessage(currentRoom.id, inputMessage, attachments);
      const updatedMessages = await mockApiService.getChatMessages(currentRoom.id);
      setMessages(updatedMessages);
      setInputMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
      setTypingState('');
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording and process
      try {
        const transcription = await mockApiService.processVoiceInput(null);
        setInputMessage(transcription);
      } catch (error) {
        console.error('Voice input error:', error);
      }
    } else {
      setIsRecording(true);
      // Start recording
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-500 ease-in-out bg-gradient-to-b from-gray-900 to-black backdrop-blur-xl shadow-2xl flex flex-col relative`}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-600/5 pointer-events-none"></div>
        
        {/* Sidebar Header */}
        <div className="relative p-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Agentspace
              </h1>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-orange-400 hover:text-white hover:bg-orange-500/20 transition-all duration-300 rounded-xl"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        {/* New Chat Button */}
        {!sidebarCollapsed && (
          <div className="relative px-6 pb-4">
            <Button 
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </Button>
          </div>
        )}

        {/* Chat History */}
        <ScrollArea className="flex-1 px-4 relative">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              {chatRooms.map((room) => (
                <div 
                  key={room.id}
                  className={`p-4 cursor-pointer transition-all duration-300 rounded-xl backdrop-blur-sm ${
                    currentRoom?.id === room.id 
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-600/20 shadow-lg transform scale-105' 
                      : 'bg-white/5 hover:bg-white/10 hover:transform hover:scale-102'
                  }`}
                  onClick={() => selectChatRoom(room)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate mb-1">
                        {room.title}
                      </h3>
                      <p className="text-xs text-gray-300 truncate mb-2">
                        {room.lastMessage}
                      </p>
                      <p className="text-xs text-orange-400 font-medium">
                        {new Date(room.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-gray-400 hover:text-orange-400">
                      <MoreVertical size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {chatRooms.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  size="icon"
                  className={`w-12 h-12 rounded-xl transition-all duration-300 ${
                    currentRoom?.id === room.id 
                      ? 'bg-gradient-to-r from-orange-500/30 to-red-600/30 text-white' 
                      : 'text-gray-400 hover:bg-white/10 hover:text-orange-400'
                  }`}
                  onClick={() => selectChatRoom(room)}
                >
                  <MessageCircle size={20} />
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-red-900/10 pointer-events-none"></div>
        
        {/* Chat Header */}
        <div className="relative p-6 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-xl shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {currentRoom?.title || 'Select a chat or start a new conversation'}
            </h2>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6 relative">
          <div className="max-w-6xl mx-auto space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isTyping && (
              <TypingIndicator state={typingState} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="relative p-6 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-xl shadow-2xl">
          <div className="max-w-6xl mx-auto">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Paperclip size={14} className="text-white" />
                    </div>
                    <span className="text-sm text-gray-200 font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-end space-x-4">
              {/* File Upload */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-400 hover:text-white hover:bg-orange-500/20 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <Paperclip size={20} />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
              />

              {/* Message Input */}
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm text-white placeholder-gray-400 pr-24 py-4 text-lg rounded-xl shadow-lg transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 focus:bg-gray-800/70"
                  disabled={isTyping}
                />
                
                {/* Voice Input */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceInput}
                  className={`absolute right-16 top-1/2 transform -translate-y-1/2 rounded-lg transition-all duration-300 ${
                    isRecording 
                      ? 'text-red-400 bg-red-500/20 animate-pulse' 
                      : 'text-orange-400 hover:text-white hover:bg-orange-500/20'
                  }`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>

                {/* Send Button */}
                <Button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && !selectedFile) || isTyping}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110"
                  size="icon"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;