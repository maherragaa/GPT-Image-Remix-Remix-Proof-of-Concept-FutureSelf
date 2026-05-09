import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Download, Maximize2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendAdvisorChatMessage, generateAdvisorWelcome } from '../services/geminiService';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { ModuleInfoDialog } from './ModuleInfoDialog';

interface WellbeingAdvisorChatProps {
  userContextSummary: string;
  faceImage?: string | null;
  generatedImages?: Record<string, any>;
  isActive?: boolean;
}

export function WellbeingAdvisorChat({ userContextSummary, faceImage, generatedImages, isActive = true }: WellbeingAdvisorChatProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; suggestions?: string[] }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-advisor-chat', handleOpenChat);
    return () => window.removeEventListener('open-advisor-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    // Initialize speech recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      let speechLang = 'en-US';
      if (language === 'Arabic') speechLang = 'ar-SA';
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings or click the camera/microphone icon in the URL bar to enable it.');
        } else {
          alert(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setInputText("");
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      const initChat = async () => {
        setIsLoading(true);
        try {
          const res = await generateAdvisorWelcome(userContextSummary, language);
          setMessages([{ role: 'model', text: res.text, suggestions: res.suggestions }]);
        } catch (e) {
          setMessages([{ role: 'model', text: "Hi! I'm fully aware of your health profile. How can I help you improve your wellbeing today?" }]);
        } finally {
          setIsLoading(false);
        }
      };
      initChat();
    }
  }, [isOpen, messages.length]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText.trim();
    if (!textToSend || isLoading) return;

    if (!overrideText) setInputText("");
    
    const newMessages = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    const apiHistory = messages.map(m => ({ 
      role: m.role, 
      parts: [{ text: m.text.replace(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g, "<base64_image_hidden_for_context>") }] 
    }));
    
    try {
      const response = await sendAdvisorChatMessage(textToSend, apiHistory, userContextSummary, faceImage, generatedImages, language);
      setMessages([...newMessages, { role: 'model', text: response.text, suggestions: response.suggestions }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'model', text: "Error connecting to your advisor. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isAvailable = isActive;

  return (
    <>
      <div className="fixed bottom-[80px] md:bottom-6 right-6 z-[100] pointer-events-none">
        <AnimatePresence>
          {false && !isOpen && isAvailable && (
            <motion.button
              drag
              dragMomentum={false}
              whileDrag={{ scale: 1.1, cursor: "grabbing" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              className="bg-[#3D2B56]/70 backdrop-blur-md hover:bg-[#3D2B56]/90 text-white rounded-md p-4 flex items-center justify-center relative group cursor-grab pointer-events-auto"
            >
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                AI {language === 'English' ? 'Wellbeing Advisor' : t('Wellbeing Advisor')}
              </div>
              <MessageCircle className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-0 right-0 w-[85vw] sm:w-[400px] h-[calc(100vh-120px)] max-h-[580px] bg-white rounded-none md:rounded-lg flex flex-col overflow-hidden border border-slate-200 pointer-events-auto"
            >
              <div className="bg-[#3D2B56] p-4 flex justify-between items-center text-white shrink-0 z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#9081B1]/30 flex items-center justify-center border border-white/20">
                    <MessageCircle className="w-5 h-5 text-[#9081B1]" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-bold text-sm">{t('Wellbeing Advisor')}</h3>
                      <ModuleInfoDialog 
                        title="AI Wellbeing & Health Advisor"
                        info={{
                          purpose: "A conversational AI agent acting as a behavioral nudge engine to provide evidence-based, actionable lifestyle recommendations.",
                          dataProcessing: "Chat history and context (summarized biomarkers, mood history) are sent to Gemini API to generate contextualized responses. Context window is restricted to user-consented data.",
                          aiTransparency: "Employs an LLM with strict system prompting to prioritize empathetic, non-diagnostic lifestyle guidance. Guardrails are implemented to refuse acute medical queries.",
                          clinicalBoundaries: "Operates as a wellness and informational assistant. System prompts mandate referring the user to licensed clinical professionals for any acute medical issues or diagnostic questions."
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/70">{t('Powered by Gemini AI')}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                {messages.length === 0 && isLoading && (
                  <div className="flex justify-center mt-6">
                    <div className="bg-white border border-slate-200 rounded-none md:rounded-lg px-4 py-3 flex items-center space-x-3">
                      <Loader2 className="w-4 h-4 text-[#9081B1] animate-spin" />
                      <span className="text-sm text-slate-500 font-medium">Initializing CBT/DBT session...</span>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-none md:rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-[#3D2B56] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                      {m.role === 'user' ? (
                        <p className="text-sm">{m.text}</p>
                      ) : (
                        <div className="text-sm prose prose-sm prose-slate max-w-none">
                          <Markdown
                            urlTransform={(value) => value}
                            components={{
                              img: ({node, ...props}) => {
                                if (!props.src) return null;
                                return (
                                  <span className="relative group/img inline-block my-2 w-full max-w-sm">
                                    <img 
                                      {...props} 
                                      className="rounded-lg border border-slate-100 max-w-full cursor-pointer hover:opacity-90 transition-opacity m-0" 
                                      alt={props.alt || 'Generated'} 
                                      onClick={() => setEnlargedImage(props.src as string)}
                                    />
                                    <span className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex space-x-1.5">
                                      <button 
                                        onClick={() => setEnlargedImage(props.src as string)} 
                                        className="bg-black/60 hover:bg-black/80 p-2 rounded-md text-white backdrop-blur-sm transition-colors"
                                        title={t('Enlarge Image')}
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                      <a 
                                        href={props.src} 
                                        download={`wellbeing-advisor-image-${Date.now()}.png`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="bg-black/60 hover:bg-black/80 p-2 rounded-md text-white backdrop-blur-sm transition-colors"
                                        title={t('Download')}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </span>
                                  </span>
                                );
                              }
                            }}
                          >
                            {m.text}
                          </Markdown>
                        </div>
                      )}
                    </div>
                    {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && !isLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-2 mt-4 w-full pr-4"
                      >
                        {m.suggestions.map((sug, idx) => (
                          <motion.button 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 + 0.2 }}
                            key={idx} 
                            onClick={() => handleSend(sug)} 
                            className="group flex items-center justify-between bg-white hover:bg-[#F8F7FA] text-slate-700 hover:text-[#3D2B56] text-[13px] font-medium border border-slate-200 hover:border-[#9081B1]/40 rounded-none md:rounded-lg px-4 py-3 hover:shadow transition-all text-left"
                          >
                            <span className="pr-3 leading-snug">{sug}</span>
                            <div className="bg-slate-100 group-hover:bg-[#9081B1]/10 rounded-full p-1.5 shrink-0 transition-colors">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#9081B1]" />
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
                {isLoading && messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-none md:rounded-lg rounded-bl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 text-[#9081B1] animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-white border-t border-slate-100 space-y-2 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={t('Ask about your health plan...')}
                    className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-24 py-3 text-sm focus:ring-2 focus:ring-[#9081B1]/50 outline-none"
                  />
                  <div className="absolute right-1 top-1 flex space-x-1">
                    <button
                      onClick={toggleRecording}
                      className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                      title="Use Voice"
                    >
                      {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !inputText.trim()}
                      className="p-2 bg-[#9081B1] hover:bg-[#3D2B56] disabled:opacity-50 disabled:hover:bg-[#9081B1] text-white rounded-md transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="absolute top-4 right-4 flex space-x-4">
              <a 
                href={enlargedImage} 
                download={`wellbeing-advisor-image-${Date.now()}.png`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()} 
                className="bg-white/10 hover:bg-white/20 p-3 rounded-md text-white transition-colors flex items-center justify-center"
                title={t('Download')}
              >
                <Download className="w-6 h-6" />
              </a>
              <button 
                onClick={() => setEnlargedImage(null)} 
                className="bg-white/10 hover:bg-white/20 p-3 rounded-md text-white transition-colors flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img 
              src={enlargedImage} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg" 
              alt="Enlarged view"
              onClick={e => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
