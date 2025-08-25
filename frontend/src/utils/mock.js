// Real API service for Agentspace chatbot
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const mockChatRooms = [
  {
    id: '1',
    title: 'HR Assistant Chat',
    timestamp: new Date().toISOString(),
    lastMessage: 'Welcome! How can I help you today?'
  }
];

export const mockMessages = {
  '1': []
};

// Real API functions for Agentspace
export const mockApiService = {
  // Chat room operations (keeping simple local storage for now)
  async createChatRoom() {
    const newRoom = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      lastMessage: '',
      sessionId: null // Will be set after first message
    };
    
    // Add to local storage
    const rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
    rooms.unshift(newRoom);
    localStorage.setItem('chatRooms', JSON.stringify(rooms));
    
    return newRoom;
  },

  async getChatRooms() {
    const rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
    if (rooms.length === 0) {
      // Create default room if none exist
      const defaultRoom = mockChatRooms[0];
      localStorage.setItem('chatRooms', JSON.stringify([defaultRoom]));
      return [defaultRoom];
    }
    return rooms;
  },

  async getChatMessages(roomId) {
    const messages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || '[]');
    return messages;
  },

  // Real message sending with Agentspace API
  async sendMessage(roomId, message, attachments = []) {
    try {
      // Get current room to access sessionId
      const rooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
      const currentRoom = rooms.find(room => room.id === roomId);
      
      // Create user message
      const userMessage = {
        id: 'u' + Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        hasAttachment: attachments.length > 0,
        attachmentName: attachments[0]?.name
      };

      // Get current messages and add user message
      let messages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || '[]');
      messages.push(userMessage);
      localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));

      // Call real Agentspace API
      const response = await axios.post(`${API}/chat`, {
        message: message,
        sessionId: currentRoom?.sessionId || null
      });

      const { reply, sessionId } = response.data;

      // Create bot response message
      const botMessage = {
        id: 'b' + Date.now(),
        type: 'bot',
        content: reply,
        timestamp: new Date().toISOString()
      };

      // Add bot message to messages
      messages.push(botMessage);
      localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));

      // Update room with new sessionId and last message
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            sessionId: sessionId,
            lastMessage: reply.substring(0, 100) + (reply.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
          };
        }
        return room;
      });
      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));

      return botMessage;
      
    } catch (error) {
      console.error('Error calling Agentspace API:', error);
      
      // Fallback error message
      const errorMessage = {
        id: 'b' + Date.now(),
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      let messages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || '[]');
      messages.push(errorMessage);
      localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));
      
      return errorMessage;
    }
  },

  // Voice input simulation (keeping mock for now)
  async processVoiceInput(audioBlob) {
    const mockTranscriptions = [
      'Can you help me with my leave policy?',
      'What are the benefits available to employees?',
      'How do I submit a performance review?'
    ];
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  },

  // File upload simulation
  async uploadFile(file) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };
  }
};

export const typingStates = {
  UNDERSTANDING: 'Understanding',
  STRUCTURING: 'Structuring', 
  TYPING: 'Typing'
};