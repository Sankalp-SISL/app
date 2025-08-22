// Mock data and API responses for Agentspace chatbot

export const mockChatRooms = [
  {
    id: '1',
    title: 'Project Planning Discussion',
    timestamp: '2025-01-15T10:30:00Z',
    lastMessage: 'Let me help you create a comprehensive project plan...'
  },
  {
    id: '2', 
    title: 'Data Analysis Query',
    timestamp: '2025-01-14T15:45:00Z',
    lastMessage: 'Based on the dataset you provided, here are the key insights...'
  },
  {
    id: '3',
    title: 'Code Review Request',
    timestamp: '2025-01-13T09:20:00Z', 
    lastMessage: 'I\'ve reviewed your code and have some suggestions...'
  }
];

export const mockMessages = {
  '1': [
    {
      id: 'm1',
      type: 'user',
      content: 'I need help planning a new project for Q1 2025',
      timestamp: '2025-01-15T10:30:00Z'
    },
    {
      id: 'm2', 
      type: 'bot',
      content: 'I\'d be happy to help you plan your Q1 2025 project! Let me break this down into key areas we should consider:\n\n**1. Project Scope & Objectives**\n- What are the main goals you want to achieve?\n- What\'s the expected timeline and key milestones?\n\n**2. Resource Allocation**\n- Team size and skill requirements\n- Budget considerations\n- Technology stack needs\n\n**3. Risk Assessment**\n- Potential challenges and mitigation strategies\n- Dependencies on other teams or projects\n\nCould you provide more details about the type of project and your specific requirements?',
      timestamp: '2025-01-15T10:31:00Z'
    }
  ],
  '2': [
    {
      id: 'm3',
      type: 'user', 
      content: 'Can you analyze this sales data from last quarter?',
      timestamp: '2025-01-14T15:45:00Z',
      hasAttachment: true,
      attachmentName: 'sales_q4_2024.csv'
    },
    {
      id: 'm4',
      type: 'bot',
      content: 'I\'ve analyzed your Q4 2024 sales data. Here are the key insights:\n\n**Performance Summary:**\n- Total Revenue: $2.4M (+18% vs Q3)\n- Units Sold: 15,600 (+12% vs Q3)\n- Average Order Value: $154 (+5% vs Q3)\n\n**Top Performing Categories:**\n1. Electronics - 35% of total sales\n2. Home & Garden - 28% of total sales  \n3. Clothing - 22% of total sales\n\n**Geographic Breakdown:**\n- North America: 60% of sales\n- Europe: 25% of sales\n- Asia-Pacific: 15% of sales\n\n**Recommendations:**\n1. Increase inventory for Electronics category\n2. Expand marketing efforts in Asia-Pacific region\n3. Consider seasonal promotions for Home & Garden\n\nWould you like me to dive deeper into any specific aspect of this analysis?',
      timestamp: '2025-01-14T15:46:00Z'
    }
  ]
};

// Mock API functions
export const mockApiService = {
  // Generic Agentspace API connector - easily replaceable
  agentspaceConfig: {
    endpoint: 'https://api.agentspace.google.com', // Replace with actual endpoint
    apiKey: 'AGENTSPACE_API_KEY', // Replace with actual API key
    model: 'gemini-pro', // Replace with actual model
  },

  // Chat room operations
  async createChatRoom() {
    const newRoom = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      lastMessage: ''
    };
    mockChatRooms.unshift(newRoom);
    return newRoom;
  },

  async getChatRooms() {
    return mockChatRooms;
  },

  async getChatMessages(roomId) {
    return mockMessages[roomId] || [];
  },

  // Message sending with typing simulation
  async sendMessage(roomId, message, attachments = []) {
    const userMessage = {
      id: 'u' + Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      hasAttachment: attachments.length > 0,
      attachmentName: attachments[0]?.name
    };

    if (!mockMessages[roomId]) {
      mockMessages[roomId] = [];
    }
    mockMessages[roomId].push(userMessage);

    // Simulate bot response with typing states
    const botResponses = [
      'I understand your question. Let me analyze this and provide you with a comprehensive response.',
      'Based on your input, here are some key considerations and recommendations that should help address your needs.',
      'Great question! This requires a multi-faceted approach. Let me break down the solution into actionable steps for you.',
      'I\'ve processed your request. Here\'s a detailed analysis with practical recommendations you can implement right away.'
    ];

    const botResponse = {
      id: 'b' + Date.now(),
      type: 'bot', 
      content: botResponses[Math.floor(Math.random() * botResponses.length)],
      timestamp: new Date().toISOString()
    };

    // Simulate delay for typing indicators
    await new Promise(resolve => setTimeout(resolve, 3000));
    mockMessages[roomId].push(botResponse);
    
    return botResponse;
  },

  // Voice input simulation
  async processVoiceInput(audioBlob) {
    // Mock voice-to-text conversion
    const mockTranscriptions = [
      'Hello, I need help with my project planning',
      'Can you analyze the data I just uploaded?',
      'What are the best practices for team collaboration?'
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