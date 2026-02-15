import React, { useState } from 'react';

const AngpaoWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // URL สำหรับเงินรางวัล/อั่งเปา (ใส่ URL ของคุณที่นี่)
  const ANGPAO_URL = "เร็วๆนี้"; 

  const toggleModal = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Angpao Button */}
      <div 
        className="fixed z-[60] flex flex-col items-center pointer-events-auto"
        style={{ bottom: '100px', right: '24px' }}
      >
        <button
          onClick={toggleModal}
          className="group relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.5)] transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-yellow-400/30 overflow-hidden"
          title="รับอั่งเปา"
        >
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Shimmer Effect */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite] pointer-events-none"></div>

          <span className="text-4xl filter drop-shadow-md group-hover:rotate-12 transition-transform duration-300">🧧</span>
          
          {/* Notification Badge */}
          <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
        </button>
        <span className="mt-2 text-[10px] font-black text-red-500 bg-white/90 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-red-200">
          รับรางวัล
        </span>
      </div>

      {/* Modal Iframe */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-950 w-full max-w-4xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.3)] border border-red-500/30 flex flex-col scale-100 animate-in zoom-in duration-500">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-600 via-red-700 to-red-800 flex justify-between items-center text-white border-b border-yellow-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">🧧</div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Angpao Rewards</h3>
                  <p className="text-[10px] font-bold text-red-200 uppercase tracking-[0.2em] opacity-80">Goo Gemnee Exclusive System</p>
                </div>
              </div>
              <button 
                onClick={toggleModal}
                className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 hover:rotate-90 transition-all font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content / Iframe */}
            <div className="flex-1 bg-zinc-900 relative">
              {ANGPAO_URL === "เร็วๆนี้" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-10 left-10 w-32 h-32 bg-red-600/10 blur-[80px] rounded-full"></div>
                  <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-600/10 blur-[80px] rounded-full"></div>
                  
                  <div className="relative">
                    <div className="text-[120px] mb-8 animate-[bounce_3s_infinite] filter drop-shadow-[0_20px_40px_rgba(220,38,38,0.4)]">🎁</div>
                    <div className="absolute -bottom-4 right-0 text-5xl animate-pulse">✨</div>
                  </div>
                  
                  <h3 className="text-5xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 animate-pulse">
                    COMING SOON
                  </h3>
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-sm text-center max-w-md leading-relaxed">
                    เตรียมตัวพบกับระบบแจกรางวัล<br/>ที่จะทำให้มึงแตกแบบไม่ทันตั้งตัว
                  </p>
                  
                  <div className="mt-12 flex gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce delay-0"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce delay-150"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              ) : (
                <iframe 
                  src={ANGPAO_URL}
                  className="w-full h-full border-none"
                  title="Angpao Giveaway"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AngpaoWidget;
