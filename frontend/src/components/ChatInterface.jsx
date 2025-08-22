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
  MoreVertical
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-semibold">Agentspace Chat</h1>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-white"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        {/* New Chat Button */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <Button 
              onClick={createNewChat}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </Button>
          </div>
        )}

        {/* Chat History */}
        <ScrollArea className="flex-1 px-2">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <Card 
                  key={room.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    currentRoom?.id === room.id 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                  onClick={() => selectChatRoom(room)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {room.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {room.lastMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(room.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-gray-400">
                      <MoreVertical size={12} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {chatRooms.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  size="icon"
                  className={`w-12 h-12 ${
                    currentRoom?.id === room.id ? 'bg-gray-700' : 'hover:bg-gray-700'
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
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-lg font-semibold">
            {currentRoom?.title || 'Select a chat or start a new one'}
          </h2>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
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
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="max-w-4xl mx-auto">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Paperclip size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-300">{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            )}
            
            <div className="flex items-end space-x-3">
              {/* File Upload */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-white"
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
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-24"
                  disabled={isTyping}
                />
                
                {/* Voice Input */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceInput}
                  className={`absolute right-12 top-1/2 transform -translate-y-1/2 ${
                    isRecording ? 'text-red-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>

                {/* Send Button */}
                <Button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && !selectedFile) || isTyping}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-blue-600 hover:bg-blue-700"
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