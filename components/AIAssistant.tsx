import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Wrench } from 'lucide-react';
import { getSuggestedSetup, getTechAdvice } from '../services/geminiService';
import { DEVICES } from '../data/equipment';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySetup: (deviceIds: string[]) => void;
}

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    suggestedDevices?: string[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onApplySetup }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'init', 
        role: 'bot', 
        text: 'Hello! I am your AI Stage Manager. Describe the DJ setup you need (e.g., "Standard Festival Layout" or "Vinyl Setup"), or ask me technical questions about the gear.' 
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
        // Heuristic to decide between setup generation and tech support
        const isSetupRequest = /setup|booth|kit|rider|play|console|cdj|turntable|mixer/i.test(userMsg.text);
        
        if (isSetupRequest) {
            const devices = await getSuggestedSetup(userMsg.text);
            if (devices && devices.length > 0) {
                // Map IDs to models for display
                const deviceNames = devices.map(id => DEVICES.find(d => d.id === id)?.model || id).join(', ');
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'bot',
                    text: `I've designed a setup for you: ${deviceNames}. Click below to load it onto the canvas.`,
                    suggestedDevices: devices
                }]);
            } else {
                 setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'bot',
                    text: "I couldn't match any specific equipment from our inventory to that request. Try asking for 'CDJs' or 'Technics'."
                }]);
            }
        } else {
            const advice = await getTechAdvice(userMsg.text);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'bot',
                text: advice
            }]);
        }
    } catch (e) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'bot',
            text: "Sorry, I'm having trouble connecting to the mainframe right now."
        }]);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                    <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-100">AI Stage Manager</h2>
                    <p className="text-xs text-slate-400">Powered by Gemini 2.5</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        {msg.suggestedDevices && (
                            <div className="mt-4 pt-3 border-t border-slate-700/50">
                                <button 
                                    onClick={() => {
                                        onApplySetup(msg.suggestedDevices!);
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    <Wrench className="w-3 h-3" />
                                    BUILD THIS BOOTH
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-xs text-slate-400">Processing request...</span>
                    </div>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="relative">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask for a setup or technical advice..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !prompt.trim()}
                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};