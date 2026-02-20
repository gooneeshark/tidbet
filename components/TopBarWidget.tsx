import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SlotSite } from '../types';

interface TopBarWidgetProps {
  sites: SlotSite[];
}

type TopBarPosition = 'top' | 'bottom' | 'overlay';

const THEMES = [
  { name: 'Ocean Breeze', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea' },
  { name: 'Sunset Glow', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)', accent: '#ff6b6b' },
  { name: 'Forest Dream', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', accent: '#11998e' },
  { name: 'Purple Rain', gradient: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)', accent: '#8360c3' },
  { name: 'Fire Storm', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', accent: '#ff9a9e' },
  { name: 'Cyber Punk', gradient: 'linear-gradient(135deg, #0f3460 0%, #e94560 100%)', accent: '#e94560' },
  { name: 'Golden Hour', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', accent: '#fcb69f' },
  { name: 'Deep Space', gradient: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)', accent: '#4ca1af' }
];

const TopBarWidget: React.FC<TopBarWidgetProps> = ({ sites }) => {
  const [position, setPosition] = useState<TopBarPosition>(() => {
    return (localStorage.getItem('topBarPosition') as TopBarPosition) || 'top';
  });
  const [currentTheme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [selectedSite, setSelectedSite] = useState<SlotSite | null>(null);
  const [scanState, setScanState] = useState<{ active: boolean; progress: number; results: any | null }>({
    active: false,
    progress: 0,
    results: null
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const translateXRef = useRef(0);

  // Constants for dimensions
  const BAR_HEIGHT = 70;
  const ICON_WIDTH = 80;
  const GAP = 20;
  const STEP = ICON_WIDTH + GAP;

  // Quadruple the list for seamless infinite scroll
  const extendedSites = useMemo(() => {
    if (sites.length === 0) return [];
    return [...sites, ...sites, ...sites, ...sites];
  }, [sites]);

  // Handle position changes and safe area
  useEffect(() => {
    localStorage.setItem('topBarPosition', position);
    
    const root = document.documentElement;
    const body = document.body;
    const safe = BAR_HEIGHT + 8;

    body.style.paddingTop = '';
    body.style.paddingBottom = '';
    root.style.setProperty('--goo-topbar-safe-top', '0px');
    root.style.setProperty('--goo-topbar-safe-bottom', '0px');

    if (position === 'top') {
      body.style.paddingTop = `calc(${safe}px + env(safe-area-inset-top, 0px))`;
      root.style.setProperty('--goo-topbar-safe-top', `${safe}px`);
    } else if (position === 'bottom') {
      body.style.paddingBottom = `calc(${safe}px + env(safe-area-inset-bottom, 0px))`;
      root.style.setProperty('--goo-topbar-safe-bottom', `${safe}px`);
    }
  }, [position]);

  // Auto-scroll logic using direct DOM transformation
  useEffect(() => {
    if (sites.length === 0) return;

    let animId: number;
    const animate = () => {
      if (!isDragging && containerRef.current) {
        const resetPoint = sites.length * STEP;
        translateXRef.current -= 0.5; // Scroll speed
        if (translateXRef.current <= -resetPoint * 2) {
          translateXRef.current += resetPoint;
        }
        containerRef.current.style.transform = `translateX(${translateXRef.current}px)`;
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isDragging, sites.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeft(translateXRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const walk = (e.clientX - startX) * 1.5;
    let next = scrollLeft + walk;
    
    const resetPoint = sites.length * STEP;
    if (next <= -resetPoint * 2) next += resetPoint;
    if (next >= 0) next -= resetPoint;
    
    translateXRef.current = next;
    containerRef.current.style.transform = `translateX(${next}px)`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleStartScan = () => {
    setScanState({ active: true, progress: 0, results: null });
    
    // Animate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 73) {
        clearInterval(interval);
        setScanState(prev => ({ 
          ...prev, 
          progress: 73,
          results: {
            reliability: Math.floor(Math.random() * 30) + 60,
            bonus: Math.random() > 0.5 ? 'แจกจริง' : 'ต้องระวัง',
            warning: Math.random() > 0.5 ? 'อย่าเล่นเกินตัว' : 'ตั้งงบประมาณ'
          },
          active: false
        }));
      } else {
        setScanState(prev => ({ ...prev, progress: p }));
      }
    }, 150);
  };

  if (sites.length === 0) return null;

  return (
    <>
      <div 
        id="tidbetTopBar"
        className="fixed left-0 right-0 overflow-hidden backdrop-blur-md border-white/20 select-none shadow-2xl"
        style={{ 
          height: `${BAR_HEIGHT}px`, 
          background: currentTheme.gradient,
          zIndex: 100,
          bottom: position === 'bottom' ? 0 : 'auto',
          top: position === 'top' ? 0 : (position === 'overlay' ? '20px' : 'auto'),
          borderRadius: position === 'overlay' ? '1rem' : '0',
          margin: position === 'overlay' ? '0 12px' : '0',
          display: position === 'overlay' ? (selectedSite ? 'none' : 'block') : 'block'
        }}
      >
        <div 
          ref={containerRef}
          className={`h-full flex items-center px-4 gap-[20px] cursor-grab active:cursor-grabbing transform-gpu`}
          style={{ transform: `translateX(${translateXRef.current}px)` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            setIsDragging(true);
            setStartX(e.touches[0].clientX);
            setScrollLeft(translateXRef.current);
          }}
          onTouchMove={(e) => {
            if (!isDragging || !containerRef.current) return;
            const walk = (e.touches[0].clientX - startX) * 1.5;
            let next = scrollLeft + walk;
            const resetPoint = sites.length * STEP;
            if (next <= -resetPoint * 2) next += resetPoint;
            if (next >= 0) next -= resetPoint;
            translateXRef.current = next;
            containerRef.current.style.transform = `translateX(${next}px)`;
          }}
          onTouchEnd={() => setIsDragging(false)}
        >
          {extendedSites.map((site, idx) => (
            <div 
              key={`${site.name}-${idx}`}
              className="flex-shrink-0 flex flex-col items-center gap-1 group transition-transform hover:-translate-y-1"
              style={{ width: `${ICON_WIDTH}px` }}
              onClick={() => setSelectedSite(site)}
            >
              <div className="w-10 h-10 rounded-xl bg-black/20 border-2 border-white/30 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                <img 
                  src={site.logo || `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`} 
                  alt={site.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[9px] font-black text-white/90 uppercase tracking-tighter truncate w-full text-center drop-shadow-sm">
                {site.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Toggle Chip */}
      <button
        onClick={() => {
          const order: TopBarPosition[] = ['top', 'bottom', 'overlay'];
          const next = order[(order.indexOf(position) + 1) % order.length];
          setPosition(next);
        }}
        className="fixed z-[1000] px-3 py-1.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/10 shadow-lg hover:bg-black/80 transition-all"
        style={{
          left: '12px',
          top: position === 'top' ? `${BAR_HEIGHT + 12}px` : '12px',
          bottom: position === 'bottom' ? `${BAR_HEIGHT + 12}px` : 'auto'
        }}
      >
        TopBar: {position.toUpperCase()}
      </button>

      {/* Scanner Popup Modal */}
      {selectedSite && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => {
            if (!scanState.active) setSelectedSite(null);
          }}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 text-center text-white relative" style={{ background: currentTheme.gradient }}>
              <button 
                onClick={() => setSelectedSite(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
              <h3 className="text-xl font-black mb-1">🎯 เจ๊งเรทสแกนเนอร์</h3>
              <p className="text-xs opacity-80 font-bold uppercase tracking-widest">AI วิเคราะห์เพื่อมึงโดยเฉพาะ</p>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-24 h-24 rounded-3xl bg-zinc-100 border-4 border-zinc-100 shadow-xl overflow-hidden">
                  <img src={selectedSite.image || selectedSite.logo} alt={selectedSite.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black text-zinc-900">{selectedSite.name.toUpperCase()}</h4>
                  <p className="text-zinc-500 text-sm font-medium italic">"{selectedSite.tagline}"</p>
                </div>
              </div>

              {/* Scan Section */}
              <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">ผลการวิเคราะห์</span>
                  {scanState.results && (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">เสร็จสมบูรณ์</span>
                  )}
                </div>

                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden mb-6">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300" 
                    style={{ width: `${scanState.progress}%` }}
                  ></div>
                </div>

                <div className="space-y-3">
                  {!scanState.results && !scanState.active && (
                    <p className="text-zinc-400 text-center text-sm font-bold">กดปุ่ม "สแกน" เพื่อเริ่มวิเคราะห์ระบบ</p>
                  )}
                  {scanState.active && (
                    <div className="flex items-center justify-center gap-2 text-orange-500 font-bold animate-pulse">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                      <span>กำลังเจาะระบบ...</span>
                    </div>
                  )}
                  {scanState.results && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold">ความน่าเชื่อถือ:</span>
                        <span className="text-zinc-900 font-black">{scanState.results.reliability}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold">โบนัสลับ:</span>
                        <span className="text-zinc-900 font-black">{scanState.results.bonus}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold">คำเตือน:</span>
                        <span className="text-red-600 font-black">{scanState.results.warning}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleStartScan}
                  disabled={scanState.active}
                  className="py-4 rounded-xl bg-orange-600 text-white font-black hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20 disabled:opacity-50"
                >
                  {scanState.results ? 'สแกนใหม่' : 'เริ่มสแกน'}
                </button>
                <a 
                  href={selectedSite.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="py-4 rounded-xl bg-zinc-900 text-white font-black hover:bg-black transition-colors text-center shadow-lg"
                >
                  ไปเล่นเลย
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBarWidget;
