import React, { useState, useEffect } from 'react';

const AngpaoWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const ANGPAO_URL = "https://gift.truemoney.com/campaign/voucher_detail?v=019c5b2a93cc7ca3aa40ce6c156e0ddbcar"; 
  const CLAIM_KEY = 'redPacket_claimed';
  const ACTIVE_DURATION = 20 * 1000; // 20 วินาที
  const COOLDOWN_DURATION = 10 * 60 * 1000; // 10 นาที

  // อัปเดตเวลาปัจจุบันทุกวินาทีเพื่อให้ Timer แม่นยำ
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // อ่านเวลาเริ่มจาก localStorage
  const getStartTime = () => {
    const data = localStorage.getItem(CLAIM_KEY);
    return data ? parseInt(data) : null;
  };

  const startTime = getStartTime();
  const elapsed = startTime ? currentTime - startTime : null;
  
  // ตรวจสอบสถานะปัจจุบัน
  const isStarted = startTime !== null;
  const isActive = isStarted && elapsed !== null && elapsed < ACTIVE_DURATION;
  const isBlocked = isStarted && elapsed !== null && elapsed >= ACTIVE_DURATION && elapsed < COOLDOWN_DURATION;
  const isReset = isStarted && elapsed !== null && elapsed >= COOLDOWN_DURATION;

  // ถ้าครบ 10 นาทีแล้ว ให้รีเซ็ตเพื่อให้กดใหม่ได้
  if (isReset) {
    localStorage.removeItem(CLAIM_KEY);
  }

  const handleConfirm = () => {
    localStorage.setItem(CLAIM_KEY, Date.now().toString());
    setCurrentTime(Date.now());
  };

  const toggleModal = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Button */}
      <div 
        className="fixed z-[60] flex flex-col items-center pointer-events-auto"
        style={{ bottom: '100px', right: '24px' }}
      >
        <button
          onClick={toggleModal}
          aria-label="เปิดรับรางวัลอั่งเปา"
          className={`group relative w-16 h-16 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center border-2 border-yellow-400/30 overflow-hidden ${isBlocked ? 'bg-zinc-800 grayscale cursor-not-allowed' : 'bg-gradient-to-br from-red-500 to-red-700 hover:scale-110 active:scale-95'}`}
        >
          <span className="text-4xl filter drop-shadow-md group-hover:rotate-12 transition-transform duration-300">🧧</span>
          {!isBlocked && !isActive && (
             <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          )}
        </button>
        <span className="mt-2 text-[10px] font-black text-red-500 bg-white/90 px-2 py-0.5 rounded-full uppercase shadow-sm border border-red-200">
          {isBlocked ? "คูลดาวน์" : isActive ? "กำลังรับ" : "รับรางวัล"}
        </span>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="bg-zinc-950 w-full max-w-4xl h-[85vh] rounded-[2.5rem] overflow-hidden border border-red-500/30 flex flex-col shadow-[0_0_80px_rgba(220,38,38,0.2)]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-600 to-red-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="text-2xl animate-bounce">🧧</div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Angpao Rewards</h3>
                  <p className="text-[10px] font-bold text-red-200">
                    {isActive ? `เวลาที่เหลือ: ${Math.max(0, Math.ceil((ACTIVE_DURATION - elapsed!) / 1000))} วินาที` : "Goo Gemnee Exclusive"}
                  </p>
                </div>
              </div>
              <button onClick={toggleModal} aria-label="ปิดเมนู" className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
            </div>

            <div className="flex-1 bg-zinc-900 relative">
              {!isStarted ? (
                /* 1. หน้าข้อความก่อนกด "ยืนยัน" */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950">
                  <div className="text-7xl mb-6">🎁</div>
                  <h2 className="text-3xl font-black text-white mb-4">พร้อมรับรางวัลหรือยัง?</h2>
                  <p className="text-zinc-400 font-bold mb-8 max-w-md">
                    มึงมีเวลากรอกเบอร์ <span className="text-yellow-400 text-xl">20 วินาที</span> หลังจากกดปุ่ม "ยืนยัน" <br/>
                    ถ้ากดไม่ทัน หรือกดย้อนกลับ ถือว่าสละสิทธิ์รอบนี้ทันที!
                  </p>
                  <button 
                    onClick={handleConfirm}
                    className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black rounded-full text-xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                  >
                    ยืนยัน (เริ่มนับเวลา)
                  </button>
                </div>
              ) : isActive ? (
                /* 2. หน้า Iframe เมื่อเวลากำลังเดิน */
                <div className="w-full h-full">
                  <iframe 
                    src={ANGPAO_URL}
                    className="w-full h-full border-none"
                    title="Angpao Giveaway"
                  />
                  {/* แถบเตือนเวลาด้านบน Iframe */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-1000" 
                      style={{ width: `${(1 - elapsed! / ACTIVE_DURATION) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* 3. หน้าหมดเวลา (Blocked) */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-950">
                  <div className="text-8xl mb-6 grayscale">🧧</div>
                  <h3 className="text-4xl font-black text-red-600 mb-4">หมดเวลารับรางวัล!</h3>
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] mb-2">
                    แบ่งให้เพื่อนคนอื่นได้รวยบ้าง
                  </p>
                  <div className="text-zinc-600 text-sm mt-4 p-4 border border-zinc-800 rounded-xl">
                    รอรอบถัดไปในอีกประมาณ {Math.ceil((COOLDOWN_DURATION - elapsed!) / 60000)} นาที
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AngpaoWidget;