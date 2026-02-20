
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message, ChatState, SlotSite } from './types';
import { getSystemInstruction } from './constants';
import ChatWidgetUI from './components/ChatWidgetUI';
import Onboarding from './components/Onboarding';
import GoostoryEmbed from './components/GoostoryEmbed';
import AngpaoWidget from './components/AngpaoWidget';
import { generateGooSpeech, decode, decodeAudioData } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        role: 'model',
        text: 'ไงมึง! อยากโดนแดกหรืออยากแตกแบบฟลุ๊คๆ? มีไรว่ามา "กูเจมนี่" พร้อมขยี้แล้ว!',
        timestamp: new Date()
      }
    ],
    isLoading: false,
    isOpen: false,
  });

  const [hasKey, setHasKey] = useState<boolean>(false);
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 }); // Bottom-right offset
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastClickTime = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [availableSites, setAvailableSites] = useState<SlotSite[]>([]);

  // Limit for free messages before requiring own API key
  const FREE_MESSAGE_LIMIT = 5;

  useEffect(() => {
    const checkKey = async () => {
      // ตรวจสอบว่ามี API Key ใน localStorage หรือไม่ (BYOK)
      const savedKey = localStorage.getItem('gemnee_api_key');
      setHasKey(!!savedKey);
    };
    checkKey();
  }, []);

  useEffect(() => {
    fetch('/card.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.sites) {
          setAvailableSites(data.sites);
        }
      })
      .catch(err => console.error("Failed to load external sites for AI context:", err));
  }, []);

  useEffect(() => {
    const sync = () => {
      const savedKey = localStorage.getItem('gemnee_api_key');
      setHasKey(!!savedKey);
    };
    window.addEventListener('gemnee-api-key-changed', sync as EventListener);
    return () => window.removeEventListener('gemnee-api-key-changed', sync as EventListener);
  }, []);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const toggleWidget = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const handleOpenKeyDialog = () => {
    // เปิดหน้า Onboarding สำหรับใส่ API Key (BYOK)
    window.dispatchEvent(new CustomEvent('open-api-setup'));
  };

  const handleChangeApiKey = () => {
    localStorage.removeItem('gemnee_api_key');
    window.dispatchEvent(new CustomEvent('gemnee-api-key-changed'));
    window.dispatchEvent(new CustomEvent('open-api-setup'));
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemnee_api_key');
    window.dispatchEvent(new CustomEvent('gemnee-api-key-changed'));
  };

  useEffect(() => {
    const handleSetupEvent = () => {
      handleOpenKeyDialog();
    };
    window.addEventListener('open-api-setup', handleSetupEvent);
    return () => window.removeEventListener('open-api-setup', handleSetupEvent);
  }, []);

  const playSpeech = async (text: string) => {
    if (isMuted) return;
    const userApiKey = localStorage.getItem('gemnee_api_key');
    if (!userApiKey) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('Generating speech for:', text);
      const base64Audio = await generateGooSpeech(text, userApiKey);
      if (!base64Audio) {
        console.warn('No audio data received from Gemini');
        return;
      }
      console.log('Audio data received, decoding...');

      const audioData = decode(base64Audio);
      // Gemini 1.5 Flash/3 Flash TTS format (24kHz Mono PCM)
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
      console.log('Audio buffer created, duration:', audioBuffer.duration);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      console.log('Audio playback started');
    } catch (error) {
      console.error('Speech rendering failed:', error);
    }
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || state.isLoading) return;

    // ใช้ API Key จาก localStorage (BYOK)
    const userApiKey = localStorage.getItem('gemnee_api_key');
    if (!userApiKey) {
      // ถ้าไม่มี API Key ให้แสดงหน้า Onboarding
      window.dispatchEvent(new CustomEvent('open-api-setup'));
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));
    
    setUserMessageCount(prev => prev + 1);

    try {
      // ใช้ API Key ของผู้ใช้แทน environment variable
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const model = 'gemini-3-flash-preview'; // ใช้รุ่น 3 ตามที่ต้องการ

      const history = state.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const stream = await ai.models.generateContentStream({
        model,
        contents: [...history, { role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction: getSystemInstruction(availableSites.map(s => s.name)),
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        }
      });

      const assistantMessageId = (Date.now() + 1).toString();
      let fullResponse = '';

      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: assistantMessageId, role: 'model', text: '', timestamp: new Date() }
        ]
      }));

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => 
            m.id === assistantMessageId ? { ...m, text: fullResponse } : m
          )
        }));
      }

      // --- จุดที่เพิ่มเพื่อให้มีเสียง ---
      if (fullResponse) {
        try {
          const base64Audio = await generateGooSpeech(fullResponse, userApiKey);
          if (base64Audio) {
            const audioData = decode(base64Audio);
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Gemini TTS มักจะส่งมาที่ 24000Hz
            const buffer = await decodeAudioData(audioData, audioCtx, 24000, 1);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);
          }
        } catch (audioErr) {
          console.error("Audio Playback Error:", audioErr);
        }
      }
    } catch (error: any) {
      console.error('Gemini Error:', error);
      if (error?.message?.includes("Requested entity was not found")) {
        setHasKey(false);
      }
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { 
            id: Date.now().toString(), 
            role: 'model', 
            text: 'เออออ... ระบบกูพังว่ะ สงสัยมึงยังไม่ได้ใส่ API Key หรือ Key มึงมีปัญหา ไปเช็คดูดิ๊!', 
            timestamp: new Date() 
          }
        ]
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages, state.isLoading, userMessageCount, hasKey, availableSites]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.messages]);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate distance from right/bottom edges to the mouse/touch, minus current offset
    dragStartPos.current = { 
      x: (window.innerWidth - clientX) - pos.x, 
      y: (window.innerHeight - clientY) - pos.y 
    };
    lastClickTime.current = Date.now();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const currentRight = window.innerWidth - clientX;
      const currentBottom = window.innerHeight - clientY;
      
      const newX = currentRight - dragStartPos.current.x;
      const newY = currentBottom - dragStartPos.current.y;
      
      // Screen bounds (stay within viewport)
      const margin = 10;
      const maxX = window.innerWidth - 85; 
      const maxY = window.innerHeight - 85;
      
      setPos({
        x: Math.max(margin, Math.min(newX, maxX)),
        y: Math.max(margin, Math.min(newY, maxY))
      });
    };
    
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

  const showOnboarding = state.isOpen && !hasKey;

  return (
    <div className="relative w-full h-screen bg-black">

      <GoostoryEmbed sites={availableSites} />
      <AngpaoWidget />

      <div 
        className="fixed z-[9999] flex flex-col items-end pointer-events-none"
        style={{ bottom: pos.y, right: pos.x }}
      >
        {state.isOpen && (
          <div className="pointer-events-auto">
            {showOnboarding ? (
              <Onboarding onSelectKey={() => {
                window.dispatchEvent(new CustomEvent('gemnee-api-key-changed'));
              }} onClose={toggleWidget} />
            ) : (
              <ChatWidgetUI 
                state={state} 
                onClose={toggleWidget} 
                onSendMessage={handleSendMessage}
                onChangeApiKey={handleChangeApiKey}
                onClearApiKey={handleClearApiKey}
                chatContainerRef={chatContainerRef}
                messageCount={userMessageCount}
                limit={FREE_MESSAGE_LIMIT}
                hasKey={hasKey}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(prev => !prev)}
              />
            )}
          </div>
        )}
        
        <button
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
          onClick={(e) => {
            const clickDuration = Date.now() - lastClickTime.current;
            if (clickDuration < 500) {
              toggleWidget();
            }
          }}
          aria-label="เปิดเมนูช่วยเหลือ"
          className={`w-20 h-20 pointer-events-auto rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center transform hover:scale-110 transition-transform duration-300 active:scale-90 group relative overflow-hidden bg-zinc-900 border-4 border-orange-600 ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'}`}
        >
          <img 
            src="Gemnee.png" 
            alt="Mascot" 
            className="w-full h-full object-cover p-1 transition-transform group-hover:rotate-12"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = "https://raw.githubusercontent.com/P200p/bundle_widget/main/public/logo/gemnee.webp";
              if (img.dataset.errorHandled) return;
              img.dataset.errorHandled = "true";
              img.onerror = null;
              img.src = fallback;
            }}
          />
          {state.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
