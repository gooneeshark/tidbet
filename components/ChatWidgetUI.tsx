import React, { useState, RefObject, memo } from 'react';
import { ChatState } from '../types';

interface ChatWidgetUIProps {
  state: ChatState;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onChangeApiKey: () => void;
  onClearApiKey: () => void;
  chatContainerRef: RefObject<HTMLDivElement>;
  messageCount: number;
  limit: number;
  hasKey: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const ChatWidgetUI: React.FC<ChatWidgetUIProps> = memo(({ 
  state, 
  onClose, 
  onSendMessage,
  onChangeApiKey,
  onClearApiKey,
  chatContainerRef,
  messageCount,
  limit,
  hasKey,
  isMuted,
  onToggleMute
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  // ฟังก์ชันสำหรับแปลง Text ธรรมดา ให้กลายเป็น Link ที่กดได้
  const formatMessage = (text: string) => {
    // Regex สำหรับจับ URL (http หรือ https)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // แยกข้อความด้วย URL
    return text.split(urlRegex).map((part, index) => {
      // ถ้าส่วนนี้ตรงกับ Regex (เป็น URL) ให้คืนค่าเป็น <a href>
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-300 underline hover:text-orange-100 break-all transition-colors"
            title="คลิกเพื่อเปิดลิ้งค์"
          >
            {part}
          </a>
        );
      }
      // ถ้าไม่ใช่ URL ก็คืนค่าเป็นข้อความปกติ
      return part;
    });
  };

  const remainingMessages = Math.max(0, limit - messageCount);

  return (
    <div className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-700 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 border-b border-zinc-700 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center overflow-hidden border-2 border-orange-500 shadow-lg shadow-orange-900/40">
             <img 
              src="Gemnee.png" 
              alt="Mascot" 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const fallback = "https://raw.githubusercontent.com/P200p/bundle_widget/main/public/logo/gemnee.webp";
                if (img.dataset.errorHandled) return;
                img.dataset.errorHandled = "true";
                img.onerror = null;
                img.src = fallback;
              }}
            />
          </div>
          <div>
            <h3 className="text-white font-bold leading-none tracking-tight">กูเจมนี่ (Goo Gemnee)</h3>
            <span className="text-[10px] text-green-400 flex items-center gap-1 mt-1 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              กวนประสาทแบบเรียลไทม์
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasKey && (
            <div className="text-[10px] bg-zinc-800 border border-zinc-700 rounded-full px-2 py-1 text-zinc-400">
              เหลือ <span className={remainingMessages <= 1 ? "text-red-500 font-bold" : "text-orange-500"}>{remainingMessages}</span> รอบ
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(v => !v)}
              className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full"
              aria-label="Settings"
              title="ตั้งค่า API Key"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.7 1.7 0 0 0 .33 1.87l.05.05a2 2 0 0 1-1.41 3.41h-.08a1.7 1.7 0 0 0-1.53 1.05 1.7 1.7 0 0 0-.2.8v.08a2 2 0 0 1-3.41 1.41l-.05-.05A1.7 1.7 0 0 0 9 21.4a1.7 1.7 0 0 0-1.87.33l-.05.05A2 2 0 0 1 3.66 20v-.08a1.7 1.7 0 0 0-1.05-1.53 1.7 1.7 0 0 0-.8-.2h-.08A2 2 0 0 1 .32 14.78l.05-.05A1.7 1.7 0 0 0 .6 12a1.7 1.7 0 0 0-.33-1.87l-.05-.05A2 2 0 0 1 1.63 4.67h.08a1.7 1.7 0 0 0 1.53-1.05 1.7 1.7 0 0 0 .2-.8v-.08A2 2 0 0 1 6.85 1.33l.05.05A1.7 1.7 0 0 0 9 2.6a1.7 1.7 0 0 0 1.87-.33l.05-.05A2 2 0 0 1 14.33 3.63v.08a1.7 1.7 0 0 0 1.05 1.53 1.7 1.7 0 0 0 .8.2h.08A2 2 0 0 1 20 7.15l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .33 1.87l.05.05A2 2 0 0 1 19.4 15z" />
              </svg>
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    onChangeApiKey();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  เปลี่ยน API Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    onClearApiKey();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-800"
                >
                  ลบ API Key
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onToggleMute}
            className={`transition-colors p-2 rounded-full ${isMuted ? 'text-zinc-500 hover:text-white' : 'text-orange-500 hover:text-orange-400'}`}
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9c2.475 2.475 2.475 6.475 0 8.95m-7.071 1.176l-4.707-4.707H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L11.293 16.707z" />
              </svg>
            )}
          </button>

          <button 
            onClick={onClose}
            aria-label="ปิดแชท"
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-zinc-900 relative"
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
        
        {state.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md transition-all ${
                msg.role === 'user' 
                  ? 'bg-orange-600 text-white rounded-br-none ring-1 ring-white/10' 
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none ring-1 ring-white/5'
              }`}
            >
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {/* เรียกใช้ฟังก์ชัน formatMessage แทนการแสดง msg.text ตรงๆ */}
                {formatMessage(msg.text)}
              </div>
              <div className={`text-[10px] mt-1 font-medium ${msg.role === 'user' ? 'text-orange-200' : 'text-zinc-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {state.isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 rounded-2xl rounded-bl-none p-4 border border-zinc-700 shadow-inner">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Input */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 bg-zinc-800 border-t border-zinc-700"
      >
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={remainingMessages > 0 || hasKey ? "พิมพ์มาดิ๊ อยากโดนแดกเหรอ..." : "โควตาหมดแล้วพี่!"}
            disabled={remainingMessages === 0 && !hasKey}
            className="w-full bg-zinc-900 text-white text-sm rounded-2xl py-3.5 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-600 border border-zinc-700 transition-all placeholder:text-zinc-600 shadow-inner disabled:opacity-50"
          />
          <button 
            type="submit"
            aria-label="ส่งข้อความ"
            disabled={!inputValue.trim() || state.isLoading || (remainingMessages === 0 && !hasKey)}
            className="absolute right-2 p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all shadow-lg active:scale-90"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-zinc-500 mt-2 text-center uppercase font-bold tracking-[0.2em]">
          {hasKey ? '"แตกคือโชค แดกคือเรื่องปกติ"' : `คุยฟรีได้อีก ${remainingMessages} ครั้ง`}
        </p>
      </form>
    </div>
  );
});

export default ChatWidgetUI;