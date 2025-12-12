import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Message } from '../types';
import { getChatInstance } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

const GeminiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá. Estou pronto para auxiliar nas suas demandas.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chat = getChatInstance();
    setChatInstance(chat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatInstance) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const resultStream = await chatInstance.sendMessageStream({ message: userMessage.text });
      const modelMessageId = (Date.now() + 1).toString();
      let fullResponseText = "";

      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text;
        
        if (chunkText) {
            fullResponseText += chunkText;
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId 
                ? { ...msg, text: fullResponseText } 
                : msg
            ));
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'Erro na conexão. Verifique suas credenciais.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000208] text-white max-w-5xl mx-auto w-full">
      {/* Header - Minimal */}
      <div className="flex items-center gap-3 px-8 py-6 border-b border-[#30403E]/20">
        <Sparkles className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-medium tracking-wider text-gray-300">INTELIGÊNCIA ARTIFICIAL</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div 
              className={`
                w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1
                ${msg.role === 'model' ? 'bg-[#30403E]/30 text-gray-300' : 'bg-gray-800/50 text-gray-400'}
              `}
            >
              {msg.role === 'model' ? <Bot size={14} /> : <User size={14} />}
            </div>
            
            <div 
              className={`
                max-w-[75%] p-4 text-sm font-light leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-[#30403E] text-white rounded-l-lg rounded-tr-lg' 
                  : msg.isError 
                    ? 'bg-red-950/30 border border-red-900/50 text-red-300 rounded-r-lg rounded-tl-lg'
                    : 'bg-[#0a0c10] border border-[#30403E]/30 text-gray-300 rounded-r-lg rounded-tl-lg'
                }
              `}
            >
               {msg.isError && <AlertCircle className="inline-block w-3 h-3 mr-2 mb-0.5" />}
               <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === 'user' && (
           <div className="flex items-center gap-4">
             <div className="w-6 h-6 rounded bg-[#30403E]/30 flex items-center justify-center mt-1">
               <Bot size={14} className="text-gray-300" />
             </div>
             <div className="flex gap-1 items-center h-10 px-4">
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-0"></span>
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-300"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 pt-0">
        <div className="bg-[#0a0c10] border border-[#30403E]/40 rounded-lg flex items-center p-2 focus-within:ring-1 focus-within:ring-[#30403E]/50 transition-all shadow-sm">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua instrução..."
            className="flex-1 bg-transparent border-none outline-none text-gray-200 px-4 py-3 placeholder-gray-600 font-light text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className={`
              p-2.5 rounded-md transition-all duration-200
              ${inputText.trim() && !isLoading
                ? 'bg-[#30403E] text-white hover:bg-[#4d6663]' 
                : 'bg-transparent text-gray-700 cursor-not-allowed'
              }
            `}
          >
            <Send size={16} className="stroke-[1.5]" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-700 mt-3 font-light tracking-wide">
          GEMINI 2.5 FLASH • WORKSPACE AI
        </p>
      </div>
    </div>
  );
};

export default GeminiChat;