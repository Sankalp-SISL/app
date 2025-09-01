import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// --- Import the correct hook for the redirect flow ---
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Send } from 'lucide-react';

const ChatInterface = () => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- This is the corrected login function ---
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      console.log("Redirected back from Google with auth code:", codeResponse.code);
      setIsLoading(true);
      try {
        const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const tokenResponse = await axios.post(`${apiUrl}/api/auth/google`, {
          code: codeResponse.code,
        });
        
        const token = tokenResponse.data.access_token;
        console.log("Access token received from backend:", token);
        localStorage.setItem('accessToken', token); // Persist the token
        setAccessToken(token);
      } catch (error) {
        console.error("Failed to exchange code for token:", error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => console.log('Login Failed:', error),
    // --- THIS IS THE CRITICAL FIX ---
    // This tells the login button to ask for the same permission the backend needs.
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    // --------------------------------
    flow: 'auth-code',
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !accessToken || isLoading) return;

    const userMessage = { id: Date.now(), type: 'user', content: inputMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.post(
        `${apiUrl}/api/chat`,
        // The backend now expects the access_token in the body
        { message: currentMessage, access_token: accessToken }
      );
      
      const agentMessage = { id: Date.now() + 1, type: 'agent', content: response.data.reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, agentMessage]);

    } catch (error) {
       const errorText = error.response?.data?.detail || 'An unknown error occurred.';
       const errorMessage = { id: Date.now() + 1, type: 'agent', content: `Error: ${errorText}` };
       setMessages(prev => [...prev, errorMessage]);
       console.error("Error calling backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
  };
  
  if (!accessToken) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: 'white' }}>
        <h1 style={{ fontSize: '2em', marginBottom: '1rem' }}>Welcome to Agentspace</h1>
        <p style={{ marginBottom: '2rem' }}>Please sign in to continue.</p>
        <Button onClick={() => login()} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
     <div className="flex h-screen bg-black text-white">
       <div className="flex-1 flex flex-col">
         <div className="p-4 border-b border-gray-700 flex justify-between items-center">
             <h2 className="text-xl font-bold">HR Assistant</h2>
             <Button onClick={handleLogout} variant="destructive">Logout</Button>
         </div>
         <ScrollArea className="flex-1 p-6">
           {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
           {isLoading && <TypingIndicator state="Thinking" />}
           <div ref={messagesEndRef} />
         </ScrollArea>
         <div className="p-4 border-t border-gray-700">
           <form onSubmit={handleSendMessage} className="flex space-x-2">
             <Input
               value={inputMessage}
               onChange={(e) => setInputMessage(e.target.value)}
               placeholder="Type your message..."
               className="bg-gray-800 text-white flex-1"
               disabled={isLoading}
             />
             <Button type="submit" disabled={isLoading || !inputMessage.trim()} size="icon">
                <Send size={16} />
             </Button>
           </form>
         </div>
       </div>
     </div>
  );
};

export default ChatInterface;

