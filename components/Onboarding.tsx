
import React, { useState } from 'react';

interface OnboardingProps {
  onSelectKey: () => void;
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onSelectKey, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [step, setStep] = useState(0);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      // บันทึก API Key ลง localStorage
      localStorage.setItem('gemnee_api_key', apiKey.trim());
      onSelectKey();
    }
  };

  // ถ้ามี API Key อยู่แล้ว ให้ข้ามไปเลย
  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemnee_api_key');
    if (savedKey) {
      onSelectKey();
    }
  }, [onSelectKey]);

  return (
    <div className="mb-4 w-[350px] sm:w-[400px] h-[450px] bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-orange-500/50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
        <h3 className="text-orange-500 font-bold">ใส่ API Key ของคุณ! (BYOK)</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
        <div className="w-full mb-6 group relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          <img 
            src="/api1.png" 
            alt="API Key Setup"
            className="w-full h-48 object-contain transition-transform group-hover:scale-105"
          />
        </div>
        
        <h4 className="text-xl font-bold text-white mb-2">นำ API Key ของคุณมาใส่!</h4>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          ไปขอ API Key ฟรีจาก Google AI Studio แล้วนำมาใส่ในช่องด้านล่าง
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-2 px-2">
              Google AI Studio API Key
            </label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="วาง API Key ของคุณที่นี่..."
              className="w-full bg-black/60 border-2 border-zinc-700 focus:border-orange-500 text-white rounded-xl px-4 py-3 transition-all outline-none text-base font-medium"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02]"
          >
            เริ่มใช้งานกูเจมนี่!
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            ไปขอ API Key ฟรีที่ Google AI Studio
          </a>
          <p className="text-[10px] text-zinc-500">
            ใช้โควต้าฟรีของ Google หรือเพิ่ม Billing เพื่อใช้งานได้เต็มประสิทธิภาพ
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
